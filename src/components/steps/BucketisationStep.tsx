import React, { useState } from 'react';
import {
  Layers,
  Edit2,
  GitMerge,
  Split,
  Eye,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Bucket,
  ClusteringResult,
  GranularitySetting,
} from '../../types';
import { EmbeddingEngineType } from '../../utils/embeddings';
import { MergeSuggestion } from '../../utils/geminiClient';

interface BucketisationStepProps {
  clusteringResult: ClusteringResult | null;
  granularity: GranularitySetting;
  onChangeGranularity: (setting: GranularitySetting) => void;
  engine: EmbeddingEngineType;
  onChangeEngine: (engine: EmbeddingEngineType) => void;
  minBuckets: number;
  maxBuckets: number;
  onStartDiscovery: () => void;
  isDiscovering: boolean;
  onOpenRename: (bucket: Bucket) => void;
  onOpenMerge: () => void;
  onOpenSplit: (bucket: Bucket) => void;
  onInspectBucket: (bucket: Bucket) => void;
  onToggleReviewed: (bucketId: string) => void;
  mergeSuggestions: MergeSuggestion[];
  onApplyMergeSuggestion: (suggestion: MergeSuggestion) => void;
  onBack: () => void;
  onProceed: () => void;
  includedRowsCount: number;
  uniqueRemarkCount: number;
}

export const BucketisationStep: React.FC<BucketisationStepProps> = ({
  clusteringResult,
  granularity,
  onChangeGranularity,
  engine,
  onChangeEngine,
  minBuckets,
  maxBuckets,
  onStartDiscovery,
  isDiscovering,
  onOpenRename,
  onOpenMerge,
  onOpenSplit,
  onInspectBucket,
  onToggleReviewed,
  mergeSuggestions,
  onApplyMergeSuggestion,
  onBack,
  onProceed,
  includedRowsCount,
  uniqueRemarkCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const buckets = clusteringResult ? clusteringResult.buckets : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Step Header & Granularity Control */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-500" />
              Category Discovery & Granularity
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Cluster semantic topics from {includedRowsCount.toLocaleString()} remarks ({uniqueRemarkCount.toLocaleString()} unique phrases). Target range: {minBuckets}–{maxBuckets} buckets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Granularity Controls */}
            <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => onChangeGranularity({ mode: 'broad' })}
                className={`px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                  granularity.mode === 'broad' ? 'bg-rose-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Broad
              </button>
              <button
                type="button"
                onClick={() => onChangeGranularity({ mode: 'balanced' })}
                className={`px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                  granularity.mode === 'balanced' ? 'bg-rose-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => onChangeGranularity({ mode: 'detailed' })}
                className={`px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                  granularity.mode === 'detailed' ? 'bg-rose-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Detailed
              </button>
            </div>

            {/* Re-Run Discovery / Initial Run Button */}
            <button
              type="button"
              onClick={onStartDiscovery}
              disabled={isDiscovering}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
              <span>{clusteringResult ? 'Re-Cluster' : 'Discover Buckets'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Settings */}
        <div className="pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Advanced Inference & Model Settings</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-lg border border-zinc-800/70">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-zinc-400" />
                  <div>
                    <span className="font-semibold text-zinc-200 block">Inference Engine</span>
                    <span className="text-[11px] text-zinc-400">
                      {engine === 'fast-semantic' ? 'Fast Semantic (In-browser vectorizer)' : 'ONNX MiniLM Neural Model'}
                    </span>
                  </div>
                </div>
                <select
                  value={engine}
                  onChange={(e) => onChangeEngine(e.target.value as EmbeddingEngineType)}
                  className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 cursor-pointer text-xs"
                >
                  <option value="fast-semantic">Fast Semantic (Instant)</option>
                  <option value="transformer-minilm">Neural Model (ONNX)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discovered Buckets Table */}
      {clusteringResult && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden space-y-4">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Discovered Semantic Buckets ({buckets.length})
              </h3>
              <p className="text-xs text-zinc-400">
                {clusteringResult.stats.assignedRows.toLocaleString()} rows assigned · {clusteringResult.stats.needsReviewRows > 0 ? `${clusteringResult.stats.needsReviewRows} require review` : 'All assigned with confidence'}
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenMerge}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 rounded-lg transition-colors cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5 text-zinc-400" />
              <span>Merge Buckets</span>
            </button>
          </div>

          {/* Merge Suggestions If Discovered */}
          {mergeSuggestions.length > 0 && (
            <div className="mx-4 p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <span>Suggested Category Merges:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {mergeSuggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold text-white block">
                        Combine into: <span className="text-rose-400">{sug.suggestedCombinedName}</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {sug.rationalExplanation}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onApplyMergeSuggestion(sug)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded whitespace-nowrap cursor-pointer"
                    >
                      Merge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-200 font-semibold">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Bucket Name & Description</th>
                  <th className="px-4 py-3 w-28 text-right">Rows (% Total)</th>
                  <th className="px-4 py-3">Sample Remarks</th>
                  <th className="px-4 py-3 w-28 text-center">Status</th>
                  <th className="px-4 py-3 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {buckets.map((bucket) => {
                  const pct = ((bucket.totalRows / (clusteringResult.stats.totalRows || 1)) * 100).toFixed(1);
                  return (
                    <tr key={bucket.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full block shrink-0"
                          style={{ backgroundColor: bucket.color }}
                        />
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="font-bold text-white block">{bucket.name}</span>
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {bucket.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className="font-bold text-white">{bucket.totalRows.toLocaleString()}</span>
                        <span className="text-zinc-500 block text-[11px]">{pct}%</span>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <div className="space-y-1">
                          {bucket.sampleRemarks.slice(0, 2).map((s, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-zinc-300 truncate bg-zinc-950/70 px-2 py-0.5 rounded border border-zinc-800/80 italic"
                            >
                              &quot;{s}&quot;
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {bucket.isOutlierBucket ? (
                          <span className="text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded text-[11px] font-medium">
                            Needs Review
                          </span>
                        ) : (
                          <span className="text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 rounded text-[11px] font-medium">
                            Auto-Discovered
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onInspectBucket(bucket)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            title="Inspect remarks in bucket"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenRename(bucket)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            title="Rename bucket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!bucket.isBlankBucket && (
                            <button
                              type="button"
                              onClick={() => onOpenSplit(bucket)}
                              className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="Split bucket into sub-categories"
                            >
                              <Split className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleReviewed(bucket.id)}
                            className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            title="Mark reviewed"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Mapping & Filters</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={!clusteringResult || buckets.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <span>Continue to Results & Exports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
