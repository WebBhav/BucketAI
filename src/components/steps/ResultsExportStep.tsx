import React, { useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import {
  FileCheck2,
  Download,
  ArrowLeft,
  ShieldCheck,
  BarChart3,
  PieChart as PieChartIcon,
  Copy,
  Check,
  ImageDown,
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
  selectedSheetName?: string;
  preservationMeta?: WorkbookPreservationMeta;
  onExport: (chartType: 'bar' | 'pie') => void;
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
  selectedSheetName,
  preservationMeta,
  onExport,
  onInspectBucket,
  onBack,
  isExporting,
}) => {
  const { buckets, stats } = clusteringResult;
  const [activeTab, setActiveTab] = useState<'analytics' | 'preview'>('analytics');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // All non-empty buckets including Blank / No Remarks
  const chartData = buckets
    .filter((b) => b.totalRows > 0)
    .map((b) => ({
      id: b.id,
      name: b.name.length > 22 ? `${b.name.slice(0, 20)}...` : b.name,
      fullName: b.name,
      count: b.totalRows,
      color: b.color || '#E11D48',
      percentage: stats.includedRows > 0 ? ((b.totalRows / stats.includedRows) * 100).toFixed(1) : '0',
    }));

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // High-Resolution Transparent PNG Export
  const handleExportChartPng = async (action: 'copy' | 'download') => {
    if (!chartContainerRef.current) return;
    const svg = chartContainerRef.current.querySelector('svg');
    if (!svg) return;

    try {
      const svgClone = svg.cloneNode(true) as SVGElement;
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Ensure transparent background
      const svgStr = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const dpr = 2; // 2x resolution
        const width = (svg.clientWidth || 600) * dpr;
        const height = (svg.clientHeight || 300) * dpr;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.drawImage(img, 0, 0, svg.clientWidth || 600, svg.clientHeight || 300);
        URL.revokeObjectURL(blobUrl);

        canvas.toBlob(async (blob) => {
          if (!blob) return;

          if (action === 'copy') {
            try {
              if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob }),
                ]);
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2500);
              } else {
                triggerBlobDownload(blob, `BucketAI_${chartType}_chart.png`);
              }
            } catch (clipErr) {
              triggerBlobDownload(blob, `BucketAI_${chartType}_chart.png`);
            }
          } else {
            triggerBlobDownload(blob, `BucketAI_${chartType}_chart.png`);
          }
        }, 'image/png');
      };
      img.src = blobUrl;
    } catch (err) {
      console.error('Error generating chart PNG:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Export Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-rose-500" />
            Bucketisation Results &amp; Export
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enriched worksheet <code className="text-rose-400 font-mono font-semibold">{selectedSheetName || 'Active Sheet'}</code> ready for export. Includes dedicated <code className="text-white font-mono">BucketAI Summary</code> sheet with native Excel {chartType === 'pie' ? 'Pie' : 'Bar'} chart.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onExport(chartType)}
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
            Outliers &amp; borderlines
          </span>
        </div>
      </div>

      {/* Excel Preservation & Integrity Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Target Sheet &amp; Workbook Integrity Guarantee
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Target: <span className="text-rose-400">{selectedSheetName || 'Active Sheet'}</span> ({preservationMeta?.hasCharts ? 'Deep OpenXML Container Preservation' : 'Multi-Sheet Structure'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300 pt-1">
          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
            <span className="font-semibold text-white block">Selective Sheet Injection</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block leading-relaxed">
              Enriched columns are appended exclusively to <strong className="text-zinc-200">{selectedSheetName || 'selected worksheet'}</strong>. All other worksheets remain 100% untouched.
            </span>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
            <span className="font-semibold text-white block">Strict Row Alignment</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block leading-relaxed">
              All {stats.totalRows.toLocaleString()} rows remain in exact sequence. Excluded rows and blanks are never shifted or misaligned.
            </span>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
            <span className="font-semibold text-white block">Native Excel Summary Chart</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block leading-relaxed">
              Generates genuine OpenXML {chartType === 'pie' ? 'Pie' : 'Bar'} chart embedded on the <code className="text-rose-400 font-mono">BucketAI Summary</code> sheet.
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
          {/* Main Chart Area */}
          <div className="md:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Category Distribution Visualization
                </h3>
                <p className="text-xs text-zinc-400">Total assigned rows across discovered categories and blanks</p>
              </div>

              {/* Chart Controls: Bar/Pie Toggle + PNG Export */}
              <div className="flex items-center gap-2">
                {/* Bar / Pie Toggle */}
                <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
                  <button
                    type="button"
                    onClick={() => setChartType('bar')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      chartType === 'bar'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Switch to Bar Chart"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Bar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('pie')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      chartType === 'pie'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Switch to Pie Chart"
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                    <span>Pie</span>
                  </button>
                </div>

                {/* Copy Chart Button */}
                <button
                  type="button"
                  onClick={() => handleExportChartPng('copy')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Copy transparent PNG to clipboard"
                >
                  {copyFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy chart</span>
                    </>
                  )}
                </button>

                {/* Download PNG Button */}
                <button
                  type="button"
                  onClick={() => handleExportChartPng('download')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Download transparent PNG"
                >
                  <ImageDown className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>

            {/* Interactive Visualization Container */}
            <div ref={chartContainerRef} className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 45 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#A1A1AA' }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-950/95 border border-zinc-800 text-white p-2.5 rounded-lg text-xs shadow-xl backdrop-blur-md">
                              <div className="font-bold flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                <span>{data.fullName}</span>
                              </div>
                              <div className="font-mono text-rose-400 mt-1">
                                {data.count.toLocaleString()} rows ({data.percentage}%)
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
                ) : (
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-950/95 border border-zinc-800 text-white p-2.5 rounded-lg text-xs shadow-xl backdrop-blur-md">
                              <div className="font-bold flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                <span>{data.fullName}</span>
                              </div>
                              <div className="font-mono text-rose-400 mt-1">
                                {data.count.toLocaleString()} rows ({data.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="fullName"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={45}
                      paddingAngle={2}
                      label={(props: any) => `${props.name || ''} (${props.payload?.percentage || ((props.percent || 0) * 100).toFixed(1)}%)`}
                      labelLine={{ stroke: '#71717A', strokeWidth: 1 }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bucket Summary List with Drill-Down */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col">
            <h3 className="text-sm font-bold text-white">Discovered Categories</h3>
            <p className="text-xs text-zinc-400">Click a category to inspect its matching rows</p>

            <div className="flex-1 overflow-y-auto max-h-72 space-y-2 pt-1 pr-1">
              {buckets.map((b) => {
                const pct = stats.includedRows > 0 ? ((b.totalRows / stats.includedRows) * 100).toFixed(1) : '0';
                return (
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
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono text-zinc-200 tabular-nums">
                        {b.totalRows.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono ml-1">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Enriched Table Preview */}
      {activeTab === 'preview' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden space-y-3">
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200">
              Preview of Enriched Output Columns for <code className="text-rose-400 font-mono">{selectedSheetName || 'Active Sheet'}</code> (Bucket_ID, Bucket_Name, Confidence, Review_Required)
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
                        {bucket && (conf === 'Needs Review' || bucket.isOutlierBucket || bucket.reviewRequired) ? (
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
          onClick={() => onExport(chartType)}
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
