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
// Browser API key for the Google Picker. Set via menu (one-time per Apps Script
// project). Get one from https://console.cloud.google.com → enable Picker API
// → create credentials → API key.
const PROP_PICKER_KEY = "BOOKKEEPER_PICKER_KEY";
// JSON: {supplier, date, amount, description} as 1-indexed column numbers.
// Verdict/Note/Source are derived as description+1, +2, +3.
const PROP_COLUMN_MAPPING = "column_mapping";
const PROP_CACHE_PREFIX = "bk_cache_";
// Tracks rows the user has manually edited in cols E-G. Skip these on future runs
// unless the user explicitly forces a re-check.
const PROP_TOUCHED_PREFIX = "touched_";
// Tracks rows queued by onEdit for delayed firing. Value is the timestamp when
// the row became "complete". The time-based trigger picks them up after debounce.
const PROP_PENDING_PREFIX = "pending_";
// Debounce window before onEdit-scheduled rows fire. Prevents firing on every keystroke.
const DEBOUNCE_MS = 10 * 1000;
// Stale pending entries older than this are dropped (e.g. after a script error).
const PENDING_STALE_MS = 60 * 60 * 1000;
// Tracks an in-progress batched run. Lets us survive the 6-min Apps Script
// execution limit by processing rows in chunks with continuation triggers.
const PROP_BATCH_STATE = "batch_state";
// Rows per chunk. Cold vision calls are ~4s, cached runs ~1s. 75 cold rows
// = ~5 min, comfortably under the 6-min Apps Script limit. For typical small
// sheets the whole thing finishes in one chunk and no continuation fires.
const BATCH_CHUNK_SIZE = 75;
// If a batch hasn't progressed in this long, treat it as crashed and reset.
const BATCH_STALE_MS = 10 * 60 * 1000;

// Reads the user's column mapping from properties (set via the Mapper modal).
// Falls back to the demo defaults so existing fixture sheets keep working.
// Verdict/Note/Source are always the 3 columns immediately to the right of
// Description so the mapper only has to ask about input columns.
function getMapping_() {
  const props = PropertiesService.getDocumentProperties();
  const raw = props.getProperty(PROP_COLUMN_MAPPING);
  let m;
  if (raw) {
    try {
      m = JSON.parse(raw);
    } catch (e) {
      m = null;
    }
  }
  if (!m || !m.supplier || !m.date || !m.amount || !m.description) {
    m = { supplier: 1, date: 2, amount: 3, description: 4 };
  }
  m.verdict = m.description + 1;
  m.note = m.description + 2;
  m.source = m.description + 3;
  return m;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Bookkeeper")
    .addItem("Run check on all rows", "runCheck")
    .addItem("Run check on selected rows", "runCheckSelected")
    .addItem("Force re-check selected rows", "forceCheckSelected")
    .addItem("Cancel running batch", "cancelBatch")
    .addSeparator()
    .addItem("Connect source folder…", "showPicker")
    .addItem("Set column mapping…", "showMapper")
    .addSeparator()
    .addItem("Set API endpoint…", "setApiUrl")
    .addItem("Set API token…", "setApiToken")
    .addItem("Set Picker API key…", "setPickerApiKey")
    .addSeparator()
    .addItem("Install auto-check trigger", "installTriggers")
    .addItem("Remove auto-check trigger", "removeTriggers")
    .addSeparator()
    .addItem("Open trust page", "openTrustPage")
    .addSeparator()
    .addItem("Clear verdict cache", "clearCache")
    .addItem("Clear dismissed flags", "clearTouched")
    .addToUi();
}

// Opens the /checker/log trust page in a new tab. Derived from the configured
// /check endpoint so the user only has to set one URL.
function openTrustPage() {
  const apiUrl = PropertiesService.getDocumentProperties().getProperty(PROP_API_URL);
  if (!apiUrl) {
    SpreadsheetApp.getUi().alert("Set the API endpoint first (Bookkeeper → Set API endpoint).");
    return;
  }
  const trustUrl = apiUrl.replace(/\/api\/bookkeeper\/check\/?$/, "") + "/checker/log";
  const safeUrl = trustUrl.replace(/"/g, "&quot;");
  const html = HtmlService.createHtmlOutput(
    '<script>window.open("' + safeUrl + '", "_blank");google.script.host.close();</script>'
  ).setWidth(100).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, "Opening trust page");
}

// Posts a heartbeat to /api/bookkeeper/state with the row count from the run
// that just finished. Best-effort: failures are swallowed so a state-store
// outage never poisons a successful batch.
function pingState_(rowCount) {
  try {
    const apiUrl = PropertiesService.getDocumentProperties().getProperty(PROP_API_URL);
    const token = PropertiesService.getDocumentProperties().getProperty(PROP_API_TOKEN);
    if (!apiUrl || !token) return;
    const url = apiUrl.replace(/\/check\/?$/, "") + "/state";
    UrlFetchApp.fetch(url, {
      method: "put",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify({
        lastRunAt: new Date().toISOString(),
        lastRunRows: rowCount,
      }),
      muteHttpExceptions: true,
    });
  } catch (e) {
    Logger.log("pingState_ failed: " + (e && e.message ? e.message : e));
  }
}

// Opens the Google Picker dialog for choosing a Drive folder. Replaces the
// old URL-prompt flow. Config is injected as a single JSON blob so a bad
// template substitution can't break script parsing.
function showPicker() {
  const props = PropertiesService.getDocumentProperties();
  const apiKey = props.getProperty(PROP_PICKER_KEY) || "";
  const cfg = {
    oauthToken: ScriptApp.getOAuthToken(),
    apiKey: apiKey,
    // Apps Script doesn't cleanly expose the GCP project number; Picker tolerates
    // its absence in most cases. Left empty.
    appId: "",
  };
  const tmpl = HtmlService.createTemplateFromFile("Picker");
  tmpl.configJson = JSON.stringify(cfg);
  const html = tmpl.evaluate().setWidth(440).setHeight(360);
  SpreadsheetApp.getUi().showModalDialog(html, "Connect source folder");
}

// Called from Picker.html on folder selection.
function setFolderFromPicker(folderId) {
  if (!folderId) throw new Error("No folder ID supplied.");
  PropertiesService.getDocumentProperties().setProperty(PROP_FOLDER_ID, folderId);
}

// Opens the column-mapper modal pre-populated with the active sheet's headers
// and any existing mapping.
function showMapper() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = Math.max(sheet.getLastColumn(), 4);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });

  // Pre-fill: existing mapping if set, otherwise auto-detect from header text.
  const props = PropertiesService.getDocumentProperties();
  const raw = props.getProperty(PROP_COLUMN_MAPPING);
  let current;
  if (raw) {
    try { current = JSON.parse(raw); } catch (e) { current = null; }
  }
  if (!current) {
    current = autoDetectMapping_(headers);
  }

  const tmpl = HtmlService.createTemplateFromFile("Mapper");
  tmpl.headers = headers;
  tmpl.current = current;
  const html = tmpl.evaluate().setWidth(520).setHeight(440);
  SpreadsheetApp.getUi().showModalDialog(html, "Set column mapping");
}

// Heuristic mapping based on header text. Used as the modal's initial guess
// when no mapping has been saved yet.
function autoDetectMapping_(headers) {
  const guess = { supplier: 1, date: 2, amount: 3, description: 4 };
  const want = {
    supplier: ["supplier", "vendor", "merchant", "payee", "name"],
    date: ["date", "when", "transaction date", "txn date"],
    amount: ["amount", "total", "value", "cost", "price"],
    description: ["description", "note", "memo", "details", "narration"],
  };
  for (const field of Object.keys(want)) {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].toLowerCase();
      if (!h) continue;
      for (const kw of want[field]) {
        if (h === kw || h.indexOf(kw) !== -1) {
          guess[field] = i + 1;
          break;
        }
      }
    }
  }
  return guess;
}

// Called from Mapper.html on save.
function setMapping(mapping) {
  if (!mapping || !mapping.supplier || !mapping.date || !mapping.amount || !mapping.description) {
    throw new Error("All four columns must be set.");
  }
  PropertiesService.getDocumentProperties().setProperty(
    PROP_COLUMN_MAPPING,
    JSON.stringify(mapping)
  );
}

function setPickerApiKey() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt(
    "Picker API key",
    "Browser API key from Google Cloud Console (Picker API enabled):",
    ui.ButtonSet.OK_CANCEL
  );
  if (r.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getDocumentProperties().setProperty(PROP_PICKER_KEY, r.getResponseText().trim());
  ui.alert("Picker API key saved.");
}

// Simple trigger. Fires on every cell edit. Two responsibilities:
// 1) Cols A-D edited: if the row is now complete and unchecked, queue it for
//    a delayed agent run (debounced via the time-based trigger).
// 2) Cols E-G edited: the user is overriding the agent's verdict. Set the
//    touched flag so future runs skip this row.
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  // Only act on the active data sheet, not on tabs like "statement".
  if (sheet.getName().toLowerCase() === "statement") return;
  const row = e.range.getRow();
  const col = e.range.getColumn();
  if (row < 2) return;

  const props = PropertiesService.getDocumentProperties();
  const m = getMapping_();

  // Verdict columns (Verdict / Note / Source) — user is dismissing or restoring.
  if (col >= m.verdict && col <= m.source) {
    const newVal = e.value === undefined ? "" : String(e.value).trim();
    if (newVal === "") {
      props.deleteProperty(PROP_TOUCHED_PREFIX + row);
    } else {
      props.setProperty(PROP_TOUCHED_PREFIX + row, "1");
    }
    return;
  }

  // Only fire on edits to the four mapped input columns.
  const inputCols = [m.supplier, m.date, m.amount, m.description];
  if (inputCols.indexOf(col) === -1) return;

  // Check if the row is now complete and not yet checked.
  const lastCol = m.source;
  const rowVals = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  const supplier = String(rowVals[m.supplier - 1] || "").trim();
  const date = rowVals[m.date - 1];
  const amount = rowVals[m.amount - 1];
  const description = String(rowVals[m.description - 1] || "").trim();
  const verdict = String(rowVals[m.verdict - 1] || "").trim();

  const complete = supplier && date && amount && description;
  const touched = props.getProperty(PROP_TOUCHED_PREFIX + row);

  if (complete && !verdict && !touched) {
    props.setProperty(PROP_PENDING_PREFIX + row, String(Date.now()));
  } else {
    // Row no longer complete or already checked: drop any stale pending entry.
    props.deleteProperty(PROP_PENDING_PREFIX + row);
  }
}

// Called by the time-based trigger every minute. Fires the agent on any pending
// rows whose debounce window has elapsed.
function processPendingChecks() {
  const props = PropertiesService.getDocumentProperties();
  const all = props.getProperties();
  const now = Date.now();
  const toRun = [];

  for (const k of Object.keys(all)) {
    if (k.indexOf(PROP_PENDING_PREFIX) !== 0) continue;
    const ts = parseInt(all[k], 10);
    if (isNaN(ts)) {
      props.deleteProperty(k);
      continue;
    }
    // Stale entries (e.g. left over after an error) get cleared.
    if (now - ts > PENDING_STALE_MS) {
      props.deleteProperty(k);
      continue;
    }
    if (now - ts >= DEBOUNCE_MS) {
      const row = parseInt(k.slice(PROP_PENDING_PREFIX.length), 10);
      if (!isNaN(row)) toRun.push(row);
    }
  }

  if (toRun.length === 0) return;

  // Fetch extracts once for the pending batch. If extraction fails (e.g. API
  // down), still run the rows - they'll just get the no-receipt path.
  let extracts = [];
  try {
    extracts = fetchExtracts_(getSettings_());
  } catch (err) {
    console.error("processPendingChecks fetchExtracts_: " + err);
  }

  // Sort so the user sees them filled top-to-bottom.
  toRun.sort(function (a, b) { return a - b; });
  for (const row of toRun) {
    try {
      runCheckRange_({ start: row, end: row, extracts: extracts });
    } catch (err) {
      // Don't let one bad row block the rest.
      console.error("processPendingChecks row " + row + ": " + err);
    }
    props.deleteProperty(PROP_PENDING_PREFIX + row);
  }
}

function installTriggers() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActive();
  const sheetId = sheet.getId();
  // Remove any existing processPendingChecks triggers for this script before
  // creating a fresh one (avoids accidental duplicates).
  const existing = ScriptApp.getProjectTriggers();
  for (const t of existing) {
    if (t.getHandlerFunction() === "processPendingChecks") {
      ScriptApp.deleteTrigger(t);
    }
  }
  ScriptApp.newTrigger("processPendingChecks").timeBased().everyMinutes(1).create();
  ui.alert(
    "Auto-check installed.\n\n" +
    "When you finish typing into a row (cols A-D), the agent will run within ~1 minute. " +
    "Edit cols E-G to dismiss a flag and the agent won't overwrite that row again."
  );
}

function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let n = 0;
  for (const t of triggers) {
    if (t.getHandlerFunction() === "processPendingChecks") {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  }
  SpreadsheetApp.getUi().alert("Removed " + n + " auto-check trigger(s).");
}

// Diagnostic: dumps current settings + a sample fetchExtracts_ result so we can
// see if the API URL, token, folder, and pre-pass are all wired correctly.
// Run from the Apps Script editor (Run → diagnose).
function diagnose() {
  const props = PropertiesService.getDocumentProperties();
  Logger.log("API URL: " + props.getProperty(PROP_API_URL));
  Logger.log("API token (first 12 chars): " + (props.getProperty(PROP_API_TOKEN) || "").slice(0, 12) + "…");
  Logger.log("Folder ID: " + props.getProperty(PROP_FOLDER_ID));
  Logger.log("Picker key set: " + !!props.getProperty(PROP_PICKER_KEY));
  Logger.log("Column mapping: " + props.getProperty(PROP_COLUMN_MAPPING));

  try {
    const settings = getSettings_();
    const extracts = fetchExtracts_(settings);
    Logger.log("Extracts returned: " + extracts.length);
    if (extracts.length > 0) {
      Logger.log("First extract: " + JSON.stringify(extracts[0]));
    }
  } catch (e) {
    Logger.log("fetchExtracts_ error: " + e);
  }
}

function clearTouched() {
  const props = PropertiesService.getDocumentProperties();
  const all = props.getProperties();
  let n = 0;
  for (const k of Object.keys(all)) {
    if (k.indexOf(PROP_TOUCHED_PREFIX) === 0) {
      props.deleteProperty(k);
      n++;
    }
  }
  SpreadsheetApp.getUi().alert("Cleared " + n + " dismissed flag(s).");
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

// Run the OCR pre-pass: enumerate every PDF in the source folder, send them
// to /api/bookkeeper/extract-batch, and return the structured extracts. The
// server-side cache (SHA-256 of PDF bytes) means re-runs hit cache for free.
function fetchExtracts_(settings) {
  const folder = DriveApp.getFolderById(settings.folderId);
  const it = folder.getFiles();
  const pdfs = [];
  while (it.hasNext()) {
    const f = it.next();
    if (f.getMimeType() !== "application/pdf") continue;
    pdfs.push({
      fileId: f.getId(),
      filename: f.getName(),
      base64: Utilities.base64Encode(f.getBlob().getBytes()),
    });
  }
  if (pdfs.length === 0) return [];

  // /extract-batch lives next to /check. Derive its URL from the configured
  // /check endpoint so users only have to set one URL.
  const url = settings.apiUrl.replace(/\/check\/?$/, "") + "/extract-batch";
  const resp = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + settings.token },
    payload: JSON.stringify({ pdfs: pdfs }),
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error(
      "extract-batch failed: HTTP " +
      resp.getResponseCode() +
      " " +
      resp.getContentText().slice(0, 200)
    );
  }
  const data = JSON.parse(resp.getContentText());
  return data.extracts || [];
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
  startBatch_(null);
}

function runCheckSelected() {
  const sel = SpreadsheetApp.getActiveSheet().getActiveRange();
  if (!sel) throw new Error("No selection.");
  const start = sel.getRow();
  const end = start + sel.getNumRows() - 1;
  startBatch_({ start: start, end: end });
}

// Force-check ignores the touched flag, so the agent will overwrite verdicts
// the user previously dismissed.
function forceCheckSelected() {
  const sel = SpreadsheetApp.getActiveSheet().getActiveRange();
  if (!sel) throw new Error("No selection.");
  const start = sel.getRow();
  const end = start + sel.getNumRows() - 1;
  startBatch_({ start: start, end: end, force: true });
}

// Lets the user abort an in-progress batched run.
function cancelBatch() {
  const props = PropertiesService.getDocumentProperties();
  if (!props.getProperty(PROP_BATCH_STATE)) {
    SpreadsheetApp.getUi().alert("No batch run in progress.");
    return;
  }
  props.deleteProperty(PROP_BATCH_STATE);
  cleanupContinuationTriggers_();
  SpreadsheetApp.getActive().toast("Batch run cancelled.", "Bookkeeper", 5);
}

// Initialises a batched run. Single-row ranges (from onEdit) skip the batch
// system and go straight to runCheckRange_ since they don't need chunking.
function startBatch_(range) {
  const props = PropertiesService.getDocumentProperties();

  // Refuse to start if another batch is already running, unless that one is stale.
  const existing = props.getProperty(PROP_BATCH_STATE);
  if (existing) {
    const state = JSON.parse(existing);
    if (Date.now() - state.lastChunkAt < BATCH_STALE_MS) {
      throw new Error(
        "A batch run is already in progress (started at " +
        new Date(state.startedAt).toLocaleTimeString() +
        "). Wait for it to finish or use Cancel running batch."
      );
    }
    // Stale: clean up and start fresh.
    props.deleteProperty(PROP_BATCH_STATE);
    cleanupContinuationTriggers_();
  }

  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("No data rows.");

  const startRow = range ? Math.max(range.start, 2) : 2;
  const endRow = range ? Math.min(range.end, lastRow) : lastRow;
  const force = range && range.force === true;

  // Pre-pass: extract every PDF in the source folder before processing rows.
  // Subsequent chunks reuse the result via state.extracts. The server-side
  // SHA-256 cache means PDFs unchanged from earlier runs hit cache for free.
  SpreadsheetApp.getActive().toast("Reading receipts from Drive…", "Bookkeeper", 5);
  const settings = getSettings_();
  const extracts = fetchExtracts_(settings);

  const state = {
    sheetName: sheet.getName(),
    startRow: startRow,
    endRow: endRow,
    currentRow: startRow,
    force: force,
    startedAt: Date.now(),
    lastChunkAt: Date.now(),
    extracts: extracts,
  };
  props.setProperty(PROP_BATCH_STATE, JSON.stringify(state));

  // Run the first chunk inline so the user gets immediate feedback.
  processNextChunk();
}

// Called both inline (from startBatch_) and by the continuation time-trigger.
// Processes one chunk; if rows remain, schedules the next chunk.
function processNextChunk() {
  const props = PropertiesService.getDocumentProperties();
  const raw = props.getProperty(PROP_BATCH_STATE);
  if (!raw) return;
  const state = JSON.parse(raw);

  const sheet = SpreadsheetApp.getActive().getSheetByName(state.sheetName);
  if (!sheet) {
    props.deleteProperty(PROP_BATCH_STATE);
    cleanupContinuationTriggers_();
    return;
  }

  const chunkEnd = Math.min(state.currentRow + BATCH_CHUNK_SIZE - 1, state.endRow);
  const total = state.endRow - state.startRow + 1;
  const completedSoFar = state.currentRow - state.startRow;

  SpreadsheetApp.getActive().toast(
    "Rows " + state.currentRow + " to " + chunkEnd + " (" + completedSoFar + "/" + total + " done)",
    "Bookkeeper",
    5
  );

  runCheckRange_({
    start: state.currentRow,
    end: chunkEnd,
    force: state.force,
    extracts: state.extracts,
  });

  // Refresh state.
  state.currentRow = chunkEnd + 1;
  state.lastChunkAt = Date.now();

  if (state.currentRow > state.endRow) {
    props.deleteProperty(PROP_BATCH_STATE);
    cleanupContinuationTriggers_();
    pingState_(total);
    SpreadsheetApp.getActive().toast(
      "Done. " + total + " row(s) processed.",
      "Bookkeeper",
      5
    );
    return;
  }

  props.setProperty(PROP_BATCH_STATE, JSON.stringify(state));

  // Schedule continuation. 1s after gives Apps Script time to clean up before
  // the next execution starts. The trigger is one-shot; new one created per chunk.
  ScriptApp.newTrigger("processNextChunk").timeBased().after(1000).create();
}

function cleanupContinuationTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === "processNextChunk") {
      ScriptApp.deleteTrigger(t);
    }
  }
}

function runCheckRange_(range) {
  const settings = getSettings_();
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("No data rows.");

  const startRow = range ? Math.max(range.start, 2) : 2;
  const endRow = range ? Math.min(range.end, lastRow) : lastRow;
  const force = range && range.force === true;
  // Pre-extracted receipts from /extract-batch. The server matches each row
  // to an extract by content (supplier + amount + date) instead of relying
  // on a filename convention.
  const extracts = (range && range.extracts) || [];

  const m = getMapping_();
  const lastNeededCol = m.source;

  // Ensure header columns for verdict/note/source exist.
  const headers = sheet.getRange(1, 1, 1, lastNeededCol).getValues()[0];
  if (!headers[m.verdict - 1]) sheet.getRange(1, m.verdict).setValue("Agent check");
  if (!headers[m.note - 1]) sheet.getRange(1, m.note).setValue("Note");
  if (!headers[m.source - 1]) sheet.getRange(1, m.source).setValue("Source");

  // Read input columns for the working range. We pull a wide block so dupes
  // in cols beyond startRow's range are still visible.
  const data = sheet.getRange(startRow, 1, endRow - startRow + 1, lastNeededCol).getValues();
  const statement = loadStatement_(settings.folderId);
  const props = PropertiesService.getDocumentProperties();

  // Find duplicate row groups (same supplier + amount + month) across the whole sheet.
  const allRows = sheet.getRange(2, 1, lastRow - 1, lastNeededCol).getValues();
  const dupMap = {};
  for (let i = 0; i < allRows.length; i++) {
    for (let j = 0; j < allRows.length; j++) {
      if (i === j) continue;
      const a = allRows[i], b = allRows[j];
      const aSupplier = a[m.supplier - 1];
      const bSupplier = b[m.supplier - 1];
      if (!aSupplier || !bSupplier) continue;
      const aAmount = parseFloat(a[m.amount - 1]);
      const bAmount = parseFloat(b[m.amount - 1]);
      const aDate = String(a[m.date - 1] || "").slice(0, 7);
      const bDate = String(b[m.date - 1] || "").slice(0, 7);
      if (
        String(aSupplier).toLowerCase() === String(bSupplier).toLowerCase() &&
        Math.abs(aAmount - bAmount) < 0.01 &&
        aDate === bDate
      ) {
        const k = i + 2;
        if (!dupMap[k]) dupMap[k] = [];
        dupMap[k].push(j + 2);
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    const rowNum = startRow + i;
    const supplier = String(data[i][m.supplier - 1] || "").trim();
    const dateRaw = data[i][m.date - 1];
    const amount = parseFloat(data[i][m.amount - 1]);
    const description = String(data[i][m.description - 1] || "");
    if (!supplier || !amount) continue;

    // Skip rows the user has manually edited unless force is true.
    if (!force && props.getProperty(PROP_TOUCHED_PREFIX + rowNum)) {
      continue;
    }

    const date = formatDate_(dateRaw);

    const twins = (dupMap[rowNum] || []).filter(function (r) { return r < rowNum; });
    const rowsHaveDuplicates = twins.length > 0
      ? { matchingRowIndices: twins.map(function (r) { return r - 1; }) }
      : undefined;

    // Cache key includes the count of available extracts so adding/removing
    // PDFs from the folder invalidates stale verdicts.
    const cacheKey = PROP_CACHE_PREFIX + Utilities.base64EncodeWebSafe(
      [supplier, date, amount, twins.join(","), "x" + extracts.length].join("|")
    ).slice(0, 90);
    const cached = props.getProperty(cacheKey);
    if (cached) {
      const v = JSON.parse(cached);
      writeVerdictSilent_(sheet, m, rowNum, v);
      continue;
    }

    sheet.getRange(rowNum, m.verdict).setValue("…checking");
    SpreadsheetApp.flush();

    let body = {
      row: { supplier: supplier, date: date, amount: amount, description: description },
      statement: statement,
      // Server matches the row to one of these by content. No raw PDF in the
      // request - the extract is enough.
      availableExtracts: extracts,
    };
    body.receipt = null;
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

    writeVerdictSilent_(sheet, m, rowNum, verdict);
    if (verdict.verdict !== "error") {
      props.setProperty(cacheKey, JSON.stringify(verdict));
    }
  }
}

// Writes verdict columns. onEdit ignores script-driven writes, so no special
// guarding needed here.
function writeVerdictSilent_(sheet, m, rowNum, v) {
  sheet.getRange(rowNum, m.verdict).setValue(v.verdict || "");
  sheet.getRange(rowNum, m.note).setValue(v.note || "");
  let src = "";
  if (v.sourceRef) {
    src = v.sourceRef.file || "";
    if (v.sourceRef.line) src += " :: " + v.sourceRef.line;
  }
  sheet.getRange(rowNum, m.source).setValue(src);
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

