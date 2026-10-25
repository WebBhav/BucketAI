import React from 'react';
import { Table, ArrowRight, ArrowLeft } from 'lucide-react';
import { RawRow, DatasetStats, ColumnMeta } from '../../types';

interface PreviewStepProps {
  rows: RawRow[];
  columns: string[];
  columnMetas: ColumnMeta[];
  stats: DatasetStats | null;
  sheetNames: string[];
  activeSheet: string;
  onSelectSheet: (sheet: string) => void;
  onBack: () => void;
  onProceed: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({
  rows,
  columns,
  columnMetas,
  stats,
  sheetNames,
  activeSheet,
  onSelectSheet,
  onBack,
  onProceed,
}) => {
  // Preview first 15 representative rows
  const previewRows = rows.slice(0, 15);

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Header & Sheet Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Table className="w-4 h-4 text-rose-500" />
            Data Preview
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Showing representative rows from <span className="text-white font-semibold font-mono">{activeSheet}</span>.
            Raw data is strictly preserved.
          </p>
        </div>

        {/* Sheet selector */}
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Sheet:</span>
            <select
              value={activeSheet}
              onChange={(e) => onSelectSheet(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
            >
              {sheetNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Counts Strip */}
      {stats && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 py-1">
          <span>
            Total rows: <strong className="text-white font-bold">{stats.totalRows.toLocaleString()}</strong>
          </span>
          <span>·</span>
          <span>
            Columns: <strong className="text-white font-bold">{stats.columnCount}</strong>
          </span>
          <span>·</span>
          <span>
            Unique remarks: <strong className="text-rose-400 font-bold">{stats.uniqueRemarksCount.toLocaleString()}</strong>
          </span>
          {stats.blankRemarksCount > 0 && (
            <>
              <span>·</span>
              <span>
                Blank remarks: <strong className="text-zinc-500">{stats.blankRemarksCount.toLocaleString()}</strong>
              </span>
            </>
          )}
        </div>
      )}

      {/* Small Table Preview */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 border-b border-zinc-800 sticky top-0 text-zinc-200">
              <tr>
                <th className="px-3 py-2 font-mono text-zinc-500 w-10 text-center">#</th>
                {columns.map((col) => {
                  const meta = columnMetas.find((c) => c.name === col);
                  return (
                    <th key={col} className="px-3 py-2 font-semibold whitespace-nowrap">
                      <span className="text-[10px] font-mono text-rose-500 mr-1.5">
                        {meta?.letter}
                      </span>
                      <span>{col}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-normal">
              {previewRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="px-3 py-1.5 font-mono text-zinc-500 text-center tabular-nums">
                    {rIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col];
                    const isEmpty = val === null || val === undefined || String(val).trim() === '';
                    return (
                      <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-xs truncate">
                        {isEmpty ? (
                          <span className="text-zinc-600 italic">[Empty]</span>
                        ) : (
                          <span className="text-zinc-300">{String(val)}</span>
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

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Upload</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-all cursor-pointer shadow-sm"
        >
          <span>Continue to Mapping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
