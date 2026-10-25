import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { ColumnMeta, FilterConfig, RawRow } from '../../types';
import { FilterPopover } from '../FilterPopover';
import { applyFilterToRows } from '../../utils/filterEngine';

interface MappingFilteringStepProps {
  columns: string[];
  columnMetas: ColumnMeta[];
  primaryKeyCol: string;
  remarksCol: string;
  contextCols: string[];
  onSelectPkCol: (col: string) => void;
  onSelectRemarksCol: (col: string) => void;
  onToggleContextCol: (col: string) => void;
  rows: RawRow[];
  filterConfig: FilterConfig;
  onChangeFilterConfig: (config: FilterConfig) => void;
  onBack: () => void;
  onProceed: () => void;
}

export const MappingFilteringStep: React.FC<MappingFilteringStepProps> = ({
  columns,
  columnMetas,
  primaryKeyCol,
  remarksCol,
  contextCols,
  onSelectPkCol,
  onSelectRemarksCol,
  onToggleContextCol,
  rows,
  filterConfig,
  onChangeFilterConfig,
  onBack,
  onProceed,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Live filter results
  const { includedCount, excludedCount } = applyFilterToRows(rows, filterConfig);

  // Observed sample values for selected columns
  const pkSamples = rows.slice(0, 3).map((r) => String(r[primaryKeyCol] || '')).filter(Boolean);
  const remarkSamples = rows.slice(0, 3).map((r) => String(r[remarksCol] || '')).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Title & Filter Trigger Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-rose-500" />
            Column Mapping
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Identify the primary key and free-text remarks column for bucketisation.
          </p>
        </div>

        {/* Compact Filter Popover Button */}
        <FilterPopover
          filterConfig={filterConfig}
          onChangeFilterConfig={onChangeFilterConfig}
          columnMetas={columnMetas}
          rows={rows}
          totalRowsCount={rows.length}
          includedCount={includedCount}
        />
      </div>

      {/* Filter Status Badge (If active) */}
      {excludedCount > 0 && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
          <span className="text-zinc-300">
            Active Filter: <strong className="text-rose-400 font-mono">{includedCount.toLocaleString()}</strong> rows included,{' '}
            <strong className="text-zinc-500 font-mono">{excludedCount.toLocaleString()}</strong> rows excluded (untouched in output).
          </span>
          <span className="text-[11px] text-zinc-500">Click &quot;Filter Rows&quot; above to modify</span>
        </div>
      )}

      {/* Essential Column Selectors */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Remarks Column Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white">
              Free-Text Remarks Column <span className="text-rose-500">*</span>
            </label>
            <select
              value={remarksCol}
              onChange={(e) => onSelectRemarksCol(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 text-xs font-medium focus:outline-none focus:border-rose-500"
            >
              {columnMetas.map((c) => (
                <option key={c.name} value={c.name}>
                  [{c.letter}] {c.name}
                </option>
              ))}
            </select>

            {remarkSamples.length > 0 && (
              <div className="p-2.5 bg-zinc-950/70 rounded-md border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                <span className="text-zinc-500 font-medium block">Sample text:</span>
                <div className="truncate italic text-zinc-300">
                  &quot;{remarkSamples[0]}&quot;
                </div>
              </div>
            )}
          </div>

          {/* Primary Key Column Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white">
              Primary Key / Identifier Column <span className="text-rose-500">*</span>
            </label>
            <select
              value={primaryKeyCol}
              onChange={(e) => onSelectPkCol(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 text-xs font-medium focus:outline-none focus:border-rose-500"
            >
              {columnMetas.map((c) => (
                <option key={c.name} value={c.name}>
                  [{c.letter}] {c.name}
                </option>
              ))}
            </select>

            {pkSamples.length > 0 && (
              <div className="p-2.5 bg-zinc-950/70 rounded-md border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                <span className="text-zinc-500 font-medium block">Sample IDs:</span>
                <div className="font-mono text-zinc-300 truncate">
                  {pkSamples.join(' · ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Options (Collapsible) */}
        <div className="pt-2 border-t border-zinc-850">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>Advanced options (context columns)</span>
          </button>

          {showAdvanced && (
            <div className="pt-3 space-y-2 text-xs text-zinc-300 animate-in fade-in duration-100">
              <span className="text-zinc-500 text-[11px] block">
                Select additional columns to provide context when synthesizing bucket names:
              </span>
              <div className="flex flex-wrap gap-2">
                {columns
                  .filter((c) => c !== remarksCol && c !== primaryKeyCol)
                  .map((c) => {
                    const isSelected = contextCols.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onToggleContextCol(c)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Data Preview</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={!remarksCol || includedCount === 0}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-md transition-all cursor-pointer shadow-sm"
        >
          <span>Continue to Bucketisation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
