import React, { useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Table } from 'lucide-react';
import { RawRow, DatasetStats } from '../types';
import { SAMPLE_DATASETS, SampleDatasetMeta } from '../data/sampleDatasets';

interface UploadSectionProps {
  fileName: string | null;
  sheetNames: string[];
  activeSheet: string;
  onSelectSheet: (sheetName: string) => void;
  columns: string[];
  primaryKeyCol: string;
  remarksCol: string;
  onSelectPkCol: (col: string) => void;
  onSelectRemarksCol: (col: string) => void;
  rows: RawRow[];
  stats: DatasetStats | null;
  onFileUpload: (file: File) => void;
  onLoadSample: (sample: SampleDatasetMeta) => void;
  onProceed: () => void;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  fileName,
  sheetNames,
  activeSheet,
  onSelectSheet,
  columns,
  primaryKeyCol,
  remarksCol,
  onSelectPkCol,
  onSelectRemarksCol,
  rows,
  stats,
  onFileUpload,
  onLoadSample,
  onProceed,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const previewRows = rows.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Top Banner & Sample Data Quick Load */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            1. File Ingestion & Data Validation
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Upload an Excel (.xlsx, .xls) or CSV workbook with operational remarks. All original columns,
            rows, and ordering are strictly preserved. Processing runs entirely in your browser.
          </p>
        </div>

        {/* Sample Datasets Bar */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Or try a pre-configured sample:
          </span>
          {SAMPLE_DATASETS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onLoadSample(sample)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="group relative border-2 border-dashed border-slate-200 hover:border-blue-500 bg-white hover:bg-slate-50/50 rounded-xl p-8 text-center cursor-pointer transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {fileName ? fileName : 'Click to select or drag and drop your spreadsheet here'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports .xlsx, .xls, and .csv files. Unlimited columns supported.
            </p>
          </div>
        </div>
      </div>

      {/* File Data & Configuration Panel (Active when data loaded) */}
      {rows.length > 0 && stats && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          {/* Sheet & Column Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Worksheet Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Worksheet
              </label>
              <select
                value={activeSheet}
                onChange={(e) => onSelectSheet(e.target.value)}
                disabled={sheetNames.length <= 1}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {sheetNames.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
              <span className="block mt-1 text-[11px] text-slate-500">
                {sheetNames.length} sheet{sheetNames.length > 1 ? 's' : ''} available
              </span>
            </div>

            {/* Primary Key Column */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Primary Key Column
              </label>
              <select
                value={primaryKeyCol}
                onChange={(e) => onSelectPkCol(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <span className="block mt-1 text-[11px] text-slate-500">
                Identifiers will be strictly mapped back
              </span>
            </div>

            {/* Remarks Column */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Remarks / Comments Column
              </label>
              <select
                value={remarksCol}
                onChange={(e) => onSelectRemarksCol(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <span className="block mt-1 text-[11px] text-slate-500">
                Free-text source for semantic clustering
              </span>
            </div>
          </div>

          {/* Dataset Diagnostic Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Total Rows</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {stats.totalRows.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Unique Remarks</span>
              <span className="text-lg font-bold text-blue-600 font-mono tabular-nums">
                {stats.uniqueRemarksCount.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {Math.round((1 - stats.uniqueRemarksCount / Math.max(1, stats.nonBlankEligibleCount)) * 100)}% deduplication gain
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Blank Remarks</span>
              <span className={`text-lg font-bold font-mono tabular-nums ${stats.blankRemarksCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {stats.blankRemarksCount.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Preserved as &quot;Blank/No Remark&quot;
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Duplicate PKs</span>
              <span className={`text-lg font-bold font-mono tabular-nums ${stats.duplicatePkCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {stats.duplicatePkCount.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Preserved without merging
              </span>
            </div>
          </div>

          {/* Warnings & Notices */}
          {stats.totalRows > 20000 && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Large dataset detected ({stats.totalRows.toLocaleString()} rows): </span>
                RemarkIQ will automatically deduplicate repeated text and process in Web Workers to prevent UI freeze.
              </div>
            </div>
          )}

          {stats.duplicatePkCount > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Duplicate primary keys detected: </span>
                Every original record will remain distinct in the final export with its own assigned bucket.
              </div>
            </div>
          )}

          {/* Data Preview Table (First 20 rows) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Table className="w-3.5 h-3.5" />
                Preview: First 20 Rows
              </span>
              <span>
                Showing {Math.min(20, rows.length)} of {rows.length.toLocaleString()} rows
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-900 w-12 text-center">#</th>
                    {columns.map((col) => {
                      const isPk = col === primaryKeyCol;
                      const isRemark = col === remarksCol;
                      return (
                        <th
                          key={col}
                          className={`px-3 py-2 font-semibold whitespace-nowrap ${
                            isPk ? 'text-blue-700 bg-blue-50/50' : isRemark ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                          }`}
                        >
                          {col}
                          {isPk && <span className="ml-1 text-[10px] text-blue-600 font-normal">(PK)</span>}
                          {isRemark && <span className="ml-1 text-[10px] text-emerald-600 font-normal">(Remarks)</span>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2 font-mono text-slate-400 text-center tabular-nums">
                        {idx + 1}
                      </td>
                      {columns.map((col) => {
                        const val = row[col];
                        const isPk = col === primaryKeyCol;
                        const isRemark = col === remarksCol;
                        return (
                          <td
                            key={col}
                            className={`px-3 py-2 whitespace-nowrap max-w-xs truncate ${
                              isPk ? 'font-mono text-slate-900' : isRemark ? 'text-slate-800 font-medium' : 'text-slate-600'
                            }`}
                          >
                            {val !== undefined && val !== null && String(val).trim() !== '' ? (
                              String(val)
                            ) : (
                              <span className="text-slate-400 italic">[Blank]</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Columns validated. Ready for semantic clustering.
            </span>
            <button
              onClick={onProceed}
              disabled={isLoading || !remarksCol}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <span>Configure & Discover Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
