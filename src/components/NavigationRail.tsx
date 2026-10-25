import React from 'react';
import {
  UploadCloud,
  Table,
  SlidersHorizontal,
  Layers,
  FileCheck2,
  Settings,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Home,
} from 'lucide-react';
import { WorkflowStep } from '../types';

interface NavigationRailProps {
  currentStep: WorkflowStep;
  onNavigateStep: (step: WorkflowStep) => void;
  fileName: string | null;
  totalRows: number;
  filteredRowsCount: number;
  bucketCount: number;
  onOpenSettings: () => void;
  onGoHome: () => void;
  canGoBack: boolean;
  onGoBack: () => void;
}

const STEPS: { key: WorkflowStep; label: string; number: string; icon: any }[] = [
  { key: 'upload', label: 'Upload Data', number: '1', icon: UploadCloud },
  { key: 'preview', label: 'Data Preview', number: '2', icon: Table },
  { key: 'mapping', label: 'Mapping & Filters', number: '3', icon: SlidersHorizontal },
  { key: 'bucketise', label: 'Bucketisation', number: '4', icon: Layers },
  { key: 'results', label: 'Results & Export', number: '5', icon: FileCheck2 },
];

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentStep,
  onNavigateStep,
  fileName,
  totalRows,
  filteredRowsCount,
  bucketCount,
  onOpenSettings,
  onGoHome,
  canGoBack,
  onGoBack,
}) => {
  const currentStepIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col justify-between shrink-0 select-none">
      {/* Brand & Wordmark */}
      <div className="p-5 border-b border-zinc-850">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              B
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                BucketAI
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium">Excel Remark Bucketisation</p>
            </div>
          </div>

          <button
            onClick={onGoHome}
            title="Return to Home Landing"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {fileName && (
          <div className="mt-4 p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="text-[11px] font-medium text-zinc-200 truncate" title={fileName}>
              {fileName}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {totalRows.toLocaleString()} rows · {filteredRowsCount.toLocaleString()} included
            </div>
          </div>
        )}
      </div>

      {/* Guided Workflow Steps */}
      <nav className="p-4 flex-1 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Workflow Pipeline
        </div>

        {STEPS.map((s, idx) => {
          const isCurrent = currentStep === s.key;
          const isPassed = idx < currentStepIdx && Boolean(fileName);
          const isClickable = idx <= currentStepIdx || (Boolean(fileName) && idx <= currentStepIdx + 1);

          return (
            <button
              key={s.key}
              onClick={() => {
                if (isClickable) onNavigateStep(s.key);
              }}
              disabled={!isClickable}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isCurrent
                  ? 'bg-rose-950/30 text-rose-400 border border-rose-800/40 shadow-xs'
                  : isPassed
                  ? 'text-zinc-300 hover:bg-zinc-900 hover:text-white cursor-pointer'
                  : 'text-zinc-500 opacity-60 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[11px] font-mono ${
                  isCurrent
                    ? 'bg-rose-600 text-white font-bold'
                    : isPassed
                    ? 'bg-zinc-850 text-emerald-400 font-semibold'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : s.number}
              </div>

              <div className="flex-1 truncate">
                <span className="block truncate font-semibold">{s.label}</span>
                {isCurrent && (
                  <span className="block text-[10px] text-rose-400/90 font-mono">
                    Active Step
                  </span>
                )}
                {s.key === 'bucketise' && bucketCount > 0 && !isCurrent && (
                  <span className="block text-[10px] text-zinc-400 font-mono">
                    {bucketCount} buckets
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {canGoBack && (
          <div className="pt-4 px-2">
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Previous Step</span>
            </button>
          </div>
        )}
      </nav>

      {/* Utilities & Bottom Info */}
      <div className="p-4 border-t border-zinc-850 space-y-2">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Settings & Presets</span>
        </button>

        <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 px-3">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Browser Engine</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
