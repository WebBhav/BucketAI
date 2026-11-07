import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  PieChart,
  BarChart3,
  CheckCircle2,
  Lock,
  Cpu,
  Database,
  Server,
  FileCheck2,
  Table
} from 'lucide-react';
import { SAMPLE_DATASETS, SampleDatasetMeta } from '../data/sampleDatasets';

interface LandingPageProps {
  onStartUtility: () => void;
  onFileUpload: (file: File) => void;
  onLoadSample: (sample: SampleDatasetMeta) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartUtility,
  onFileUpload,
  onLoadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. ORIGINAL FIRST SCREEN — EXACTLY PRESERVED AS REQUIRED                 */}
      {/* ========================================================================= */}
      <div className="min-h-screen flex flex-col justify-between bg-dot-grid relative border-b border-zinc-900">
        {/* Top Header */}
        <header className="border-b border-zinc-800/80 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
            <span className="font-bold text-sm tracking-tight text-white">BucketAI</span>
          </div>

          <button
            onClick={onStartUtility}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-md transition-all cursor-pointer"
          >
            Open App
          </button>
        </header>

        {/* Main Hero & Upload Area (Adobe Acrobat online tool inspired clarity) */}
        <main className="max-w-3xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Turn unstructured remarks into <span className="text-rose-500">meaningful buckets</span>.
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Automatically discover semantic categories from free-text Excel remarks directly in your browser.
              Preserves 100% of your original rows, columns, and charts.
            </p>
          </div>

          {/* Central Clean Upload Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all bg-zinc-900/60 ${
              isDragging
                ? 'border-rose-500 bg-rose-950/20'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-zinc-850 border border-zinc-750 text-rose-500 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Select an Excel or CSV file
                </p>
                <p className="text-xs text-zinc-400">
                  or drag and drop your workbook here
                </p>
              </div>

              <button
                type="button"
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md shadow-sm transition-all cursor-pointer"
              >
                Choose File
              </button>
            </div>
          </div>

          {/* Quick Sample Dataset Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
            <span>Or explore with a demo:</span>
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onLoadSample(sample)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
                <span>{sample.title}</span>
              </button>
            ))}
          </div>

          {/* Understated Feature Summary with compact labels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-zinc-900 text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Private: in-browser processing</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Fast deduplication &amp; clustering</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Chart &amp; formula preserving export</span>
            </div>
          </div>
        </main>

        {/* Scroll Indicator */}
        <div className="pb-6 text-center text-xs text-zinc-600 flex items-center justify-center gap-1.5">
          <span>Scroll to explore product overview</span>
          <span className="text-zinc-500">↓</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRODUCT INFORMATION WEBPAGE BELOW THE EXISTING UPLOAD SCREEN          */}
      {/* ========================================================================= */}

      {/* SECTION A — THE PRODUCT */}
      <section className="py-24 sm:py-32 px-6 lg:px-8 max-w-6xl mx-auto w-full border-b border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block">
            THE PRODUCT
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            From Messy Remarks to Meaningful Insights.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            BucketAI discovers patterns in unstructured spreadsheet data and transforms them into meaningful categories.
          </p>
        </div>

        {/* Horizontal Pipeline Illustration: <Spreadsheet> → <AI Semantic Grouping> → <Structured Buckets> → <Analytics> */}
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative items-stretch">
            {/* 1. Spreadsheet */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-2 border-b border-zinc-900">
                <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <Table className="w-3.5 h-3.5 text-zinc-400" /> Raw Spreadsheet
                </span>
                <span className="text-[10px] text-zinc-500">Input</span>
              </div>
              <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
                <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 truncate text-zinc-300">
                  “Payment not received on due date”
                </div>
                <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 truncate text-zinc-300">
                  “Delivery was delayed by freight carrier”
                </div>
                <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 truncate text-zinc-300">
                  “Invoice amount mismatch against PO”
                </div>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                4,820 free-text rows
              </div>
            </div>

            {/* 2. AI Semantic Grouping */}
            <div className="rounded-xl border border-rose-950/70 bg-rose-950/10 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs text-rose-400 font-mono pb-2 border-b border-rose-950/50">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Cpu className="w-3.5 h-3.5 text-rose-500" /> Semantic Grouping
                </span>
                <span className="text-[10px] text-rose-400">AI Engine</span>
              </div>
              <div className="py-2 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600/20 text-rose-500 border border-rose-600/40">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-white">Contextual Vectors</div>
                <div className="text-[11px] text-zinc-400">Groups meaning, not just exact keywords</div>
              </div>
              <div className="text-[10px] font-mono text-rose-400/80 pt-1 border-t border-rose-950/50 text-center">
                Spherical K-Means Discovery
              </div>
            </div>

            {/* 3. Structured Buckets */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-2 border-b border-zinc-900">
                <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-rose-500" /> Standardized Buckets
                </span>
                <span className="text-[10px] text-zinc-500">Clusters</span>
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 flex justify-between items-center text-zinc-200">
                  <span className="truncate">Payment Issues</span>
                  <span className="text-rose-400 font-bold ml-1">42%</span>
                </div>
                <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 flex justify-between items-center text-zinc-200">
                  <span className="truncate">Delivery Delays</span>
                  <span className="text-zinc-400 font-bold ml-1">31%</span>
                </div>
                <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 flex justify-between items-center text-zinc-200">
                  <span className="truncate">Product Quality</span>
                  <span className="text-zinc-500 font-bold ml-1">17%</span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                Clear taxonomy &amp; counts
              </div>
            </div>

            {/* 4. Analytics */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-2 border-b border-zinc-900">
                <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Analytics &amp; Export
                </span>
                <span className="text-[10px] text-zinc-500">Result</span>
              </div>
              <div className="py-2 space-y-2">
                <div className="h-10 flex items-end gap-1.5 px-2">
                  <div className="w-1/3 bg-rose-500 h-full rounded-t" />
                  <div className="w-1/3 bg-zinc-500 h-3/4 rounded-t" />
                  <div className="w-1/3 bg-zinc-700 h-2/5 rounded-t" />
                </div>
                <div className="text-[10px] text-zinc-400 text-center font-mono">
                  Native OpenXML Excel Summary
                </div>
              </div>
              <div className="text-[10px] font-mono text-emerald-400/90 pt-1 border-t border-zinc-900 flex items-center justify-between">
                <span>100% rows preserved</span>
                <FileCheck2 className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B — THE PROBLEM AND SOLUTION */}
      <section className="py-24 sm:py-32 px-6 lg:px-8 max-w-6xl mx-auto w-full border-b border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block">
            COMPARISON
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Stop Categorising Manually.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Eliminate hours of manual row-by-row reading with automated semantic classification.
          </p>
        </div>

        {/* Visual Before & After comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: BEFORE */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
                BEFORE
              </span>
              <h3 className="text-base font-bold text-white">Unstructured Spreadsheet</h3>
              <p className="text-xs text-zinc-400">
                Repetitive free text, inconsistent terminology, and zero category structure.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-850 bg-zinc-900/50 p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500 pb-1 border-b border-zinc-800 text-[10px]">
                <span>Remark Text</span>
                <span>Category</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-850 flex justify-between items-center text-zinc-400 text-[11px]">
                <span className="truncate max-w-[220px]">Payment not received on time</span>
                <span className="text-zinc-600 italic">[None]</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-850 flex justify-between items-center text-zinc-400 text-[11px]">
                <span className="truncate max-w-[220px]">Supplier delivery late by 5 days</span>
                <span className="text-zinc-600 italic">[None]</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-850 flex justify-between items-center text-zinc-400 text-[11px]">
                <span className="truncate max-w-[220px]">Wire transfer pending clearance</span>
                <span className="text-zinc-600 italic">[None]</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-850 flex justify-between items-center text-zinc-400 text-[11px]">
                <span className="truncate max-w-[220px]">Damaged carton with broken seals</span>
                <span className="text-zinc-600 italic">[None]</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-500">
              ✕ Inconsistent reporting · Hours of manual tagging
            </div>
          </div>

          {/* Right: AFTER */}
          <div className="rounded-2xl border border-rose-950/70 bg-gradient-to-b from-rose-950/20 to-zinc-950 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono text-rose-400 uppercase tracking-wider block font-semibold">
                AFTER BUCKETAI
              </span>
              <h3 className="text-base font-bold text-white">Clean Structured Intelligence</h3>
              <p className="text-xs text-zinc-400">
                Meaningful buckets, quantified counts, and high assignment confidence.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400 pb-1 border-b border-zinc-800 text-[10px]">
                <span>Standardized Category</span>
                <span>Rows</span>
                <span>Share</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Payment Issues
                </span>
                <span className="text-zinc-400">1,420</span>
                <span className="text-rose-400 font-bold">42.5%</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  Delivery Delays
                </span>
                <span className="text-zinc-400">910</span>
                <span className="text-zinc-300 font-bold">31.2%</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  Product Quality
                </span>
                <span className="text-zinc-400">480</span>
                <span className="text-zinc-300 font-bold">16.4%</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  Documentation
                </span>
                <span className="text-zinc-400">290</span>
                <span className="text-zinc-300 font-bold">9.9%</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Automated classification · Ready for executive reporting</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C — HOW IT WORKS */}
      <section className="py-24 sm:py-32 px-6 lg:px-8 max-w-6xl mx-auto w-full border-b border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Three Simple Steps.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            From raw spreadsheet to structured workbook in minutes.
          </p>
        </div>

        {/* 3 Visual Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Configure */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs font-bold flex items-center justify-center">
                01
              </span>
              <h3 className="text-lg font-bold text-white">Configure</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Upload your spreadsheet, select the worksheet, map your columns, and apply optional filters.
              </p>
            </div>

            {/* Illustration: Spreadsheet & column mapping */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 font-mono text-[11px]">
              <div className="text-zinc-400 text-[10px] pb-1 border-b border-zinc-900 flex justify-between">
                <span>Mapping Schema</span>
                <span className="text-rose-400">Target Sheet</span>
              </div>
              <div className="p-2 rounded bg-zinc-900/70 border border-zinc-850 flex justify-between items-center text-zinc-300">
                <span>Primary Key:</span>
                <span className="text-white font-bold">Ticket_ID</span>
              </div>
              <div className="p-2 rounded bg-rose-950/30 border border-rose-900/50 flex justify-between items-center text-rose-300">
                <span>Remarks:</span>
                <span className="text-white font-bold">Resolution_Notes</span>
              </div>
            </div>
          </div>

          {/* Step 2: Discover */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="w-7 h-7 rounded-lg bg-rose-600/20 text-rose-500 font-mono text-xs font-bold flex items-center justify-center border border-rose-600/40">
                02
              </span>
              <h3 className="text-lg font-bold text-white">Discover</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                AI analyses remarks semantically and groups similar observations into meaningful buckets.
              </p>
            </div>

            {/* Illustration: Text snippets to grouped categories */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 font-mono text-[11px]">
              <div className="text-zinc-400 text-[10px] pb-1 border-b border-zinc-900 flex justify-between">
                <span>Semantic Clustering</span>
                <span className="text-rose-400">In-Browser</span>
              </div>
              <div className="p-1.5 rounded bg-zinc-900/70 border border-zinc-850 text-zinc-400 truncate text-[10px]">
                “Card authorization failed” →
              </div>
              <div className="p-1.5 rounded bg-zinc-900/70 border border-zinc-850 text-zinc-400 truncate text-[10px]">
                “Payment gateway timed out” →
              </div>
              <div className="p-2 rounded bg-rose-950/40 border border-rose-900/50 text-white font-semibold flex justify-between items-center">
                <span>Bucket: Payment Issues</span>
                <span className="text-[10px] text-rose-400 font-bold">High Conf</span>
              </div>
            </div>
          </div>

          {/* Step 3: Analyse */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs font-bold flex items-center justify-center">
                03
              </span>
              <h3 className="text-lg font-bold text-white">Analyse</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Review categories, explore charts, and export your structured Excel workbook.
              </p>
            </div>

            {/* Illustration: Analytics dashboard & Excel export */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 font-mono text-[11px]">
              <div className="text-zinc-400 text-[10px] pb-1 border-b border-zinc-900 flex justify-between">
                <span>Interactive Output</span>
                <span className="text-emerald-400">Excel Preserved</span>
              </div>
              <div className="h-9 flex items-end gap-1.5 px-2">
                <div className="w-1/3 bg-rose-500 h-full rounded-t" />
                <div className="w-1/3 bg-zinc-500 h-3/4 rounded-t" />
                <div className="w-1/3 bg-zinc-700 h-1/2 rounded-t" />
              </div>
              <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-[10px] text-center">
                Download Enriched .XLSX + Summary Sheet
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D — CAPABILITIES */}
      <section className="py-24 sm:py-32 px-6 lg:px-8 max-w-6xl mx-auto w-full border-b border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block">
            CAPABILITIES
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Everything You Need. Nothing You Don&apos;t.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Practical tools designed for enterprise spreadsheets without unnecessary bloat.
          </p>
        </div>

        {/* 4 Compact Capabilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1 */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Semantic Grouping</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Discovers clusters based on contextual meaning rather than rigid keyword matching.
            </p>
          </div>

          {/* 2 */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
              <Filter className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Smart Filtering</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Type-aware operators with grouped AND/OR logic. Excluded rows remain untouched.
            </p>
          </div>

          {/* 3 */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">AI-Assisted Naming</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Optionally refines bucket names and descriptions via Gemini from sample remarks.
            </p>
          </div>

          {/* 4 */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Analytics &amp; Excel Export</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Interactive Bar/Pie charts and enriched OpenXML Excel export with native charts.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION E — PRIVACY */}
      <section className="py-24 sm:py-32 px-6 lg:px-8 max-w-4xl mx-auto w-full border-b border-zinc-900">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block">
            PRIVACY
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Designed With Privacy in Mind.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Semantic processing happens locally in the browser. Optional AI naming uses a controlled backend integration.
          </p>
        </div>

        {/* Browser-Processing Illustration */}
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <Lock className="w-4 h-4 text-emerald-400" /> Client-Side Processing
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Spreadsheet rows are parsed, filtered, and clustered in your browser session.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <Server className="w-4 h-4 text-zinc-400" /> Controlled AI Proxy
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Optional bucket renaming sends only representative samples. API keys stay server-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F — FOOTER */}
      <footer className="py-12 px-6 lg:px-8 max-w-6xl mx-auto w-full text-xs text-zinc-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
            <span className="font-bold text-white text-sm">BucketAI</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400 text-xs">
              Automated remark bucketisation &amp; semantic discovery.
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Back to Upload ↑
            </button>
            <span>·</span>
            <button
              onClick={onStartUtility}
              className="text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer"
            >
              Open Application →
            </button>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="pt-6 text-center text-xs text-zinc-500">
          Built by{' '}
          <a
            href="https://vaibhav-singhal.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
          >
            Vaibhav Singhal
          </a>
        </div>
      </footer>
    </div>
  );
};
