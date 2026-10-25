import React from 'react';
import { Database, Download, Play, ShieldCheck, Cpu } from 'lucide-react';

interface HeaderProps {
  activeStep: 'upload' | 'config' | 'results';
  onNavigateStep: (step: 'upload' | 'config' | 'results') => void;
  canExport: boolean;
  onExport: () => void;
  onOpenDiagnostics: () => void;
  onClearCache: () => void;
  cacheItemCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeStep,
  onNavigateStep,
  canExport,
  onExport,
  onOpenDiagnostics,
  onClearCache,
  cacheItemCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigateStep('upload');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors"
        >
          RemarkIQ
        </a>
        <span className="hidden sm:inline text-xs text-slate-500 font-medium">
          Enterprise Remark Bucketisation
        </span>
      </div>

      {/* Zone 2: Navigation Links (Clean text links with active indicator) */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
        <button
          onClick={() => onNavigateStep('upload')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeStep === 'upload' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent'
          }`}
        >
          1. Upload & Validation
        </button>
        <button
          onClick={() => onNavigateStep('config')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeStep === 'config' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent'
          }`}
        >
          2. Parameters & Engine
        </button>
        <button
          onClick={() => onNavigateStep('results')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeStep === 'results' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent'
          }`}
        >
          3. Bucket Dashboard
        </button>
      </nav>

      {/* Zone 3: Primary Action & Utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenDiagnostics}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          title="Run automated test suite and scale benchmarks"
        >
          <Cpu className="w-3.5 h-3.5 text-slate-600" />
          <span>Tests & Benchmarks</span>
        </button>

        {cacheItemCount > 0 && (
          <button
            onClick={onClearCache}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="Clear IndexedDB cached embeddings"
          >
            <Database className="w-3 h-3 text-slate-400" />
            <span className="font-mono tabular-nums">{cacheItemCount}</span> cached
          </button>
        )}

        {canExport ? (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigateStep('upload')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 text-slate-700" />
            <span>Load Dataset</span>
          </button>
        )}
      </div>
    </header>
  );
};
