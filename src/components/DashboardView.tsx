import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Layers,
  Edit2,
  GitMerge,
  Split,
  Eye,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Sliders,
  Download,
  Search,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Bucket, ClusteringResult, GranularitySetting, RawRow, UniqueRemark } from '../types';
import { MergeSuggestion } from '../utils/geminiClient';

interface DashboardViewProps {
  clusteringResult: ClusteringResult;
  allRows: RawRow[];
  uniqueRemarks: UniqueRemark[];
  remarksCol: string;
  primaryKeyCol: string;
  granularity: GranularitySetting;
  onChangeGranularity: (setting: GranularitySetting) => void;
  onOpenRename: (bucket: Bucket) => void;
  onOpenMerge: (initialBucketId?: string) => void;
  onOpenSplit: (bucket: Bucket) => void;
  onInspectBucket: (bucket: Bucket) => void;
  onToggleReviewed: (bucketId: string) => void;
  onRunGeminiLabeling: () => void;
  isAiLabeling: boolean;
  onExport: () => void;
  mergeSuggestions: MergeSuggestion[];
  onApplyMergeSuggestion: (suggestion: MergeSuggestion) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clusteringResult,
  allRows,
  uniqueRemarks,
  remarksCol,
  primaryKeyCol,
  granularity,
  onChangeGranularity,
  onOpenRename,
  onOpenMerge,
  onOpenSplit,
  onInspectBucket,
  onToggleReviewed,
  onRunGeminiLabeling,
  isAiLabeling,
  onExport,
  mergeSuggestions,
  onApplyMergeSuggestion,
}) => {
  const { buckets, stats } = clusteringResult;
  const [tableSearch, setTableSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'needs_review' | 'assigned'>('all');

  const filteredBuckets = buckets.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      b.description.toLowerCase().includes(tableSearch.toLowerCase()) ||
      b.sampleRemarks.some((s) => s.toLowerCase().includes(tableSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'needs_review') {
      return b.isOutlierBucket || b.id === 'bucket_outliers';
    }
    if (selectedFilter === 'assigned') {
      return !b.isBlankBucket && !b.isOutlierBucket;
    }
    return true;
  });

  const chartData = buckets
    .filter((b) => !b.isBlankBucket)
    .map((b) => ({
      name: b.name.length > 20 ? `${b.name.slice(0, 18)}...` : b.name,
      fullName: b.name,
      count: b.totalRows,
      color: b.color,
    }));

  return (
    <div className="space-y-6">
      {/* Top Granularity & Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Semantic Granularity Hierarchy</h2>
            <p className="text-xs text-slate-500">
              Adjust the tree cut live without recomputing embeddings. Manual merges are preserved.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Granularity Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => onChangeGranularity({ mode: 'broad' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                granularity.mode === 'broad' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Broad
            </button>
            <button
              onClick={() => onChangeGranularity({ mode: 'balanced' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                granularity.mode === 'balanced' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Balanced
            </button>
            <button
              onClick={() => onChangeGranularity({ mode: 'detailed' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                granularity.mode === 'detailed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* AI Naming Trigger */}
          <button
            onClick={onRunGeminiLabeling}
            disabled={isAiLabeling}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAiLabeling ? 'Refining with AI...' : 'Refine Names with Gemini'}</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Total Rows Processed</span>
          <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            100% rows preserved
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Discovered Buckets</span>
          <span className="text-xl font-bold text-blue-600 font-mono tabular-nums">
            {buckets.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {buckets.filter((b) => !b.isBlankBucket && !b.isOutlierBucket).length} semantic categories
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Assigned Non-Blank</span>
          <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
            {stats.assignedPercentage}%
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5 font-mono tabular-nums">
            {stats.assignedRows.toLocaleString()} rows assigned
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Unclassified / Outliers</span>
          <span className={`text-xl font-bold font-mono tabular-nums ${stats.unclassifiedRows > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {stats.unclassifiedRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {stats.outlierPercentage}% of dataset
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Requires Review</span>
          <span className={`text-xl font-bold font-mono tabular-nums ${stats.needsReviewRows > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {stats.needsReviewRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Boundary cases & outliers
          </span>
        </div>
      </div>

      {/* AI Merge Recommendations (If discovered) */}
      {mergeSuggestions.length > 0 && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
              Gemini Merge Recommendations ({mergeSuggestions.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mergeSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-lg border border-purple-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    Combine into: <span className="text-purple-700">{sug.suggestedCombinedName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sug.rationalExplanation}</p>
                </div>
                <button
                  onClick={() => onApplyMergeSuggestion(sug)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  Merge Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribution Chart Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category Size Distribution</h3>
            <p className="text-xs text-slate-500">Row distribution across discovered semantic buckets</p>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            Clustering completed in {stats.clusteringTimeMs}ms
          </span>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg">
                        <div className="font-bold">{data.fullName}</div>
                        <div className="font-mono tabular-nums mt-0.5">
                          {data.count.toLocaleString()} rows (
                          {((data.count / stats.totalRows) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Management Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Discovered Categories</h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({filteredBuckets.length} buckets)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter segmented buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  selectedFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All Buckets
              </button>
              <button
                onClick={() => setSelectedFilter('assigned')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  selectedFilter === 'assigned' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Semantic Only
              </button>
              <button
                onClick={() => setSelectedFilter('needs_review')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  selectedFilter === 'needs_review' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Needs Review
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search categories & remarks..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>

            {/* Merge Multiple Button */}
            <button
              onClick={() => onOpenMerge()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5 text-purple-600" />
              <span>Merge Buckets</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-900">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Bucket Name & Description</th>
                <th className="px-4 py-3 w-28 text-right">Rows (% Total)</th>
                <th className="px-4 py-3">Representative Sample Remarks</th>
                <th className="px-4 py-3 w-28 text-center">Status</th>
                <th className="px-4 py-3 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredBuckets.map((bucket) => {
                const pct = ((bucket.totalRows / stats.totalRows) * 100).toFixed(1);
                const isAllReviewed = bucket.reviewedCount >= bucket.totalRows && bucket.totalRows > 0;

                return (
                  <tr
                    key={bucket.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full block shrink-0"
                        style={{ backgroundColor: bucket.color }}
                      />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{bucket.name}</span>
                        {bucket.isManuallyCreatedOrModified && (
                          <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                            Modified
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                        {bucket.description}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {bucket.totalRows.toLocaleString()}
                      </span>
                      <span className="text-slate-400 block text-[11px] font-mono tabular-nums">
                        {pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="space-y-1">
                        {bucket.sampleRemarks.slice(0, 2).map((s, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-slate-700 truncate bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
                            title={s}
                          >
                            &quot;{s}&quot;
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {bucket.isOutlierBucket ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          Needs Review
                        </span>
                      ) : isAllReviewed ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                          Reviewed
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          Auto-Discovered
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onInspectBucket(bucket)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Inspect all remarks in this bucket"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenRename(bucket)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Rename bucket"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!bucket.isBlankBucket && (
                          <button
                            onClick={() => onOpenSplit(bucket)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                            title="Split bucket into finer categories"
                          >
                            <Split className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onToggleReviewed(bucket.id)}
                          className={`p-1 rounded transition-colors ${
                            isAllReviewed
                              ? 'text-emerald-600 hover:text-emerald-700'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                          title={isAllReviewed ? 'Mark unreviewed' : 'Mark all as reviewed'}
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
    </div>
  );
};
