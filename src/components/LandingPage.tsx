import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, ShieldCheck, Zap, Layers, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between bg-dot-grid relative">
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
            <div className="w-12 h-12 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-rose-500 flex items-center justify-center">
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
            <span>Fast deduplication & clustering</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Chart & formula preserving export</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-8 py-5 text-center text-xs text-zinc-500">
        Built by Vaibhav Singhal
      </footer>
    </div>
  );
};
