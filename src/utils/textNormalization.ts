import { RawRow, UniqueRemark, DatasetStats } from '../types';

// Fast 32-bit FNV-1a string hashing
export function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Normalizes text while strictly preserving:
 * - Negations ("not", "never", "no", "without", "failed")
 * - Quantities, numbers, currencies ("$500", "12 units", "15kg")
 * - Dates and reference codes ("PO-994", "2024-03-12", "RFQ")
 * - Business abbreviations
 */
export function normalizeRemarkText(rawText: any): {
  normalized: string;
  isBlank: boolean;
  cleanOriginal: string;
} {
  if (rawText === null || rawText === undefined) {
    return { normalized: '', isBlank: true, cleanOriginal: '' };
  }

  const str = String(rawText);
  const trimmed = str.trim();

  if (!trimmed || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'na' || trimmed === '-' || trimmed === '.') {
    return { normalized: '', isBlank: true, cleanOriginal: trimmed };
  }

  // Normalize Unicode characters (accents, curly quotes)
  let normalized = trimmed
    .normalize('NFKD')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' '); // Collapse all whitespace (tabs, newlines, multi-spaces)

  const normalizedLower = normalized.toLowerCase();

  return {
    normalized: normalizedLower,
    isBlank: false,
    cleanOriginal: trimmed,
  };
}

/**
 * Deduplicates remarks across all rows, mapping unique normalized strings
 * back to every original row index.
 */
export function deduplicateRemarks(
  rows: RawRow[],
  remarksCol: string,
  primaryKeyCol: string
): {
  uniqueRemarks: UniqueRemark[];
  stats: DatasetStats;
  hashToUniqueRemark: Map<string, UniqueRemark>;
} {
  const hashToRemark = new Map<string, UniqueRemark>();
  const seenPks = new Set<any>();
  let duplicatePkCount = 0;
  let blankRemarksCount = 0;

  rows.forEach((row, rowIndex) => {
    // Check primary key duplication
    const pkVal = row[primaryKeyCol];
    if (pkVal !== undefined && pkVal !== null && String(pkVal).trim() !== '') {
      const pkKey = String(pkVal);
      if (seenPks.has(pkKey)) {
        duplicatePkCount++;
      } else {
        seenPks.add(pkKey);
      }
    }

    const rawRemark = row[remarksCol];
    const { normalized, isBlank, cleanOriginal } = normalizeRemarkText(rawRemark);

    if (isBlank) {
      blankRemarksCount++;
      const blankHash = '__BLANK_REMARK__';
      if (!hashToRemark.has(blankHash)) {
        hashToRemark.set(blankHash, {
          hash: blankHash,
          originalText: 'Blank / No Remark',
          normalizedText: '',
          isBlank: true,
          rowIndices: [rowIndex],
        });
      } else {
        hashToRemark.get(blankHash)!.rowIndices.push(rowIndex);
      }
      return;
    }

    const hash = fnv1aHash(normalized);
    if (!hashToRemark.has(hash)) {
      hashToRemark.set(hash, {
        hash,
        originalText: cleanOriginal,
        normalizedText: normalized,
        isBlank: false,
        rowIndices: [rowIndex],
      });
    } else {
      hashToRemark.get(hash)!.rowIndices.push(rowIndex);
    }
  });

  const uniqueRemarks = Array.from(hashToRemark.values());
  const nonBlankEligibleCount = rows.length - blankRemarksCount;

  const stats: DatasetStats = {
    totalRows: rows.length,
    blankRemarksCount,
    duplicatePkCount,
    uniqueRemarksCount: uniqueRemarks.filter((u) => !u.isBlank).length,
    nonBlankEligibleCount,
    columnCount: rows.length > 0 ? Object.keys(rows[0]).filter((k) => k !== '__row_index__').length : 0,
  };

  return {
    uniqueRemarks,
    stats,
    hashToUniqueRemark: hashToRemark,
  };
}

/**
 * Stop words for keyword and n-gram extraction (preserves negations)
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'it', 'its', 'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'what',
  'there', 'their', 'they', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her',
  'i', 'me', 'my', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some',
  'such', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'under', 'again', 'further', 'then', 'once', 'here', 'why', 'how', 'when',
  'where', 'just', 'should', 'would', 'could', 'can', 'will', 'very',
]);

/**
 * Extract top keywords / key phrases from a collection of remarks using TF-IDF
 */
export function extractTopKeywords(remarks: string[], topK: number = 4): string[] {
  if (remarks.length === 0) return [];

  const docFreq = new Map<string, number>();
  const totalDocs = remarks.length;
  const tokenizedDocs: string[][] = [];

  for (const text of remarks) {
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

    const uniqueInDoc = new Set(tokens);
    for (const t of uniqueInDoc) {
      docFreq.set(t, (docFreq.get(t) || 0) + 1);
    }
    tokenizedDocs.push(tokens);
  }

  // Score tokens using TF-IDF
  const tokenScores = new Map<string, number>();

  tokenizedDocs.forEach((tokens) => {
    const termFreq = new Map<string, number>();
    for (const t of tokens) {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    }

    termFreq.forEach((tf, term) => {
      const df = docFreq.get(term) || 1;
      const idf = Math.log((totalDocs + 1) / (df + 0.5)) + 1;
      const score = (tf / tokens.length) * idf;
      tokenScores.set(term, (tokenScores.get(term) || 0) + score);
    });
  });

  return Array.from(tokenScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([term]) => term.charAt(0).toUpperCase() + term.slice(1));
}
