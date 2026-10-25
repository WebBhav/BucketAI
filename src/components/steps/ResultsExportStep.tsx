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
  FileCheck2,
  Download,
  ArrowLeft,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Bucket,
  ClusteringResult,
  RawRow,
  UniqueRemark,
  WorkbookPreservationMeta,
} from '../../types';

interface ResultsExportStepProps {
  clusteringResult: ClusteringResult;
  allRows: RawRow[];
  uniqueRemarks: UniqueRemark[];
  remarksCol: string;
  primaryKeyCol: string;
  preservationMeta?: WorkbookPreservationMeta;
  onExport: () => void;
  onInspectBucket: (bucket: Bucket) => void;
  onBack: () => void;
  isExporting: boolean;
}

export const ResultsExportStep: React.FC<ResultsExportStepProps> = ({
  clusteringResult,
  allRows,
  uniqueRemarks,
  remarksCol,
  primaryKeyCol,
  preservationMeta,
  onExport,
  onInspectBucket,
  onBack,
  isExporting,
}) => {
  const { buckets, stats } = clusteringResult;
  const [activeTab, setActiveTab] = useState<'analytics' | 'preview'>('analytics');

  // Recharts data
  const chartData = buckets
    .filter((b) => !b.isBlankBucket)
    .map((b) => ({
      name: b.name.length > 22 ? `${b.name.slice(0, 20)}...` : b.name,
      fullName: b.name,
      count: b.totalRows,
      color: b.color || '#E11D48',
    }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Export Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-rose-500" />
            Bucketisation Results & Export
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review discovered categories and export your enriched Excel workbook with OpenXML summary charts and zero data loss.
          </p>
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Excel...' : 'Download Enriched Excel (.xlsx)'}</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Total Input Records</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums">
            {stats.totalRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">
            100% rows preserved
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Processed (Included)</span>
          <span className="text-xl font-bold text-rose-400 font-mono tabular-nums">
            {stats.includedRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5 font-mono">
            {stats.assignedPercentage}% of dataset
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Excluded by Filter</span>
          <span className="text-xl font-bold text-zinc-400 font-mono tabular-nums">
            {stats.excludedRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">
            Untouched in workbook
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Discovered Categories</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums">
            {buckets.length}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">
            Semantic clusters
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Requires Review</span>
          <span className={`text-xl font-bold font-mono tabular-nums ${stats.needsReviewRows > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {stats.needsReviewRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">
            Outliers & borderlines
          </span>
        </div>
      </div>

      {/* Excel Preservation & Integrity Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Workbook Preservation & Integrity Guarantee
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Mode: {preservationMeta?.hasCharts ? 'Deep Chart Preservation' : 'Multi-Sheet Structure'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300 pt-1">
          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
            <span className="font-semibold text-white block">Charts & Visualizations</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block leading-relaxed">
              {preservationMeta?.hasCharts
                ? 'Embedded charts and drawings in original sheets are 100% preserved.'
                : 'Original sheet drawings and formatting preserved without modification.'}
            </span>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
            <span className="font-semibold text-white block">Row Order & Excluded Rows</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block leading-relaxed">
              All {stats.totalRows.toLocaleString()} rows remain in exact sequence. Excluded rows keep new bucket columns blank.
            </span>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
            <span className="font-semibold text-white block">OpenXML Native Bar Chart</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block leading-relaxed">
              Generates genuine Excel bar chart XML on the <code className="text-rose-400 font-mono">Bucket_Summary</code> sheet.
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-2 gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'analytics' ? 'border-rose-500 text-rose-400 font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Visual Distribution
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'preview' ? 'border-rose-500 text-rose-400 font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Enriched Table Preview
        </button>
      </div>

      {/* Tab 1: Charts & Distribution */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Bar Chart */}
          <div className="md:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Ranked Bucket Size Distribution</h3>
                <p className="text-xs text-zinc-400">Total assigned rows across discovered categories</p>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {stats.clusteringTimeMs}ms execution
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#A1A1AA' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-950 border border-zinc-800 text-white p-2.5 rounded-lg text-xs shadow-xl">
                            <div className="font-bold">{data.fullName}</div>
                            <div className="font-mono text-rose-400 mt-1">
                              {data.count.toLocaleString()} rows (
                              {((data.count / (stats.totalRows || 1)) * 100).toFixed(1)}%)
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

          {/* Bucket Summary List with Drill-Down */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col">
            <h3 className="text-sm font-bold text-white">Discovered Categories</h3>
            <p className="text-xs text-zinc-400">Click a category to inspect its matching rows</p>

            <div className="flex-1 overflow-y-auto max-h-64 space-y-2 pt-1 pr-1">
              {buckets.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onInspectBucket(b)}
                  className="p-2.5 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="font-semibold text-zinc-200 truncate">{b.name}</span>
                  </div>
                  <span className="font-mono text-zinc-400 tabular-nums shrink-0 ml-2">
                    {b.totalRows.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Enriched Table Preview */}
      {activeTab === 'preview' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden space-y-3">
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200">
              Preview of Enriched Output Columns (Bucket_ID, Bucket_Name, Confidence, Review_Required)
            </span>
            <span className="text-zinc-500 font-mono">
              Showing first 50 rows
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-200 font-semibold sticky top-0">
                <tr>
                  <th className="px-3.5 py-2">ID</th>
                  <th className="px-3.5 py-2">Original Remark</th>
                  <th className="px-3.5 py-2 text-rose-400">Bucket_Name</th>
                  <th className="px-3.5 py-2 text-zinc-400">Confidence</th>
                  <th className="px-3.5 py-2 text-amber-400">Review_Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {allRows.slice(0, 50).map((row, idx) => {
                  const remark = String(row[remarksCol] || '');
                  const u = uniqueRemarks.find((item) => item.rowIndices.includes(idx));
                  const bucketId = u ? clusteringResult.hashToBucketId.get(u.hash) : '';
                  const bucket = buckets.find((b) => b.id === bucketId);
                  const conf = u ? clusteringResult.hashToConfidence.get(u.hash) || 'Medium' : 'N/A';

                  return (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-3.5 py-2 font-mono text-zinc-500">
                        {String(row[primaryKeyCol] || idx + 1)}
                      </td>
                      <td className="px-3.5 py-2 max-w-sm truncate text-zinc-200">
                        {remark || <span className="text-zinc-600 italic">[Blank]</span>}
                      </td>
                      <td className="px-3.5 py-2 font-semibold text-rose-400 whitespace-nowrap">
                        {bucket ? bucket.name : <span className="text-zinc-600">Excluded</span>}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-zinc-400">
                        {bucket ? conf : '-'}
                      </td>
                      <td className="px-3.5 py-2 font-mono">
                        {bucket && (conf === 'Needs Review' || bucket.isOutlierBucket) ? (
                          <span className="text-amber-400 font-bold">YES</span>
                        ) : (
                          <span className="text-zinc-600">NO</span>
                        )}
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
          <span>Back to Bucketisation</span>
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Excel...' : 'Download Enriched Excel (.xlsx)'}</span>
        </button>
      </div>
    </div>
  );
};
