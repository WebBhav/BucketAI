# BucketAI
### Intelligent Enterprise Remark Bucketisation & Discovery

Turn unstructured Excel remarks into meaningful, actionable categories — without manually defining buckets or training a custom model.

**[🚀 Live Demo](https://bucket-ai.netlify.app/)** · **[⚙️ Features](#-key-features)** · **[🛠️ Setup](#-getting-started)**

---

## Overview

BucketAI is an intelligent data-analysis utility that discovers semantic patterns in free-text remarks from Excel and CSV files. It helps teams transform inconsistent, unstructured text into organized categories for analysis, reporting, and decision-making.

Designed for enterprise workflows, BucketAI combines local processing, semantic clustering, conditional row filtering, and optional AI-assisted naming in a guided interface.

No pre-labelled training data or cloud database is required for core functionality.

## ✨ Key Features

- **Automatic category discovery** — identify meaningful groups from free-text remarks without predefined labels.
- **Local-first processing** — perform filtering, clustering, and data processing in the browser wherever supported.
- **Semantic embeddings** — choose between a lightweight local feature extractor and a neural sentence-embedding model.
- **Advanced row filtering** — combine type-aware conditions using explicit AND/OR logic.
- **AI-assisted naming** — optionally use Gemini to generate concise, business-friendly bucket names and descriptions.
- **Interactive results** — explore bucket distributions, inspect examples, and reassign individual rows.
- **Excel export** — enrich the workbook with bucket assignments and review indicators.
- **Reusable filters and settings** — save named filter presets and customize bucket-count preferences.
- **Privacy-conscious design** — no database credentials are needed for the core workflow; Gemini requests use a server-side proxy.

## 🧭 How It Works

BucketAI uses a guided, five-step workflow.

| Step | What happens |
|---|---|
| **1. Upload** | Import an Excel workbook or CSV file, with optional enterprise sample datasets. |
| **2. Preview** | Inspect the data, select the worksheet, and review the available columns. |
| **3. Map & Filter** | Identify the primary key and remarks column, then optionally filter rows using conditional rules. |
| **4. Bucketise** | Discover categories, adjust granularity, review assignments, and optionally improve bucket names with Gemini. |
| **5. Results & Export** | Explore bucket statistics, inspect classifications, and export the enriched workbook. |

## 🧠 Bucketisation Engine

BucketAI supports two local processing approaches:

### Lightweight semantic feature extraction
A 384-dimensional subword and n-gram vectorization approach for fast, local text representation without downloading a neural embedding model.

### Neural sentence embeddings
An optional browser-based embedding engine using Transformers.js and `Xenova/all-MiniLM-L6-v2`.

Depending on the selected engine and clustering configuration, BucketAI can use spherical K-means or hierarchical clustering to discover categories at different levels of granularity.

Users can refine the results by renaming, merging, splitting, and reassigning buckets.

> **Note:** Processing time depends on dataset size, the number of unique remarks, the selected embedding engine, and clustering settings. Performance should be benchmarked on the target environment before making scale guarantees.

## 🔎 Conditional Row Filtering

Filter the rows to be bucketised using column-aware conditions and explicit boolean logic.

Supported operators include:

- Null and non-null checks
- Equality and inequality
- Greater than, less than, and inclusive comparisons
- Text containment and prefix matching
- Boolean checks
- Optional filter inversion

For example:

```text
(Column K is null OR Column K > 100)
AND
(Column AB is true)
```

Value suggestions are drawn from the selected worksheet, helping users choose existing values without typing them manually.

Rows excluded by the filter should retain their original data and remain unbucketised in the exported workbook.

## 📊 Results & Excel Export

BucketAI provides an interactive results dashboard with:

- Total, included, and excluded row counts
- Discovered bucket counts
- Bucket distribution charts
- Review flags and assignment details
- Searchable bucket contents and row reassignment
- A final data preview before download

The enriched workbook is designed to include these additional fields:

| Column | Description |
|---|---|
| `Bucket_ID` | Identifier of the assigned bucket |
| `Bucket_Name` | Human-readable category name |
| `Bucket_Description` | Summary of the category |
| `Assignment_Confidence` | Available assignment-confidence indicator |
| `Review_Required` | Indicates records requiring manual review |

BucketAI also aims to preserve existing workbook charts, drawings, formatting, and other supported features while adding the new results.

**Important:** Workbook feature preservation depends on the underlying XLSX editing implementation. Validate chart retention and workbook integrity against representative files before relying on it for production use.

## 🤖 Gemini Integration

Gemini is used optionally to improve bucket names and descriptions using representative examples rather than making an unnecessary API call for every row.

### Configuration

Set the API key as a server-side environment variable:

```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

The application uses a server-side endpoint such as `/api/gemini/label-buckets` or a Netlify Function at `netlify/functions/gemini-label.ts`.

**Security principles**
- Never expose the API key in client-side JavaScript or browser bundles.
- Do not store the API key in browser local storage.
- Keep the core local processing workflow usable when Gemini is unavailable.
- If Gemini requests fail, preserve existing bucket names and provide a fallback where supported.

When the API key is unavailable, BucketAI can use local keyphrase extraction for bucket labels, provided that fallback is implemented and enabled.

## 🛠️ Getting Started

### Prerequisites

- Node.js and npm
- A modern browser
- A Gemini API key only if AI-assisted naming is required

### Installation

```bash
# Clone the repository
git clone YOUR_REPOSITORY_URL_HERE

# Enter the project directory
cd BucketAI

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Available scripts

```bash
npm run dev      # Start local development
npm run lint     # Run the linter
npm run build    # Build for production
```

Ensure the required scripts are configured in `package.json` for the commands above.

## 🚀 Deploy to Netlify

1. Push the project to a Git repository.
2. Import the repository into Netlify.
3. Configure the build settings:

   | Setting | Value |
   |---|---|
   | Build command | `npm run build` |
   | Publish directory | `dist` |
   | Functions directory | `netlify/functions` |

4. Add `GEMINI_API_KEY` in the site's environment-variable settings if AI-assisted naming is enabled.
5. Deploy the site and test the upload, filtering, naming, and export workflows.

The Netlify Function must be configured and deployed alongside the frontend for server-side Gemini requests to work.

## 🧪 Testing & Diagnostics

The development workflow can include automated tests for:

- Grouped AND/OR filter conditions
- Null, numeric, text, and boolean comparisons
- Worksheet switching and stale-data prevention
- Excluded-row isolation
- Bucket assignment and deduplication
- Gemini request failures and cancellation
- Workbook export integrity and chart retention
- Performance benchmarks at 5,000, 20,000, and 100,000 rows

Keep developer diagnostics separate from the main user interface, and run benchmarks on representative datasets before publishing performance claims.

## 🔐 Privacy & Data Handling

BucketAI is designed around local-first processing:

- Filtering and supported embedding/clustering operations run in the browser.
- IndexedDB can cache reusable embeddings locally.
- Gemini-assisted naming sends representative text to the configured API when enabled.
- Core functionality does not require a cloud database.

Avoid uploading confidential or personally identifiable information to external AI services unless permitted by your organization's data-handling policies.

## 🗺️ Roadmap

Potential areas for continued improvement:

- More scalable clustering for very large datasets
- Improved outlier detection and review workflows
- Additional embedding and clustering strategies
- Stronger preservation of complex Excel workbook features
- Reusable project configurations and processing reports

## 👤 Author

**Vaibhav Singhal**

Built to make enterprise remark analysis faster, more consistent, and easier to explore.

---

<p align="center">
  <strong>BucketAI</strong><br/>
  From unstructured remarks to structured insights.
</p>
