# BucketAI — Intelligent Enterprise Remark Bucketisation & Discovery

BucketAI is an enterprise-grade utility that automatically discovers semantic categories from free-text remarks in Excel (.xlsx, .xls) and CSV files without requiring pre-labeled training data or expensive cloud database infrastructure.

The application processes data locally in the browser, caches reusable sentence embeddings in IndexedDB, features type-aware grouped row filtering with explicit boolean logic, and produces enriched Excel workbooks that preserve existing charts, drawings, and formatting.

---

## 5-Step Guided Workflow

1. **Step 1 — Upload**:
   - Drag-and-drop or file browsing for `.xlsx`, `.xls`, and `.csv`.
   - Displays file name, size, sheet count, row count, and column count.
   - Quick pre-loaded enterprise sample datasets (Procurement PO Remarks, IT Incident Tickets).
   - Automatically advances to Data Preview upon valid file selection.

2. **Step 2 — Data Preview**:
   - Scrollable representative table preview with column letter indicators (A, B, ... K, ... AB).
   - Worksheet selection for multi-sheet workbooks.
   - Summarizes total rows, columns, blank cells, and duplicate remarks while preserving original data.

3. **Step 3 — Column Mapping & Conditional Row Filtering**:
   - **Column Mapping**: Auto-detects primary key and remarks columns with support for optional context columns.
   - **Conditional Row Filtering**:
     - Visual rule builder supporting grouped conditions combined using **AND** or **OR** (e.g. `(Column K is null OR Column K > 100) AND Column AB is true`).
     - Type-aware operators: `is null`, `is not null`, `equals`, `does not equal`, `greater than`, `greater than or equal to`, `less than`, `less than or equal to`, `contains`, `does not contain`, `starts with`, `is true`, `is false`.
     - Invert filter option (NOT).
     - Live preview showing exact included and excluded row counts.
     - Save and load named filter presets.
     - **Non-matching rows remain 100% untouched in the output workbook.**

4. **Step 4 — Bucketisation**:
   - Granularity slider: **Broad**, **Balanced**, **Detailed**, or **Custom K** count.
   - Dual embedding engines:
     - **Fast Semantic Feature Extractor**: 384-dimensional subword and n-gram vectorizer (instant, handles 100,000 rows in seconds with zero network downloads).
     - **Transformers.js Neural Embedder**: `Xenova/all-MiniLM-L6-v2` via browser ONNX runtime.
   - Automatic category discovery using spherical K-means and agglomerative topic dendrogram cuts.
   - Live category renaming, merging, and reclustering splits.
   - Optional Gemini 3.8 Flash batch labeling for concise business titles.

5. **Step 5 — Results & Chart-Preserving Export**:
   - KPI metrics: total rows, included rows, excluded rows, discovered buckets, review flags.
   - Interactive Recharts size distribution bar chart.
   - Inspect bucket drawer with search and row reassignment.
   - Final data preview before download.
   - **Chart Preservation Guarantee**: Injects enriched columns (`Bucket_ID`, `Bucket_Name`, `Bucket_Description`, `Assignment_Confidence`, `Review_Required`) directly into the workbook archive without recreating the file, keeping embedded charts, drawings, and formatting intact.
   - Formula injection sanitization on all cell values.

---

## Gemini API Key Configuration

BucketAI uses the server-side proxy `/api/gemini/label-buckets` or a Netlify serverless function (`netlify/functions/gemini-label.ts`) to query Gemini. **The API key is never exposed to browser bundles or client-side code.**

When running locally or deploying, set the environment variable:

```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

If the key is omitted or the Gemini API is unreachable, BucketAI automatically falls back to local TF-IDF keyphrase extraction. All clustering, deduplication, filtering, and export capabilities remain fully operational offline.

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Start local full-stack server
npm run dev

# Run automated linter
npm run lint

# Compile production bundle
npm run build
```

Click **Tests & Diagnostics** in the navigation rail to run the built-in 10-test verification suite (including complex grouped filter tests and excluded row isolation) or benchmark 5,000, 20,000, and 100,000 rows.

---

## Deployment to Netlify

The repository includes `netlify.toml` and `netlify/functions/gemini-label.ts`:

1. Connect your repository to Netlify.
2. In Netlify Site Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
3. Add `GEMINI_API_KEY` under **Site configuration > Environment variables**.
4. Deploy the site.
