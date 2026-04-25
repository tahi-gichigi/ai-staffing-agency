// Bookkeeper Checker — Apps Script glue between a Google Sheet and the
// /api/bookkeeper/check Vercel endpoint.
//
// Sheet layout (1-indexed):
//   A Supplier  B Date  C Amount  D Description  E Agent check  F Note  G Source
// Drive folder: must contain receipt PDFs named R001_*.pdf, R002_*.pdf, ...
//                and statement.csv (Date, Description, Amount).

const PROP_FOLDER_ID = "BOOKKEEPER_FOLDER_ID";
const PROP_API_URL = "BOOKKEEPER_API_URL";
const PROP_API_TOKEN = "BOOKKEEPER_API_TOKEN";
const PROP_CACHE_PREFIX = "bk_cache_";

const COL = {
  supplier: 1,
  date: 2,
  amount: 3,
  description: 4,
  verdict: 5,
  note: 6,
  source: 7,
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Bookkeeper")
    .addItem("Run check on all rows", "runCheck")
    .addItem("Run check on selected rows", "runCheckSelected")
    .addSeparator()
    .addItem("Set Drive folder…", "setDriveFolder")
    .addItem("Set API endpoint…", "setApiUrl")
    .addItem("Set API token…", "setApiToken")
    .addSeparator()
    .addItem("Clear verdict cache", "clearCache")
    .addToUi();
}

function setDriveFolder() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt("Drive folder", "Paste folder URL or ID:", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const raw = r.getResponseText().trim();
  const m = raw.match(/[-\w]{25,}/);
  const id = m ? m[0] : raw;
  PropertiesService.getDocumentProperties().setProperty(PROP_FOLDER_ID, id);
  ui.alert("Folder set: " + id);
}

function setApiUrl() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt("API endpoint", "Full URL ending in /api/bookkeeper/check:", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getDocumentProperties().setProperty(PROP_API_URL, r.getResponseText().trim());
  ui.alert("API URL saved.");
}

function setApiToken() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt("API token", "Bearer token (BOOKKEEPER_API_TOKEN):", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getDocumentProperties().setProperty(PROP_API_TOKEN, r.getResponseText().trim());
  ui.alert("Token saved.");
}

function clearCache() {
  const props = PropertiesService.getDocumentProperties();
  const all = props.getProperties();
  let n = 0;
  for (const k of Object.keys(all)) {
    if (k.indexOf(PROP_CACHE_PREFIX) === 0) {
      props.deleteProperty(k);
      n++;
    }
  }
  SpreadsheetApp.getUi().alert("Cleared " + n + " cached verdicts.");
}

function getSettings_() {
  const p = PropertiesService.getDocumentProperties();
  const folderId = p.getProperty(PROP_FOLDER_ID);
  const apiUrl = p.getProperty(PROP_API_URL);
  const token = p.getProperty(PROP_API_TOKEN);
  if (!folderId) throw new Error("Drive folder not set. Run Bookkeeper → Set Drive folder.");
  if (!apiUrl) throw new Error("API URL not set. Run Bookkeeper → Set API endpoint.");
  if (!token) throw new Error("API token not set. Run Bookkeeper → Set API token.");
  return { folderId: folderId, apiUrl: apiUrl, token: token };
}

// Build a map of receipt prefix (e.g. "R001") -> {file, name}.
function indexReceipts_(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const out = {};
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    const m = name.match(/^(R\d{3})_/i);
    if (!m) continue;
    out[m[1].toUpperCase()] = { id: f.getId(), name: name, file: f };
  }
  return out;
}

function loadStatement_(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const it = folder.getFilesByName("statement.csv");
  if (!it.hasNext()) throw new Error("statement.csv not found in Drive folder.");
  const text = it.next().getBlob().getDataAsString();
  const lines = text.split(/\r?\n/).filter(function (l) { return l.length > 0; });
  lines.shift(); // header
  return lines.map(function (line) {
    const cells = parseCsvLine_(line);
    return {
      date: cells[0],
      description: cells[1],
      amount: parseFloat(cells[2]),
    };
  });
}

function parseCsvLine_(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line.charAt(i);
    if (inQ) {
      if (c === '"' && line.charAt(i + 1) === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function runCheck() {
  runCheckRange_(null);
}

function runCheckSelected() {
  const sel = SpreadsheetApp.getActiveSheet().getActiveRange();
  if (!sel) throw new Error("No selection.");
  const start = sel.getRow();
  const end = start + sel.getNumRows() - 1;
  runCheckRange_({ start: start, end: end });
}

function runCheckRange_(range) {
  const settings = getSettings_();
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("No data rows.");

  const startRow = range ? Math.max(range.start, 2) : 2;
  const endRow = range ? Math.min(range.end, lastRow) : lastRow;

  // Ensure header columns E,F,G exist.
  const headers = sheet.getRange(1, 1, 1, 7).getValues()[0];
  if (!headers[COL.verdict - 1]) sheet.getRange(1, COL.verdict).setValue("Agent check");
  if (!headers[COL.note - 1]) sheet.getRange(1, COL.note).setValue("Note");
  if (!headers[COL.source - 1]) sheet.getRange(1, COL.source).setValue("Source");

  const data = sheet.getRange(startRow, 1, endRow - startRow + 1, 4).getValues();
  const receipts = indexReceipts_(settings.folderId);
  const statement = loadStatement_(settings.folderId);
  const props = PropertiesService.getDocumentProperties();

  // Find duplicate row groups (same supplier + amount + month).
  const allRows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const dupMap = {};
  for (let i = 0; i < allRows.length; i++) {
    for (let j = 0; j < allRows.length; j++) {
      if (i === j) continue;
      const a = allRows[i], b = allRows[j];
      if (!a[0] || !b[0]) continue;
      if (
        String(a[0]).toLowerCase() === String(b[0]).toLowerCase() &&
        Math.abs(parseFloat(a[2]) - parseFloat(b[2])) < 0.01 &&
        String(a[1]).slice(0, 7) === String(b[1]).slice(0, 7)
      ) {
        const k = i + 2;
        if (!dupMap[k]) dupMap[k] = [];
        dupMap[k].push(j + 2);
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    const rowNum = startRow + i;
    const supplier = String(data[i][0] || "").trim();
    const dateRaw = data[i][1];
    const amount = parseFloat(data[i][2]);
    const description = String(data[i][3] || "");
    if (!supplier || !amount) continue;

    const date = formatDate_(dateRaw);
    const rowIdx = rowNum - 1; // 1-based row in the data range (matches test-matcher)
    const prefix = "R" + pad3_(rowIdx);
    const receiptFile = receipts[prefix] || null;

    const twins = (dupMap[rowNum] || []).filter(function (r) { return r < rowNum; });
    const rowsHaveDuplicates = twins.length > 0
      ? { matchingRowIndices: twins.map(function (r) { return r - 1; }) }
      : undefined;

    const cacheKey = PROP_CACHE_PREFIX + Utilities.base64EncodeWebSafe(
      [supplier, date, amount, receiptFile ? receiptFile.id : "", twins.join(",")].join("|")
    ).slice(0, 90);
    const cached = props.getProperty(cacheKey);
    if (cached) {
      const v = JSON.parse(cached);
      writeVerdict_(sheet, rowNum, v);
      continue;
    }

    sheet.getRange(rowNum, COL.verdict).setValue("…checking");
    SpreadsheetApp.flush();

    let body = {
      row: { supplier: supplier, date: date, amount: amount, description: description },
      statement: statement,
    };
    if (receiptFile) {
      const blob = receiptFile.file.getBlob();
      body.receipt = {
        base64: Utilities.base64Encode(blob.getBytes()),
        filename: receiptFile.name,
      };
    } else {
      body.receipt = null;
    }
    if (rowsHaveDuplicates) body.rowsHaveDuplicates = rowsHaveDuplicates;

    let verdict;
    try {
      const resp = UrlFetchApp.fetch(settings.apiUrl, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + settings.token },
        payload: JSON.stringify(body),
        muteHttpExceptions: true,
      });
      const code = resp.getResponseCode();
      const text = resp.getContentText();
      if (code !== 200) {
        verdict = { verdict: "error", note: "HTTP " + code + ": " + text.slice(0, 200), sourceRef: null };
      } else {
        verdict = JSON.parse(text);
      }
    } catch (e) {
      verdict = { verdict: "error", note: String(e).slice(0, 200), sourceRef: null };
    }

    writeVerdict_(sheet, rowNum, verdict);
    if (verdict.verdict !== "error") {
      props.setProperty(cacheKey, JSON.stringify(verdict));
    }
  }
}

function writeVerdict_(sheet, rowNum, v) {
  sheet.getRange(rowNum, COL.verdict).setValue(v.verdict || "");
  sheet.getRange(rowNum, COL.note).setValue(v.note || "");
  let src = "";
  if (v.sourceRef) {
    src = v.sourceRef.file || "";
    if (v.sourceRef.line) src += " :: " + v.sourceRef.line;
  }
  sheet.getRange(rowNum, COL.source).setValue(src);
}

function formatDate_(v) {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  return String(v).slice(0, 10);
}

function pad3_(n) {
  return ("000" + n).slice(-3);
}
