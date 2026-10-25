import React from 'react';
import { Loader2, X, Cpu, CheckCircle } from 'lucide-react';
import { EmbeddingProgress } from '../utils/embeddings';

interface ProgressModalProps {
  isOpen: boolean;
  progress: EmbeddingProgress | null;
  statusText: string;
  onCancel: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  progress,
  statusText,
  onCancel,
}) => {
  if (!isOpen) return null;

  const pct = progress ? progress.percent : 10;
  const stage = progress ? progress.stage : 'processing';

  const getStageTitle = (s: string) => {
    switch (s) {
      case 'checking_cache':
        return 'Checking IndexedDB Cache';
      case 'loading_model':
        return 'Loading Neural Model / ONNX Runtime';
      case 'generating':
        return 'Generating Sentence Embeddings (Batched)';
      case 'saving_cache':
        return 'Caching Vectors in IndexedDB';
      case 'completed':
        return 'Clustering & Hierarchy Cuts';
      default:
        return 'Processing Semantic Discovery';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {getStageTitle(stage)}
              </h3>
              <p className="text-xs text-slate-500">
                {statusText || 'Executing in browser memory'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            title="Cancel processing"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Progress</span>
            <span className="font-mono tabular-nums text-blue-600 font-bold">{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200 ease-out rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Progress Metrics Strip */}
        {progress && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Processed</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {progress.completed.toLocaleString()} / {progress.total.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Cached</span>
              <span className="font-semibold text-emerald-600 tabular-nums">
                {progress.cachedCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Time Left</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {progress.estimatedRemainingMs > 0
                  ? `~${Math.ceil(progress.estimatedRemainingMs / 1000)}s`
                  : 'Finalizing...'}
              </span>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel Discovery
          </button>
        </div>
      </div>
    </div>
  );
};
