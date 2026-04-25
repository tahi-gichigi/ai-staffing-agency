# Bookkeeper Apps Script

Google Sheet glue for the bookkeeper checker. Reads receipts from a Drive folder, posts each row to the Vercel `/api/bookkeeper/check` endpoint, and writes verdicts back into columns E–G.

## One-time setup

1. **Open the Sheet** (the one with `Supplier, Date, Amount, Description` in cols A–D, header row 1).
2. **Extensions → Apps Script**. This opens a container-bound script for that sheet.
3. **Push the code with clasp**:
   ```bash
   cd lib/bookkeeper/apps-script
   npx @google/clasp login
   # Get the scriptId from the Apps Script project URL: script.google.com/.../d/<SCRIPT_ID>/edit
   cp .clasp.json.template .clasp.json
   # Edit .clasp.json and paste the scriptId
   npx @google/clasp push
   ```
   Alternative: paste the contents of `Code.gs` and `appsscript.json` (manifest, view → show manifest) directly into the Apps Script editor.
4. **Reload the sheet**. A new "Bookkeeper" menu appears.
5. **Bookkeeper → Set Drive folder**: paste the URL of the folder containing receipt PDFs + statement.csv.
6. **Bookkeeper → Set API endpoint**: `https://<your-vercel>.vercel.app/api/bookkeeper/check`.
7. **Bookkeeper → Set API token**: the value of `BOOKKEEPER_API_TOKEN` from Vercel env.

## Running

- **Bookkeeper → Run check on all rows** processes every data row.
- **Bookkeeper → Run check on selected rows** only processes the current selection.
- Verdicts are cached per (row + receipt) tuple in document properties. Use **Clear verdict cache** to force re-runs.

## Drive folder layout

```
<folder>/
  statement.csv               # Date, Description, Amount (negative for outflows)
  R001_<anything>.pdf         # Receipt for row 1
  R002_<anything>.pdf         # Receipt for row 2
  ...
```

Receipts are matched to rows by the `R{NNN}` prefix where NNN is the 1-based data row index (row 2 in the sheet = R001).

## Required scopes

- `spreadsheets.currentonly` — read/write the active sheet
- `drive.readonly` — fetch receipt PDFs and statement.csv
- `script.container.ui` — show menu + prompts
- `script.external_request` — POST to Vercel
