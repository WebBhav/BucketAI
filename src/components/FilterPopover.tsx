import React, { useState } from 'react';
import { Filter, X, Plus, Trash2, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { FilterConfig, FilterRule, FilterOperator, ColumnMeta, RawRow } from '../types';

interface FilterPopoverProps {
  filterConfig: FilterConfig;
  onChangeFilterConfig: (config: FilterConfig) => void;
  columnMetas: ColumnMeta[];
  rows: RawRow[];
  totalRowsCount: number;
  includedCount: number;
}

const OPERATORS: { key: FilterOperator; label: string; requiresValue: boolean }[] = [
  { key: 'contains', label: 'contains text', requiresValue: true },
  { key: 'not_contains', label: 'does not contain', requiresValue: true },
  { key: 'equals', label: 'equals (=)', requiresValue: true },
  { key: 'not_equals', label: 'does not equal (!=)', requiresValue: true },
  { key: 'is_not_null', label: 'is not blank / empty', requiresValue: false },
  { key: 'is_null', label: 'is blank / empty', requiresValue: false },
  { key: 'starts_with', label: 'starts with', requiresValue: true },
  { key: 'greater_than', label: 'greater than (>)', requiresValue: true },
  { key: 'less_than', label: 'less than (<)', requiresValue: true },
  { key: 'greater_than_or_equal', label: 'greater or equal (>=)', requiresValue: true },
  { key: 'less_than_or_equal', label: 'less or equal (<=)', requiresValue: true },
];

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  filterConfig,
  onChangeFilterConfig,
  columnMetas,
  rows,
  totalRowsCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Active rules count
  const activeRulesCount = filterConfig.groups.flatMap((g) => g.rules).length;

  // Local draft state for comfortable editing
  const [draftConfig, setDraftConfig] = useState<FilterConfig>(filterConfig);

  const handleOpen = () => {
    setDraftConfig(JSON.parse(JSON.stringify(filterConfig)));
    setShowAdvanced(Boolean(filterConfig.inverted || filterConfig.groups[0]?.combinator === 'OR'));
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    onChangeFilterConfig(draftConfig);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyConfig: FilterConfig = {
      groups: [],
      groupCombinator: 'AND',
      inverted: false,
    };
    setDraftConfig(emptyConfig);
    onChangeFilterConfig(emptyConfig);
    setIsOpen(false);
  };

  const handleAddCondition = () => {
    const defaultCol = columnMetas[0]?.name || '';
    const newRule: FilterRule = {
      id: `rule_${Date.now()}`,
      column: defaultCol,
      operator: 'contains',
      value: '',
    };

    if (draftConfig.groups.length === 0) {
      setDraftConfig({
        ...draftConfig,
        groups: [
          {
            id: 'group_1',
            rules: [newRule],
            combinator: 'AND',
          },
        ],
      });
    } else {
      const updated = { ...draftConfig };
      updated.groups[0].rules.push(newRule);
      setDraftConfig(updated);
    }
  };

  const handleRemoveRule = (ruleId: string) => {
    const updated = { ...draftConfig };
    if (updated.groups.length > 0) {
      updated.groups[0].rules = updated.groups[0].rules.filter((r) => r.id !== ruleId);
      if (updated.groups[0].rules.length === 0) {
        updated.groups = [];
      }
      setDraftConfig(updated);
    }
  };

  const handleUpdateRule = (ruleId: string, field: keyof FilterRule, val: any) => {
    const updated = { ...draftConfig };
    if (updated.groups.length > 0) {
      const rule = updated.groups[0].rules.find((r) => r.id === ruleId);
      if (rule) {
        (rule as any)[field] = val;
        if (field === 'column') {
          rule.value = '';
        }
        setDraftConfig(updated);
      }
    }
  };

  // Compute distinct observed sample values for selected column from active sheet
  const getObservedValuesForColumn = (colName: string): string[] => {
    if (!colName || rows.length === 0) return [];
    const set = new Set<string>();

    for (const r of rows) {
      const val = r[colName];
      if (val !== undefined && val !== null) {
        const str = String(val).trim();
        if (str !== '') {
          set.add(str);
          if (set.size >= 12) break;
        }
      }
    }
    return Array.from(set);
  };

  const currentRules = draftConfig.groups.length > 0 ? draftConfig.groups[0].rules : [];

  return (
    <div className="relative inline-block text-left">
      {/* Filter Rows Button */}
      <button
        type="button"
        onClick={handleOpen}
        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
          activeRulesCount > 0
            ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/50'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        <span>Filter Rows</span>
        {activeRulesCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
            {activeRulesCount}
          </span>
        )}
      </button>

      {/* Larger, comfortable Popover Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-100">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-zinc-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 shrink-0">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Conditional Row Filters
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Optionally filter rows to process. Excluded rows remain untouched in your workbook.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-850 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Rules Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {currentRules.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-300">
                      No active filters
                    </p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      All {totalRowsCount.toLocaleString()} rows in this worksheet will be included in remark bucketisation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Condition</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentRules.map((rule, idx) => {
                    const opMeta = OPERATORS.find((o) => o.key === rule.operator);
                    const observedValues = getObservedValuesForColumn(rule.column);

                    return (
                      <div
                        key={rule.id}
                        className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="font-semibold text-white text-[11px] uppercase tracking-wider">
                            Condition {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(rule.id)}
                            className="text-zinc-500 hover:text-rose-400 flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Remove condition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Column & Operator Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                              Column
                            </label>
                            <select
                              value={rule.column}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, 'column', e.target.value)
                              }
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                            >
                              {columnMetas.map((c) => (
                                <option key={c.name} value={c.name}>
                                  [{c.letter}] {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                              Operator
                            </label>
                            <select
                              value={rule.operator}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, 'operator', e.target.value as FilterOperator)
                              }
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                            >
                              {OPERATORS.map((o) => (
                                <option key={o.key} value={o.key}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Value Field & Dynamic Worksheet Suggestions */}
                        {opMeta?.requiresValue && (
                          <div className="space-y-2 pt-1 border-t border-zinc-900">
                            <div>
                              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                                Value to match
                              </label>
                              <input
                                type="text"
                                placeholder="Enter value or pick from observed suggestions below..."
                                value={rule.value || ''}
                                onChange={(e) =>
                                  handleUpdateRule(rule.id, 'value', e.target.value)
                                }
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-rose-500"
                              />
                            </div>

                            {/* Suggestions directly from current sheet values */}
                            {observedValues.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] text-zinc-500 block">
                                  Observed values in [{rule.column}]:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {observedValues.map((sVal, sIdx) => (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      onClick={() => handleUpdateRule(rule.id, 'value', sVal)}
                                      className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer truncate max-w-xs ${
                                        rule.value === sVal
                                          ? 'bg-rose-950/70 border-rose-700 text-rose-300 font-semibold'
                                          : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white'
                                      }`}
                                    >
                                      {sVal}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add another condition</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Advanced rules disclosure */}
              {currentRules.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {showAdvanced ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    <span>Advanced rules</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 p-4 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-4 text-xs animate-in fade-in duration-150">
                      {/* Combinator */}
                      {currentRules.length > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-zinc-200 block">Condition logic</span>
                            <span className="text-[11px] text-zinc-400">
                              Require all conditions or match any condition
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...draftConfig };
                                updated.groups[0].combinator = 'AND';
                                setDraftConfig(updated);
                              }}
                              className={`px-3 py-1 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                                draftConfig.groups[0]?.combinator === 'AND'
                                  ? 'bg-rose-600 text-white font-semibold'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Match ALL (AND)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...draftConfig };
                                updated.groups[0].combinator = 'OR';
                                setDraftConfig(updated);
                              }}
                              className={`px-3 py-1 text-xs rounded-md font-medium cursor-pointer transition-colors ${
                                draftConfig.groups[0]?.combinator === 'OR'
                                  ? 'bg-rose-600 text-white font-semibold'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Match ANY (OR)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Invert toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                        <div>
                          <span className="font-semibold text-zinc-200 block">Invert matching</span>
                          <span className="text-[11px] text-zinc-400">
                            Exclude rows matching these conditions instead of including them
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(draftConfig.inverted)}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, inverted: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Footer with Clear, Cancel, and Apply actions */}
            <div className="p-4 sm:px-6 sm:py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleClear}
                disabled={currentRules.length === 0 && !draftConfig.inverted}
                className="text-xs text-zinc-500 hover:text-rose-400 disabled:opacity-40 disabled:hover:text-zinc-500 transition-colors cursor-pointer"
              >
                Clear filters
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
