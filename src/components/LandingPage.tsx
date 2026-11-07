import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  ArrowDown,
  Menu,
  X,
  Layers,
  SlidersHorizontal,
  Table,
  CheckCircle2,
  Sparkles,
  PieChart,
  BarChart3,
  ShieldCheck,
  Lock,
  Cpu,
  FileDown,
  Check,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  HelpCircle,
  Database,
  Server,
  KeyRound,
  FileCheck2,
  AlertCircle
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<number>(0);

  // Monitor scroll for sticky navbar backdrop
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* ========================================================= */}
      {/* SECTION 01 — STICKY NAVIGATION BAR                        */}
      {/* ========================================================= */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 border-b ${
          isScrolled
            ? 'bg-zinc-950/90 backdrop-blur-md border-zinc-800/80 shadow-lg shadow-black/40'
            : 'bg-zinc-950/60 backdrop-blur-sm border-zinc-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Wordmark */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
              B
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                BucketAI
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block -mt-0.5">
                Spreadsheet Intelligence
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-300">
            <button
              onClick={() => scrollToSection('overview')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </button>
          </nav>

          {/* Right Action */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onStartUtility}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-950/50 transition-all cursor-pointer hover:shadow-rose-900/30 active:scale-98"
            >
              <span>Start Bucketising</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onStartUtility}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-md shadow-sm transition-all cursor-pointer"
            >
              Start
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-zinc-800 bg-zinc-950/98 px-5 py-4 space-y-3 text-sm font-medium animate-in fade-in duration-150">
            <button
              onClick={() => scrollToSection('overview')}
              className="block w-full text-left py-1.5 text-zinc-300 hover:text-white"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-1.5 text-zinc-300 hover:text-white"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-1.5 text-zinc-300 hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('privacy')}
              className="block w-full text-left py-1.5 text-zinc-300 hover:text-white"
            >
              Privacy
            </button>
            <div className="pt-2 border-t border-zinc-900">
              <button
                onClick={onStartUtility}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm"
              >
                <span>Start Bucketising</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* SECTION 02 — HERO: INTRODUCING BUCKETAI                  */}
      {/* ========================================================= */}
      <section id="overview" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-zinc-900 bg-dot-grid overflow-hidden">
        {/* Subtle radial ambient red glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-rose-950/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-900/60 bg-rose-950/40 text-rose-400 text-[11px] font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>AI-Powered Spreadsheet Intelligence</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Turn Unstructured Remarks Into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-rose-300">
                  Meaningful Insights.
                </span>
              </h1>

              {/* Supporting Description */}
              <p className="text-base text-zinc-300 leading-relaxed max-w-xl">
                Thousands of remarks. Repetitive observations. Inconsistent categories.
                BucketAI uses semantic AI to transform unstructured spreadsheet data into meaningful categories,
                helping teams identify patterns, understand recurring issues, and make better decisions.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onStartUtility}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950/60 transition-all cursor-pointer hover:shadow-rose-900/40 active:scale-98"
                >
                  <span>Start Bucketising</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Explore How It Works</span>
                  <ArrowDown className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Supporting Meta Label */}
              <div className="pt-3 flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                <span>Upload Excel or CSV · Discover semantic patterns · Export structured insights</span>
              </div>
            </div>

            {/* Right Column: Custom Product Transformation Diagram */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-5 shadow-2xl shadow-black/80 backdrop-blur-sm">
                {/* Window header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 inline-block" />
                    <span className="ml-2 font-mono text-zinc-400">BucketAI Semantic Discovery Engine</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-rose-400">
                    Live Pipeline
                  </span>
                </div>

                {/* 3-Stage Pipeline Visual */}
                <div className="pt-5 space-y-4">
                  {/* Stage 1: Unstructured Remarks Spreadsheet */}
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                        <span>Input: Unstructured Remarks Column</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">Raw Text</span>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-850 text-zinc-300 flex items-center justify-between">
                        <span className="truncate">“Payment not received on contracted due date”</span>
                        <span className="text-[10px] text-zinc-400 shrink-0 ml-2">Row 14</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-850 text-zinc-300 flex items-center justify-between">
                        <span className="truncate">“Delivery was delayed by freight carrier breakdown”</span>
                        <span className="text-[10px] text-zinc-400 shrink-0 ml-2">Row 38</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-950/70 border border-zinc-850 text-zinc-300 flex items-center justify-between">
                        <span className="truncate">“Payment is still pending clearance from buyer bank”</span>
                        <span className="text-[10px] text-zinc-400 shrink-0 ml-2">Row 72</span>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Flow Indicator */}
                  <div className="flex items-center justify-center gap-3 py-0.5 text-xs text-rose-400 font-mono">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-rose-600/60" />
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-rose-900/60 bg-rose-950/40 text-[10px]">
                      <Cpu className="w-3 h-3 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
                      Semantic Vector Discovery &amp; Clustering
                    </span>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-rose-600/60" />
                  </div>

                  {/* Stage 2: Discovered Buckets with Stats */}
                  <div className="rounded-xl border border-rose-950/60 bg-gradient-to-b from-rose-950/20 to-zinc-900/60 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-rose-500" />
                        <span>Output: Discovered Categorical Buckets</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">100% Rows Preserved</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Bucket 1 */}
                      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Payment Issues
                          </span>
                          <span className="font-mono text-[10px] text-rose-400">42%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Pending payments, wire delays, invoice mismatches
                        </p>
                      </div>

                      {/* Bucket 2 */}
                      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-zinc-400" />
                            Delivery Delays
                          </span>
                          <span className="font-mono text-[10px] text-zinc-300">31%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Transit delays, carrier breakdown, late dispatches
                        </p>
                      </div>

                      {/* Bucket 3 */}
                      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-zinc-500" />
                            Documentation Errors
                          </span>
                          <span className="font-mono text-[10px] text-zinc-300">18%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Incorrect documentation, missing test certificates
                        </p>
                      </div>

                      {/* Bucket 4 */}
                      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-zinc-600" />
                            Product Quality
                          </span>
                          <span className="font-mono text-[10px] text-zinc-300">9%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Damaged crates, broken seals, surface defects
                        </p>
                      </div>
                    </div>

                    {/* Integrated mini chart preview bar */}
                    <div className="pt-1">
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                        <div className="bg-rose-500 h-full w-[42%]" title="Payment Issues (42%)" />
                        <div className="bg-zinc-400 h-full w-[31%]" title="Delivery Delays (31%)" />
                        <div className="bg-zinc-600 h-full w-[18%]" title="Documentation Errors (18%)" />
                        <div className="bg-zinc-700 h-full w-[9%]" title="Product Quality (9%)" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* QUICK UPLOAD CALLOUT BAR                                 */}
      {/* ========================================================= */}
      <section className="border-b border-zinc-900 bg-zinc-950 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all bg-zinc-900/50 ${
              isDragging
                ? 'border-rose-500 bg-rose-950/20 shadow-md shadow-rose-950/40'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-lg bg-zinc-850 border border-zinc-750 text-rose-500 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Drop your spreadsheet here or browse
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Supports .xlsx, .xls, and .csv · Processed locally in your browser
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Choose File
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demo Datasets */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs text-zinc-400">
            <span>Or explore with pre-loaded enterprise data:</span>
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onLoadSample(sample)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 transition-colors cursor-pointer text-[11px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 03 — THE PROBLEM                                 */}
      {/* ========================================================= */}
      <section className="py-20 lg:py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14 text-left">
            <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block mb-2">
              THE PROBLEM
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Your Spreadsheets Contain Insights. But They&apos;re Buried in Unstructured Text.
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Businesses accumulate thousands of remarks across operational reports, customer feedback, procurement records,
              support tickets, and other spreadsheets. Extracting meaningful patterns from this information is often a manual
              and inconsistent process.
            </p>
          </div>

          {/* 3 Problem Areas in High-Fidelity UI Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Problem 01 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/40 p-6 flex flex-col justify-between space-y-6 hover:border-zinc-800 transition-colors">
              <div>
                <span className="text-xs font-mono text-zinc-400 block mb-2">01 / BOTTLENECK</span>
                <h3 className="text-base font-bold text-white mb-2">Manual Categorisation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Teams spend hours reading individual remarks row-by-row, identifying similarities, and manually typing category labels.
                </p>
              </div>

              {/* Visual: Tedious manual tagging mockup */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-1.5 border-b border-zinc-900">
                  <span>Row #</span>
                  <span>Remark</span>
                  <span>Manual Tag</span>
                </div>
                <div className="text-[10px] font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-600">012</span>
                    <span className="truncate max-w-[120px]">Payment failed...</span>
                    <span className="text-amber-500/80 bg-amber-950/30 px-1 rounded">Typing...</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-600">013</span>
                    <span className="truncate max-w-[120px]">Gateway timeout...</span>
                    <span className="text-zinc-600">[Empty]</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-600">014</span>
                    <span className="truncate max-w-[120px]">Card error 402...</span>
                    <span className="text-zinc-600">[Empty]</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" /> 14.5 hours estimated
                  </span>
                  <span className="font-mono">Row 12 / 4,800</span>
                </div>
              </div>
            </div>

            {/* Problem 02 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/40 p-6 flex flex-col justify-between space-y-6 hover:border-zinc-800 transition-colors">
              <div>
                <span className="text-xs font-mono text-zinc-400 block mb-2">02 / INACCURACY</span>
                <h3 className="text-base font-bold text-white mb-2">Inconsistent Classification</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Similar observations are often categorised differently by different analysts or departments, creating fragmented reporting.
                </p>
              </div>

              {/* Visual: Fragmented categories for identical issues */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                <div className="text-[10px] font-mono text-zinc-400 pb-1.5 border-b border-zinc-900">
                  Identical Root Issue Mapped Differently:
                </div>
                <div className="text-[10px] font-mono space-y-1.5">
                  <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 flex items-center justify-between">
                    <span className="text-zinc-300">“Wire bounced”</span>
                    <span className="text-rose-400 bg-rose-950/40 px-1 rounded">Bank Error</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 flex items-center justify-between">
                    <span className="text-zinc-300">“Wire returned”</span>
                    <span className="text-amber-400 bg-amber-950/40 px-1 rounded">Ops Issue</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-850 flex items-center justify-between">
                    <span className="text-zinc-300">“Transfer rejected”</span>
                    <span className="text-zinc-400 bg-zinc-800 px-1 rounded">Customer Fault</span>
                  </div>
                </div>
                <div className="pt-1 text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3 h-3 text-rose-500" /> 3 different labels for 1 issue
                </div>
              </div>
            </div>

            {/* Problem 03 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/40 p-6 flex flex-col justify-between space-y-6 hover:border-zinc-800 transition-colors">
              <div>
                <span className="text-xs font-mono text-zinc-400 block mb-2">03 / BLINDSPOT</span>
                <h3 className="text-base font-bold text-white mb-2">Hidden Operational Trends</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Without structured categorization, critical operational defects, recurring delays, and systemic customer complaints stay hidden.
                </p>
              </div>

              {/* Visual: Data buried in dark blurred table */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-mono text-zinc-400 pb-1.5 border-b border-zinc-900 flex justify-between">
                  <span>Executive Dashboard</span>
                  <span className="text-rose-400 font-bold">Unresolvable</span>
                </div>
                <div className="space-y-1.5 filter blur-[1px] select-none opacity-40">
                  <div className="h-4 bg-zinc-800 rounded w-full" />
                  <div className="h-4 bg-zinc-800 rounded w-5/6" />
                  <div className="h-4 bg-zinc-800 rounded w-4/6" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                  <span className="text-[11px] font-mono text-zinc-300 px-3 py-1 rounded bg-zinc-900 border border-zinc-700 shadow-lg">
                    Cannot aggregate free text
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 04 — THE SOLUTION                                 */}
      {/* ========================================================= */}
      <section className="py-20 lg:py-24 border-b border-zinc-900 bg-zinc-950 bg-dot-grid-fine">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14 text-left">
            <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block mb-2">
              THE BUCKETAI APPROACH
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              From Unstructured Text to Structured Intelligence.
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              BucketAI understands the semantic meaning behind remarks, discovers contextual similarities, and groups
              related observations into clean, structured categories automatically — without predefined keywords or rigid rules.
            </p>
          </div>

          {/* Large Side-by-Side Comparison: BEFORE vs AFTER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* BEFORE — Unstructured Data */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-mono uppercase tracking-wider">
                    BEFORE
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">Unstructured Raw Excel</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Chaotic, Repetitive, &amp; Inconsistent
                </h3>
                <p className="text-xs text-zinc-400">
                  Every user writes observations differently. Keyword filters miss critical variations like &ldquo;delayed&rdquo; vs &ldquo;held at dock&rdquo;.
                </p>
              </div>

              {/* Raw Table Preview */}
              <div className="rounded-xl border border-zinc-850 bg-zinc-900/50 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-2 px-3">PO_ID</th>
                      <th className="py-2 px-3">Raw Free-Text Remark</th>
                      <th className="py-2 px-3 text-right">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/60 text-zinc-300">
                    <tr>
                      <td className="py-2 px-3 text-zinc-400">PO-1042</td>
                      <td className="py-2 px-3 truncate max-w-[200px]">Payment not received on contracted date</td>
                      <td className="py-2 px-3 text-right text-zinc-400 italic">None</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-zinc-400">PO-1043</td>
                      <td className="py-2 px-3 truncate max-w-[200px]">Delivery delayed due to weather issues</td>
                      <td className="py-2 px-3 text-right text-zinc-400 italic">None</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-zinc-400">PO-1044</td>
                      <td className="py-2 px-3 truncate max-w-[200px]">Invoice amount mismatch against PO</td>
                      <td className="py-2 px-3 text-right text-zinc-400 italic">None</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-zinc-400">PO-1045</td>
                      <td className="py-2 px-3 truncate max-w-[200px]">Crates arrived crushed with broken seals</td>
                      <td className="py-2 px-3 text-right text-zinc-400 italic">None</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-zinc-400">PO-1046</td>
                      <td className="py-2 px-3 truncate max-w-[200px]">Payment is still pending clearance</td>
                      <td className="py-2 px-3 text-right text-zinc-400 italic">None</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Warning tag */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <AlertCircle className="w-4 h-4 text-zinc-500" />
                <span>Zero aggregated reporting possible without manual intervention</span>
              </div>
            </div>

            {/* AFTER — Structured Insights */}
            <div className="rounded-2xl border border-rose-900/60 bg-gradient-to-b from-rose-950/20 via-zinc-950 to-zinc-950 p-6 flex flex-col justify-between space-y-5 shadow-xl shadow-rose-950/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded border border-rose-800/80 bg-rose-950/60 text-rose-400 text-xs font-mono uppercase tracking-wider font-semibold">
                    AFTER BUCKETAI
                  </span>
                  <span className="text-xs text-rose-400 font-mono">Enriched &amp; Quantified</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Clustered, Clean, &amp; Actionable Taxonomy
                </h3>
                <p className="text-xs text-zinc-400">
                  Semantic embeddings detect meaning. Related remarks are gathered into standardized buckets with counts, confidence, and descriptions.
                </p>
              </div>

              {/* Transformed Categorical Taxonomy Table */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-2 px-3">Discovered Category</th>
                      <th className="py-2 px-3">Semantic Remarks Included</th>
                      <th className="py-2 px-3 text-right">Rows</th>
                      <th className="py-2 px-3 text-right text-rose-400">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Payment Issues
                      </td>
                      <td className="py-2 px-3 text-zinc-400 truncate max-w-[150px]">
                        Payment pending, invoice mismatch, unreceived
                      </td>
                      <td className="py-2 px-3 text-right">1,240</td>
                      <td className="py-2 px-3 text-right text-rose-400 font-bold">42.5%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        Delivery Delays
                      </td>
                      <td className="py-2 px-3 text-zinc-400 truncate max-w-[150px]">
                        Delayed delivery, freight breach, weather hold
                      </td>
                      <td className="py-2 px-3 text-right">910</td>
                      <td className="py-2 px-3 text-right text-zinc-300 font-bold">31.2%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-500" />
                        Product Quality
                      </td>
                      <td className="py-2 px-3 text-zinc-400 truncate max-w-[150px]">
                        Damaged material, defective finish, cracked
                      </td>
                      <td className="py-2 px-3 text-right">480</td>
                      <td className="py-2 px-3 text-right text-zinc-300 font-bold">16.4%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                        Documentation
                      </td>
                      <td className="py-2 px-3 text-zinc-400 truncate max-w-[150px]">
                        Missing test certificates, wrong PO number
                      </td>
                      <td className="py-2 px-3 text-right">290</td>
                      <td className="py-2 px-3 text-right text-zinc-300 font-bold">9.9%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Feature highlight */}
              <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
                <CheckCircle2 className="w-4 h-4 text-rose-500" />
                <span>Ready for instant executive charts, pivot tables, and root-cause analysis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 05 — HOW IT WORKS (CONNECTED 6-STEP WORKFLOW)     */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-20 lg:py-28 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16 text-left">
            <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block mb-2">
              SIMPLE WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Six Steps. From Spreadsheet to Actionable Insights.
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              A guided, sequential workflow that takes your existing spreadsheet and turns it into a structured,
              analyzable dataset while keeping 100% of your original rows, columns, and embedded charts safe.
            </p>
          </div>

          {/* Connected Step Cards (Alternating Layouts) */}
          <div className="space-y-12">
            {/* STEP 01 */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/40 text-rose-500 font-mono font-bold text-sm flex items-center justify-center">
                    01
                  </span>
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Step 1 — Upload</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Start With Your Spreadsheet
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Upload your Excel or CSV file. If your workbook contains multiple worksheets, select the specific sheet you want to analyse.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">XLSX</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">XLS</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">CSV</span>
                  <span className="text-zinc-500">· Multi-Sheet Support</span>
                </div>
              </div>

              {/* Illustration 01: File Upload & Worksheet Selection */}
              <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-850 text-zinc-400">
                  <span>File Inspector</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-rose-500" />
                    <div>
                      <div className="font-semibold text-white">Q3_Operations_Report.xlsx</div>
                      <div className="text-[11px] text-zinc-400">4,820 rows · 14 columns · 4 worksheets</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400">1.2 MB</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-850 flex items-center justify-between">
                  <span className="text-zinc-400">Target Worksheet:</span>
                  <div className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-white font-semibold flex items-center gap-2">
                    <span>Incident_Remarks</span>
                    <span className="text-[10px] text-rose-400">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 02 */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Illustration 02: Column Mapping */}
              <div className="lg:col-span-7 order-2 lg:order-1 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-850 text-zinc-400">
                  <span>Column Mapping Schema</span>
                  <span className="text-rose-400 font-semibold">Auto-Detected</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 text-[11px] block">Primary Key (Row Identifier)</span>
                      <span className="text-white font-bold">Ticket_ID (Column A)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">Mandatory</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-rose-400 text-[11px] block">Remarks / Comments Column</span>
                      <span className="text-white font-bold">Resolution_Notes (Column K)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-[10px] text-white font-bold">Analyzed</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 text-[11px] block">Optional Context Columns</span>
                      <span className="text-zinc-300">Department, Region, Priority</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">Enrichment</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/40 text-rose-500 font-mono font-bold text-sm flex items-center justify-center">
                    02
                  </span>
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Step 2 — Mapping</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Tell BucketAI What to Analyse
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Identify the primary key and remarks column. Optionally select additional context columns to provide more information for better categorisation.
                </p>
                <div className="pt-2 text-xs text-zinc-400 leading-relaxed">
                  Supports arbitrary Excel column names and column letters (including K, AA, AB), with intelligent auto-suggestion.
                </div>
              </div>
            </div>

            {/* STEP 03 */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/40 text-rose-500 font-mono font-bold text-sm flex items-center justify-center">
                    03
                  </span>
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Step 3 — Filter</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Focus on the Data That Matters
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Apply optional filters to analyse only the relevant records. Use text, numeric, date, boolean, and blank-value conditions. Combine multiple conditions using AND/OR logic.
                </p>
                <div className="pt-2 text-xs text-zinc-400 leading-relaxed">
                  Excluded rows remain 100% untouched and unbucketised in their original position in the exported workbook.
                </div>
              </div>

              {/* Illustration 03: Conditional Filter Builder */}
              <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-850 text-zinc-400">
                  <span>Conditional Rule Builder (Optional)</span>
                  <span className="text-zinc-400">3,420 Included · 1,400 Excluded</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Condition Group 1 (AND)</span>
                      <span className="text-rose-400 font-bold">Active</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-zinc-200">
                      <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300">Status</span>
                      <span className="text-zinc-500">equals</span>
                      <span className="px-2 py-1 rounded bg-zinc-800 text-rose-400 font-semibold">&ldquo;Open&rdquo;</span>
                      <span className="text-zinc-500 font-bold">AND</span>
                      <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300">Priority</span>
                      <span className="text-zinc-500">in</span>
                      <span className="px-2 py-1 rounded bg-zinc-800 text-white">&ldquo;P1, P2&rdquo;</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-dashed border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>+ Add Condition Rule (Greater than, Contains, Is Null...)</span>
                    <span className="text-zinc-400">Preset: Critical Incidents</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 04 */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Illustration 04: Semantic Discovery & Clustering */}
              <div className="lg:col-span-7 order-2 lg:order-1 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-850 text-zinc-400">
                  <span>Semantic Discovery &amp; Granularity</span>
                  <span className="text-rose-400 font-semibold">Spherical K-Means</span>
                </div>
                <div className="space-y-3">
                  {/* Granularity Slider Mock */}
                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Target Bucket Granularity:</span>
                      <span className="text-white font-bold">Balanced (8 - 14 Categories)</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full relative overflow-hidden">
                      <div className="h-full bg-rose-500 w-3/5 rounded-full" />
                    </div>
                  </div>

                  {/* Flowing text cluster mockup */}
                  <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-850 space-y-2">
                    <div className="text-[11px] text-zinc-400">Semantic Vector Association:</div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between p-1.5 rounded bg-zinc-950 border border-zinc-850">
                        <span className="text-zinc-300">“Payment gateway timed out during card auth”</span>
                        <span className="text-rose-400 font-semibold">→ Cluster #1</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-zinc-950 border border-zinc-850">
                        <span className="text-zinc-300">“Invoice amount mismatch against purchase order”</span>
                        <span className="text-rose-400 font-semibold">→ Cluster #1</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-zinc-950 border border-zinc-850">
                        <span className="text-zinc-300">“Delayed shipment caused by customs inspection”</span>
                        <span className="text-zinc-400 font-semibold">→ Cluster #2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/40 text-rose-500 font-mono font-bold text-sm flex items-center justify-center">
                    04
                  </span>
                  <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-semibold">
                    Step 4 — Bucketisation
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Let AI Discover the Patterns
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  BucketAI analyses the meaning and context of remarks, identifies similarities, and automatically groups related entries into meaningful categories.
                </p>
                <div className="pt-2 text-xs text-zinc-400 leading-relaxed">
                  Different phrases with identical meaning belong to the same category. Operates locally in your browser with dual inference engines.
                </div>
              </div>
            </div>

            {/* STEP 05 */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/40 text-rose-500 font-mono font-bold text-sm flex items-center justify-center">
                    05
                  </span>
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Step 5 — Refine</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Review Your Generated Categories
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Explore generated buckets, review descriptions and assignment confidence, and identify records that may require manual attention. Optionally use Gemini to improve bucket names and descriptions.
                </p>
                <div className="pt-2 text-xs text-zinc-400 leading-relaxed">
                  Gemini never alters underlying row groupings or row counts; it refines business names using representative samples.
                </div>
              </div>

              {/* Illustration 05: Review, Split, Merge, & Gemini Renaming */}
              <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-850 text-zinc-400">
                  <span>Bucket Management &amp; Confidence</span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Optional AI Naming
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="font-bold text-white text-sm">Billing &amp; Checkout Failures</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">High Confidence</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Issues related to credit card authentication errors, duplicate invoices, and disputed freight surcharges.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-850">
                    <span>1,420 rows (42.5%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-300 underline cursor-pointer">Split</span>
                      <span>·</span>
                      <span className="text-zinc-300 underline cursor-pointer">Merge</span>
                      <span>·</span>
                      <span className="text-rose-400 underline cursor-pointer">Refine Name</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 06 */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Illustration 06: Analytics & OpenXML Export */}
              <div className="lg:col-span-7 order-2 lg:order-1 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-850 text-zinc-400">
                  <span>Results Analytics &amp; Native Chart Export</span>
                  <span className="text-emerald-400 font-semibold">OpenXML Enriched</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-zinc-300 font-semibold">
                      <span>Interactive Visualisation</span>
                      <BarChart3 className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="h-16 flex items-end gap-1.5 pt-2">
                      <div className="w-1/4 bg-rose-500 h-full rounded-t" />
                      <div className="w-1/4 bg-zinc-400 h-3/4 rounded-t" />
                      <div className="w-1/4 bg-zinc-600 h-1/2 rounded-t" />
                      <div className="w-1/4 bg-zinc-700 h-1/4 rounded-t" />
                    </div>
                    <span className="text-[10px] text-zinc-400 block text-center">Bar / Pie Distribution Switcher</span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-zinc-300 font-semibold">
                      <span>Exported Workbook</span>
                      <FileDown className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="space-y-1 text-[11px] text-zinc-300">
                      <div>✓ 5 Enriched Columns Appended</div>
                      <div>✓ Original Sheets &amp; Charts 100% Intact</div>
                      <div>✓ Dedicated &ldquo;BucketAI Summary&rdquo; Sheet</div>
                    </div>
                    <span className="text-[10px] text-rose-400 block pt-1 font-semibold">
                      Native OpenXML Embedded Chart
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/40 text-rose-500 font-mono font-bold text-sm flex items-center justify-center">
                    06
                  </span>
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Step 6 — Export</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Turn Categories Into Insights
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Explore the distribution of remarks through interactive charts, understand category counts and percentages, and export the enriched workbook with structured bucket assignments and a dedicated summary sheet.
                </p>
                <div className="pt-2 text-xs text-zinc-400 leading-relaxed">
                  Export transparent high-resolution PNG charts directly to your clipboard or download enriched .xlsx spreadsheets.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 06 — PRODUCT CAPABILITIES                         */}
      {/* ========================================================= */}
      <section id="features" className="py-20 lg:py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14 text-left">
            <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block mb-2">
              BUILT FOR PRACTICAL ANALYSIS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              More Than Just Text Categorisation.
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Everything you need to transform unstructured remarks into a structured and analysable dataset.
            </p>
          </div>

          {/* 6 Clean Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Semantic Understanding</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Identifies relationships between remarks based on meaning and context rather than exact keyword matching.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
                <Filter className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Flexible Data Filtering</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Supports custom conditions and grouped AND/OR logic to process only relevant records without dropping excluded rows.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI-Assisted Bucket Naming</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Optionally uses Gemini to generate clearer, more meaningful bucket names and descriptions from representative examples.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Assignment Confidence</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Provides assignment confidence indicators and helps identify outlier records that may need manual review.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Interactive Analytics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Visualise category distribution through pie charts, bar charts, counts, percentages, and transparent PNG clipboard copies.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Excel-Ready Export</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Export enriched workbooks with bucket assignments, preserved original sheets, and a dedicated summary worksheet with native charts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 07 — PRIVACY AND PROCESSING                       */}
      {/* ========================================================= */}
      <section id="privacy" className="py-20 lg:py-24 border-b border-zinc-900 bg-zinc-950 bg-dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14 text-left">
            <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block mb-2">
              PRIVACY BY DESIGN
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Your Data. Your Control.
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              BucketAI is designed with a privacy-conscious, browser-based processing architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Architecture Diagram */}
            <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" /> Client Execution Boundary
                </span>
                <span className="text-emerald-400 font-semibold">Local-First</span>
              </div>

              <div className="space-y-3 text-[11px]">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-rose-500" /> In-Browser Deduplication &amp; Filtering
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Spreadsheet parsing, conditional row filtering, and feature extraction execute entirely within the client session.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-rose-500" /> Vector Clustering
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Spherical K-means calculations and dendrogram cuts occur inside browser memory.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-zinc-400" /> Server-Side Proxy (Optional Gemini)
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    When AI naming is invoked, only representative cluster sample texts are proxied to Gemini. API keys never touch browser bundles.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Pillars */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Browser-Based Processing</h4>
                <p className="text-zinc-400 leading-relaxed">
                  Semantic processing is designed to happen locally in the browser wherever supported.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Optional AI Assistance</h4>
                <p className="text-zinc-400 leading-relaxed">
                  Gemini assistance is optional and used solely for improving bucket names and descriptions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Controlled Data Sharing</h4>
                <p className="text-zinc-400 leading-relaxed">
                  When AI naming is enabled, only the information required for that operation is sent to the configured backend.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 space-y-1.5">
                <h4 className="font-bold text-white text-sm">Secure Credential Handling</h4>
                <p className="text-zinc-400 leading-relaxed">
                  AI credentials remain strictly server-side and are never exposed in frontend code or client bundles.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 space-y-1.5 sm:col-span-2">
                <h4 className="font-bold text-white text-sm">User-Controlled Files</h4>
                <p className="text-zinc-400 leading-relaxed">
                  Users retain complete control over the spreadsheets they upload and export. No cloud database storage or persistent storage is required for core workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 08 — FINAL CALL TO ACTION                         */}
      {/* ========================================================= */}
      <section className="py-20 lg:py-24 border-b border-zinc-900 bg-gradient-to-b from-zinc-950 via-rose-950/20 to-zinc-950 relative overflow-hidden">
        {/* Subtle background red accent glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[250px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <span className="text-[11px] font-mono text-rose-500 uppercase tracking-widest block">
            GET STARTED TODAY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Your Next Spreadsheet Could Reveal Something Important.
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Stop manually categorising thousands of remarks. Let BucketAI discover patterns, structure your data,
            and help you uncover meaningful insights.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartUtility}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-950/60 transition-all cursor-pointer hover:shadow-rose-900/40 active:scale-98"
            >
              <span>Start Bucketising</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-zinc-500 font-mono pt-2">
            No signup or credit card required · 100% Free &amp; Browser-First
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 09 — FOOTER                                       */}
      {/* ========================================================= */}
      <footer className="bg-zinc-950 py-12 border-t border-zinc-900 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-900">
            {/* Logo and Wordmark */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                B
              </div>
              <span className="font-bold text-sm tracking-tight text-white">BucketAI</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 text-xs">
                AI-powered semantic bucketisation for spreadsheet data.
              </span>
            </div>

            {/* Navigation links */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-medium">
              <button
                onClick={() => scrollToSection('overview')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Overview
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy
              </button>
            </div>
          </div>

          {/* Bottom Copyright & Author Credit with Portfolio Link */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              &copy; {new Date().getFullYear()} BucketAI. All rights reserved.
            </div>

            <div>
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
          </div>
        </div>
      </footer>
    </div>
  );
};
