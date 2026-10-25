import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { SAMPLE_DATASETS, SampleDatasetMeta } from '../../data/sampleDatasets';

interface UploadStepProps {
  fileName: string | null;
  fileSize?: number;
  totalRows: number;
  columnsCount: number;
  sheetNames: string[];
  activeSheet: string;
  onSelectSheet: (sheet: string) => void;
  onFileUpload: (file: File) => void;
  onLoadSample: (sample: SampleDatasetMeta) => void;
  onRemoveFile: () => void;
  onProceed: () => void;
  isLoading: boolean;
  validationError?: string | null;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  fileName,
  fileSize,
  totalRows,
  columnsCount,
  sheetNames,
  activeSheet,
  onSelectSheet,
  onFileUpload,
  onLoadSample,
  onRemoveFile,
  onProceed,
  isLoading,
  validationError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all bg-zinc-900/60 ${
          isDragging
            ? 'border-rose-500 bg-rose-950/20'
            : fileName
            ? 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
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

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-lg bg-zinc-800 text-rose-500 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {fileName ? fileName : 'Choose an Excel or CSV file or drag & drop'}
            </p>
            <p className="text-xs text-zinc-400">
              Supports .xlsx, .xls, and .csv files. Processing occurs entirely in your browser.
            </p>
          </div>

          {!fileName && (
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-all cursor-pointer"
            >
              Browse Files
            </button>
          )}
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-lg text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Uploaded File Confirmation & Sheet Selection */}
      {fileName && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <span className="text-sm font-bold text-white block">{fileName}</span>
                <span className="text-xs text-zinc-400 font-mono">
                  {formatFileSize(fileSize)} · {totalRows.toLocaleString()} rows · {columnsCount} columns
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="p-1.5 text-zinc-400 hover:text-white rounded"
                title="View technical details"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onRemoveFile}
                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible technical details */}
          {showTechDetails && (
            <div className="p-3 bg-zinc-950 rounded-lg text-[11px] font-mono text-zinc-400 space-y-1">
              <div>Detected sheets: {sheetNames.join(', ')}</div>
              <div>Memory usage: local in-browser buffer</div>
            </div>
          )}

          {/* Multi-sheet selection with explicit confirmation */}
          {sheetNames.length > 1 && (
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Select Worksheet to Analyze:</span>
              <select
                value={activeSheet}
                onChange={(e) => onSelectSheet(e.target.value)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CTA Action */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              File ready for preview
            </span>

            <button
              type="button"
              onClick={onProceed}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-all cursor-pointer shadow-sm"
            >
              <span>Continue to Data Preview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sample datasets */}
      {!fileName && (
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-400 pt-2">
          <span>Or load a demo:</span>
          {SAMPLE_DATASETS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onLoadSample(sample)}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-zinc-300 transition-colors cursor-pointer"
            >
              {sample.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
