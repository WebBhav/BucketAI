import { RawRow, FilterConfig, FilterGroup, FilterRule, ColumnMeta } from '../types';

/**
 * Converts a 0-indexed column number to an Excel column letter (0 -> A, 25 -> Z, 26 -> AA, 27 -> AB)
 */
export function getExcelColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Parses a raw value into a comparable primitive (numeric, boolean, or trimmed string)
 */
export function parseValueForComparison(val: any): {
  type: 'number' | 'boolean' | 'date' | 'string' | 'empty';
  numVal?: number;
  boolVal?: boolean;
  dateVal?: number;
  strVal: string;
  isEmpty: boolean;
} {
  if (val === null || val === undefined) {
    return { type: 'empty', strVal: '', isEmpty: true };
  }

  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
    return { type: 'empty', strVal: '', isEmpty: true };
  }

  // Boolean detection
  const lower = str.toLowerCase();
  if (lower === 'true' || lower === 'yes' || lower === '1' || val === true) {
    return { type: 'boolean', boolVal: true, strVal: 'true', isEmpty: false };
  }
  if (lower === 'false' || lower === 'no' || lower === '0' || val === false) {
    return { type: 'boolean', boolVal: false, strVal: 'false', isEmpty: false };
  }

  // Number detection (clean commas and currency signs)
  const cleanNumStr = str.replace(/[$,€£]/g, '').trim();
  const num = Number(cleanNumStr);
  if (!isNaN(num) && cleanNumStr !== '') {
    return { type: 'number', numVal: num, strVal: str, isEmpty: false };
  }

  // Date detection
  const parsedDate = Date.parse(str);
  if (!isNaN(parsedDate) && /[\/-]/.test(str)) {
    return { type: 'date', dateVal: parsedDate, strVal: str, isEmpty: false };
  }

  return { type: 'string', strVal: str.toLowerCase(), isEmpty: false };
}

/**
 * Evaluates a single rule against a row
 */
export function evaluateRule(rule: FilterRule, row: RawRow): boolean {
  if (!rule.column) return true;

  const rawVal = row[rule.column];
  const parsed = parseValueForComparison(rawVal);

  switch (rule.operator) {
    case 'is_null':
      return parsed.isEmpty;

    case 'is_not_null':
      return !parsed.isEmpty;

    case 'is_true':
      return parsed.boolVal === true;

    case 'is_false':
      return parsed.boolVal === false || parsed.isEmpty;

    case 'equals': {
      if (rule.value === undefined) return false;
      const target = parseValueForComparison(rule.value);
      if (target.type === 'number' && parsed.type === 'number') {
        return parsed.numVal === target.numVal;
      }
      if (target.type === 'boolean' && parsed.type === 'boolean') {
        return parsed.boolVal === target.boolVal;
      }
      return String(rawVal).trim().toLowerCase() === String(rule.value).trim().toLowerCase();
    }

    case 'not_equals': {
      if (rule.value === undefined) return true;
      const target = parseValueForComparison(rule.value);
      if (target.type === 'number' && parsed.type === 'number') {
        return parsed.numVal !== target.numVal;
      }
      if (target.type === 'boolean' && parsed.type === 'boolean') {
        return parsed.boolVal !== target.boolVal;
      }
      return String(rawVal).trim().toLowerCase() !== String(rule.value).trim().toLowerCase();
    }

    case 'greater_than': {
      const target = Number(rule.value);
      if (isNaN(target)) return false;
      return parsed.numVal !== undefined && parsed.numVal > target;
    }

    case 'greater_than_or_equal': {
      const target = Number(rule.value);
      if (isNaN(target)) return false;
      return parsed.numVal !== undefined && parsed.numVal >= target;
    }

    case 'less_than': {
      const target = Number(rule.value);
      if (isNaN(target)) return false;
      return parsed.numVal !== undefined && parsed.numVal < target;
    }

    case 'less_than_or_equal': {
      const target = Number(rule.value);
      if (isNaN(target)) return false;
      return parsed.numVal !== undefined && parsed.numVal <= target;
    }

    case 'contains': {
      const target = String(rule.value || '').trim().toLowerCase();
      if (!target) return true;
      return String(rawVal || '').toLowerCase().includes(target);
    }

    case 'not_contains': {
      const target = String(rule.value || '').trim().toLowerCase();
      if (!target) return true;
      return !String(rawVal || '').toLowerCase().includes(target);
    }

    case 'starts_with': {
      const target = String(rule.value || '').trim().toLowerCase();
      if (!target) return true;
      return String(rawVal || '').toLowerCase().startsWith(target);
    }

    default:
      return true;
  }
}

/**
 * Evaluates a group of rules with its internal combinator (AND or OR)
 */
export function evaluateGroup(group: FilterGroup, row: RawRow): boolean {
  if (group.rules.length === 0) return true;

  if (group.combinator === 'AND') {
    return group.rules.every((rule) => evaluateRule(rule, row));
  } else {
    return group.rules.some((rule) => evaluateRule(rule, row));
  }
}

/**
 * Evaluates the full filter configuration across all rule groups,
 * respecting outer groupCombinator and inversion.
 */
export function evaluateFilterConfig(config: FilterConfig, row: RawRow): boolean {
  if (!config.groups || config.groups.length === 0) return true;

  // Filter out empty groups
  const activeGroups = config.groups.filter((g) => g.rules.length > 0);
  if (activeGroups.length === 0) return true;

  let result = false;
  if (config.groupCombinator === 'AND') {
    result = activeGroups.every((g) => evaluateGroup(g, row));
  } else {
    result = activeGroups.some((g) => evaluateGroup(g, row));
  }

  return config.inverted ? !result : result;
}

/**
 * Filters rows and returns matching indices and statistics
 */
export function applyFilterToRows(
  rows: RawRow[],
  config: FilterConfig | null
): {
  includedIndices: Set<number>;
  excludedIndices: Set<number>;
  includedCount: number;
  excludedCount: number;
} {
  const includedIndices = new Set<number>();
  const excludedIndices = new Set<number>();

  if (!config || config.groups.length === 0) {
    rows.forEach((r) => includedIndices.add(r.__row_index__));
    return {
      includedIndices,
      excludedIndices,
      includedCount: rows.length,
      excludedCount: 0,
    };
  }

  rows.forEach((row) => {
    const matches = evaluateFilterConfig(config, row);
    if (matches) {
      includedIndices.add(row.__row_index__);
    } else {
      excludedIndices.add(row.__row_index__);
    }
  });

  return {
    includedIndices,
    excludedIndices,
    includedCount: includedIndices.size,
    excludedCount: excludedIndices.size,
  };
}

/**
 * Formats a rule into human-readable text (e.g. "K > 100")
 */
export function formatRuleExpression(rule: FilterRule, columns: ColumnMeta[]): string {
  const colMeta = columns.find((c) => c.name === rule.column);
  const colLabel = colMeta ? `${colMeta.letter} (${colMeta.name})` : rule.column;

  switch (rule.operator) {
    case 'is_null':
      return `${colLabel} is null`;
    case 'is_not_null':
      return `${colLabel} is not null`;
    case 'is_true':
      return `${colLabel} is true`;
    case 'is_false':
      return `${colLabel} is false`;
    case 'equals':
      return `${colLabel} = "${rule.value || ''}"`;
    case 'not_equals':
      return `${colLabel} != "${rule.value || ''}"`;
    case 'greater_than':
      return `${colLabel} > ${rule.value || 0}`;
    case 'greater_than_or_equal':
      return `${colLabel} >= ${rule.value || 0}`;
    case 'less_than':
      return `${colLabel} < ${rule.value || 0}`;
    case 'less_than_or_equal':
      return `${colLabel} <= ${rule.value || 0}`;
    case 'contains':
      return `${colLabel} contains "${rule.value || ''}"`;
    case 'not_contains':
      return `${colLabel} does not contain "${rule.value || ''}"`;
    case 'starts_with':
      return `${colLabel} starts with "${rule.value || ''}"`;
    default:
      return `${colLabel} ${rule.operator}`;
  }
}

/**
 * Returns explicit logical expression representation with parentheses,
 * e.g. `(K is null OR K > 100) AND AB is true`
 */
export function formatFullFilterExpression(config: FilterConfig, columns: ColumnMeta[]): string {
  if (!config.groups || config.groups.length === 0) {
    return 'All rows included (no active filter)';
  }

  const activeGroups = config.groups.filter((g) => g.rules.length > 0);
  if (activeGroups.length === 0) {
    return 'All rows included (no active filter)';
  }

  const groupExpressions = activeGroups.map((g) => {
    if (g.rules.length === 1) {
      return formatRuleExpression(g.rules[0], columns);
    }
    const inner = g.rules
      .map((r) => formatRuleExpression(r, columns))
      .join(` ${g.combinator} `);
    return `(${inner})`;
  });

  const fullExpr = groupExpressions.join(` ${config.groupCombinator} `);
  return config.inverted ? `NOT (${fullExpr})` : fullExpr;
}
