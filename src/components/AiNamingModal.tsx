import React from 'react';
import { Sparkles, X, Loader2, ShieldCheck, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface AiNamingModalProps {
  isOpen: boolean;
  bucketCount: number;
  isLoading: boolean;
  errorMessage?: string | null;
  onImproveNames: () => void;
  onSkipForNow: () => void;
  onCancelRequest: () => void;
  onRetry: () => void;
  onContinueWithoutAi: () => void;
  onClose: () => void;
}

export const AiNamingModal: React.FC<AiNamingModalProps> = ({
  isOpen,
  bucketCount,
  isLoading,
  errorMessage,
  onImproveNames,
  onSkipForNow,
  onCancelRequest,
  onRetry,
  onContinueWithoutAi,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-950/70 border border-rose-800/60 text-rose-500 flex items-center justify-center shrink-0">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : errorMessage ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isLoading
                  ? 'Refining bucket names…'
                  : errorMessage
                  ? 'Failed to refine bucket names'
                  : 'Improve bucket names with AI?'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {isLoading ? 'Gemini 3.1 Flash-Lite' : 'Gemini 3.1 Flash-Lite'}
              </p>
            </div>
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              title="Close and stay on review"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* State 1: Active Loading with visible Cancel button */}
        {isLoading && (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-9 h-9 text-rose-500 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Refining bucket names…
              </p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Analyzing representative remarks across {bucketCount} discovered categories.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onCancelRequest}
                className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/80 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* State 2: Error State with Retry & Continue without AI */}
        {!isLoading && errorMessage && (
          <div className="space-y-4 text-xs text-zinc-300">
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>AI naming error</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed font-mono">
                {errorMessage}
              </p>
            </div>

            <p className="text-zinc-400 text-xs">
              Existing bucket names have been preserved. You can retry with Gemini 3.1 Flash-Lite or proceed directly to Results & Exports.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onContinueWithoutAi}
                className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-lg transition-colors cursor-pointer"
              >
                Continue without AI
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* State 3: Confirmation State */}
        {!isLoading && !errorMessage && (
          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <p>
              Gemini will refine bucket names and descriptions using representative examples from each discovered category.
            </p>

            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Private & Non-Destructive</span>
              </div>
              <p>
                Only 4–8 anonymous sample remarks per bucket are evaluated. All row assignments, formulas, and original data remain 100% untouched.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onSkipForNow}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-lg transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={onImproveNames}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Improve names</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
