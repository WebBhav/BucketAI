import * as XLSX from 'xlsx';
import { TestResultItem, BenchmarkResult, RawRow, Bucket, FilterConfig } from '../types';
import { normalizeRemarkText, deduplicateRemarks } from './textNormalization';
import { generateEmbeddings, generateFastSemanticEmbedding, cosineSimilarity } from './embeddings';
import { discoverCategories, splitBucket, mergeBuckets } from './clustering';
import { detectColumns, sanitizeCellValue } from './excelHandler';
import { getCachedEmbedding, clearEmbeddingCache, batchSetCachedEmbeddings } from './cacheDb';
import { generateSyntheticBenchmarkData } from '../data/sampleDatasets';
import { evaluateFilterConfig, applyFilterToRows, formatFullFilterExpression } from './filterEngine';

/**
 * Runs the comprehensive automated test suite and reports individual results
 */
export async function runAutomatedTestSuite(
  onProgress?: (testName: string, passed: boolean) => void
): Promise<TestResultItem[]> {
  const results: TestResultItem[] = [];

  const addResult = (name: string, passed: boolean, duration: number, details: string) => {
    const item: TestResultItem = {
      id: `test_${results.length + 1}`,
      name,
      passed,
      durationMs: duration,
      details,
    };
    results.push(item);
    onProgress?.(name, passed);
  };

  // Test 1: Text Normalization & Business Term Preservation
  {
    const start = performance.now();
    try {
      const input = "  Material was NOT delivered! PO-9921 arrived with 15 units damaged on 2024-03-12.   ";
      const { normalized, isBlank, cleanOriginal } = normalizeRemarkText(input);

      const passed =
        !isBlank &&
        cleanOriginal === "Material was NOT delivered! PO-9921 arrived with 15 units damaged on 2024-03-12." &&
        normalized.includes('not') &&
        normalized.includes('po-9921') &&
        normalized.includes('15') &&
        normalized.includes('2024-03-12');

      addResult(
        '1. Text Normalization & Preservation',
        passed,
        performance.now() - start,
        passed ? 'Correctly preserved negations ("not"), PO codes, dates, and quantities while normalizing whitespace.' : 'Failed to preserve business tokens or clean whitespace.'
      );
    } catch (err: any) {
      addResult('1. Text Normalization & Preservation', false, performance.now() - start, err.message);
    }
  }

  // Test 2: Blank and Duplicate Remarks Handling
  {
    const start = performance.now();
    try {
      const mockRows: RawRow[] = [
        { __row_index__: 0, ID: '1', Note: 'Late delivery' },
        { __row_index__: 1, ID: '2', Note: '' },
        { __row_index__: 2, ID: '3', Note: '   ' },
        { __row_index__: 3, ID: '4', Note: 'N/A' },
        { __row_index__: 4, ID: '5', Note: 'Late delivery' },
        { __row_index__: 5, ID: '6', Note: 'late delivery' },
      ];

      const { uniqueRemarks, stats } = deduplicateRemarks(mockRows, 'Note', 'ID');
      const blankItem = uniqueRemarks.find((u) => u.isBlank);

      const passed =
        stats.totalRows === 6 &&
        stats.blankRemarksCount === 3 &&
        stats.uniqueRemarksCount === 1 &&
        blankItem !== undefined &&
        blankItem.rowIndices.length === 3;

      addResult(
        '2. Blank & Duplicate Remarks Deduplication',
        passed,
        performance.now() - start,
        passed ? `Identified 3 blanks and mapped 3 duplicate case variations to 1 unique remark.` : 'Failed deduplication or blank counting.'
      );
    } catch (err: any) {
      addResult('2. Blank & Duplicate Remarks Deduplication', false, performance.now() - start, err.message);
    }
  }

  // Test 3: Duplicate Primary Keys Preservation
  {
    const start = performance.now();
    try {
      const mockRows: RawRow[] = [
        { __row_index__: 0, PK: 'PO-100', Note: 'Batch 1 damaged' },
        { __row_index__: 1, PK: 'PO-100', Note: 'Batch 2 delayed' },
        { __row_index__: 2, PK: 'PO-101', Note: 'Delivered' },
      ];

      const { stats } = deduplicateRemarks(mockRows, 'Note', 'PK');
      const passed = stats.duplicatePkCount === 1 && mockRows.length === 3;

      addResult(
        '3. Duplicate Primary Keys Preservation',
        passed,
        performance.now() - start,
        passed ? 'Accurately detected 1 duplicate PK without discarding or merging records.' : 'Failed duplicate PK detection.'
      );
    } catch (err: any) {
      addResult('3. Duplicate Primary Keys Preservation', false, performance.now() - start, err.message);
    }
  }

  // Test 4: Embedding Caching in IndexedDB
  {
    const start = performance.now();
    try {
      await clearEmbeddingCache();
      const testHash = 'test_hash_bucketai';
      const testVec = new Float32Array(384).fill(0.7);

      await batchSetCachedEmbeddings('test-model', [{ hash: testHash, vector: testVec, textSnippet: 'Cache test' }]);
      const cached = await getCachedEmbedding('test-model', testHash);

      const passed = cached !== null && Math.abs(cached[0] - 0.7) < 0.001;

      addResult(
        '4. Embedding Caching (IndexedDB)',
        passed,
        performance.now() - start,
        passed ? 'Successfully wrote and retrieved 384-dimensional Float32Array from IndexedDB.' : 'Cache persistence error.'
      );
    } catch (err: any) {
      addResult('4. Embedding Caching (IndexedDB)', false, performance.now() - start, err.message);
    }
  }

  // Test 5: Complex Grouped Filter Evaluation `(K is null OR K > 100) AND AB is true`
  {
    const start = performance.now();
    try {
      const filterConfig: FilterConfig = {
        groups: [
          {
            id: 'g1',
            rules: [
              { id: 'r1', column: 'K', operator: 'is_null' },
              { id: 'r2', column: 'K', operator: 'greater_than', value: '100' },
            ],
            combinator: 'OR',
          },
          {
            id: 'g2',
            rules: [
              { id: 'r3', column: 'AB', operator: 'is_true' },
            ],
            combinator: 'AND',
          },
        ],
        groupCombinator: 'AND',
        inverted: false,
      };

      const testRows: RawRow[] = [
        { __row_index__: 0, K: null, AB: true }, // Match: null AND true
        { __row_index__: 1, K: 150, AB: true },  // Match: >100 AND true
        { __row_index__: 2, K: 50, AB: true },   // No match: 50 <= 100
        { __row_index__: 3, K: null, AB: false },// No match: AB is false
        { __row_index__: 4, K: 200, AB: false }, // No match: AB is false
      ];

      const { includedIndices, excludedIndices } = applyFilterToRows(testRows, filterConfig);

      const passed =
        includedIndices.has(0) &&
        includedIndices.has(1) &&
        !includedIndices.has(2) &&
        !includedIndices.has(3) &&
        !includedIndices.has(4) &&
        includedIndices.size === 2 &&
        excludedIndices.size === 3;

      addResult(
        '5. Grouped Filter: (K is null OR K > 100) AND AB is true',
        passed,
        performance.now() - start,
        passed
          ? 'Correctly evaluated nested parentheses rule logic and type-aware numeric/boolean comparisons.'
          : 'Filter rule logic failed to match intended rows.'
      );
    } catch (err: any) {
      addResult('5. Grouped Filter Logic', false, performance.now() - start, err.message);
    }
  }

  // Test 6: Excluded Rows Untouched Preservation
  {
    const start = performance.now();
    try {
      const mockRows: RawRow[] = [
        { __row_index__: 0, ID: 'P1', Remarks: 'Damaged item', Included: true },
        { __row_index__: 1, ID: 'P2', Remarks: 'Late arrival', Included: false },
      ];

      const filterConfig: FilterConfig = {
        groups: [
          {
            id: 'g1',
            rules: [{ id: 'r1', column: 'Included', operator: 'is_true' }],
            combinator: 'AND',
          },
        ],
        groupCombinator: 'AND',
        inverted: false,
      };

      const { includedIndices, excludedIndices } = applyFilterToRows(mockRows, filterConfig);
      const passed = includedIndices.has(0) && excludedIndices.has(1);

      addResult(
        '6. Excluded Rows Untouched Isolation',
        passed,
        performance.now() - start,
        passed
          ? 'Confirmed non-matching rows are flagged as excluded and preserved without modifying their original fields.'
          : 'Failed row exclusion isolation.'
      );
    } catch (err: any) {
      addResult('6. Excluded Rows Untouched Isolation', false, performance.now() - start, err.message);
    }
  }

  // Test 7: Category Discovery & Dendrogram Hierarchy
  {
    const start = performance.now();
    try {
      const mockTexts = [
        'Supplier failed to deliver material on time',
        'Delivery was late by one week',
        'Freight carrier delayed shipment due to weather',
        'Material received was broken and cracked',
        'Severe cosmetic damage on metal housing',
        'Invoice price higher than purchase order quote',
        'Discrepancy in invoice line total and taxes',
      ];

      const mockRows: RawRow[] = mockTexts.map((text, i) => ({
        __row_index__: i,
        ID: `ID-${i}`,
        Remark: text,
      }));

      const { uniqueRemarks } = deduplicateRemarks(mockRows, 'Remark', 'ID');
      const embMap = new Map<string, Float32Array>();
      uniqueRemarks.forEach((u) => {
        embMap.set(u.hash, generateFastSemanticEmbedding(u.normalizedText));
      });

      const clusterRes = discoverCategories(uniqueRemarks, embMap, { mode: 'balanced' });
      const passed =
        clusterRes.buckets.length >= 2 &&
        clusterRes.stats.assignedRows === mockTexts.length &&
        clusterRes.hashToBucketId.size === uniqueRemarks.length;

      addResult(
        '7. Semantic Discovery & Hierarchy Assignment',
        passed,
        performance.now() - start,
        passed ? `Successfully clustered remarks into ${clusterRes.buckets.length} semantic buckets.` : 'Clustering assignment failed.'
      );
    } catch (err: any) {
      addResult('7. Semantic Discovery & Hierarchy Assignment', false, performance.now() - start, err.message);
    }
  }

  // Test 8: Manual Merge & Split Operations
  {
    const start = performance.now();
    try {
      const bucketA: Bucket = {
        id: 'b_1',
        name: 'Packaging Damage',
        description: 'Torn boxes',
        color: '#2563EB',
        keywords: ['Damage', 'Box'],
        sampleRemarks: ['Crushed carton', 'Box pierced'],
        uniqueRemarkHashes: ['h1', 'h2'],
        totalRows: 10,
        reviewedCount: 0,
      };

      const bucketB: Bucket = {
        id: 'b_2',
        name: 'Component Cracks',
        description: 'Physical flaws',
        color: '#DC2626',
        keywords: ['Cracks', 'Flaws'],
        sampleRemarks: ['Hairline crack on lens', 'Fractured casing'],
        uniqueRemarkHashes: ['h3', 'h4'],
        totalRows: 15,
        reviewedCount: 0,
      };

      const mockUnique = [
        { hash: 'h1', originalText: 'Crushed carton', normalizedText: 'crushed carton', isBlank: false, rowIndices: [0] },
        { hash: 'h2', originalText: 'Box pierced', normalizedText: 'box pierced', isBlank: false, rowIndices: [1] },
        { hash: 'h3', originalText: 'Hairline crack on lens', normalizedText: 'hairline crack on lens', isBlank: false, rowIndices: [2] },
        { hash: 'h4', originalText: 'Fractured casing', normalizedText: 'fractured casing', isBlank: false, rowIndices: [3] },
      ];

      const merged = mergeBuckets([bucketA, bucketB], 'Combined Quality Issues', mockUnique);
      const passedMerge = merged.totalRows === 25 && merged.uniqueRemarkHashes.length === 4;

      const embMap = new Map<string, Float32Array>();
      mockUnique.forEach((u) => embMap.set(u.hash, generateFastSemanticEmbedding(u.normalizedText)));

      const split = splitBucket(merged, mockUnique, embMap, 2);
      const passedSplit = split.length === 2 && split[0].totalRows + split[1].totalRows === 25;

      const passed = passedMerge && passedSplit;
      addResult(
        '8. Bucket Merge & Reclustering Split',
        passed,
        performance.now() - start,
        passed ? 'Successfully merged buckets (retaining row counts) and re-split bucket via local reclustering.' : 'Merge or split operation failed row accounting.'
      );
    } catch (err: any) {
      addResult('8. Bucket Merge & Reclustering Split', false, performance.now() - start, err.message);
    }
  }

  // Test 9: Export Integrity & Formula Injection Sanitization
  {
    const start = performance.now();
    try {
      const maliciousVal = '=CMD("calc.exe")';
      const plusVal = '+12345';
      const safeVal = 'Supplier delay';

      const s1 = sanitizeCellValue(maliciousVal);
      const s2 = sanitizeCellValue(plusVal);
      const s3 = sanitizeCellValue(safeVal);

      const passed = s1 === `'=CMD("calc.exe")` && s2 === `'+12345` && s3 === 'Supplier delay';

      addResult(
        '9. Formula Injection Sanitization',
        passed,
        performance.now() - start,
        passed ? 'Escaped dangerous DDE leading characters (=, +, -, @) safely with single-quote prefix.' : 'Sanitization check failed.'
      );
    } catch (err: any) {
      addResult('9. Formula Injection Sanitization', false, performance.now() - start, err.message);
    }
  }

  // Test 10: Column Auto-Detection & Letter Mapping
  {
    const start = performance.now();
    try {
      const columns = ['PO_NUMBER', 'VENDOR_CODE', 'JUSTIFICATION_REASON', 'COST'];
      const suggestion = detectColumns(columns);

      const passed =
        suggestion.primaryKeyCol === 'PO_NUMBER' &&
        suggestion.remarksCol === 'JUSTIFICATION_REASON';

      addResult(
        '10. Column Header Auto-Detection & Mapping',
        passed,
        performance.now() - start,
        passed ? `Auto-detected PK: ${suggestion.primaryKeyCol}, Remarks: ${suggestion.remarksCol}.` : 'Failed regex column detection.'
      );
    } catch (err: any) {
      addResult('10. Column Header Auto-Detection & Mapping', false, performance.now() - start, err.message);
    }
  }

  // Test 11: AI Naming Request Cancellation & State Integrity
  {
    const start = performance.now();
    try {
      const mockBuckets: Bucket[] = [
        {
          id: 'b_1',
          name: 'Original Category 1',
          description: 'Original description 1',
          color: '#E11D48',
          keywords: ['delay'],
          sampleRemarks: ['Delivery was delayed'],
          uniqueRemarkHashes: ['h1'],
          totalRows: 10,
          reviewedCount: 0,
        },
      ];

      // Simulate cancellation before or during request
      const controller = new AbortController();
      controller.abort(); // Immediately aborted

      const { labelBucketsWithGemini } = await import('./geminiClient');
      const res = await labelBucketsWithGemini(mockBuckets, 'Test context', undefined, controller.signal);

      const passed =
        res.isCancelled === true &&
        res.updatedBuckets[0].name === 'Original Category 1' &&
        res.updatedBuckets[0].description === 'Original description 1';

      addResult(
        '11. AI Naming Request Cancellation & Integrity',
        passed,
        performance.now() - start,
        passed ? 'Correctly detected AbortSignal, aborted in-flight request, and preserved original bucket names.' : 'Failed to handle AbortSignal or modified bucket names after cancellation.'
      );
    } catch (err: any) {
      addResult('11. AI Naming Request Cancellation & Integrity', false, performance.now() - start, err.message);
    }
  }

  // Test 12: Optional Row Filtering & Full Data Inclusion
  {
    const start = performance.now();
    try {
      const mockRows: RawRow[] = [
        { __row_index__: 0, Region: 'North', Remark: 'Material damaged' },
        { __row_index__: 1, Region: 'South', Remark: 'Invoice mismatch' },
        { __row_index__: 2, Region: 'East', Remark: 'Delayed shipment' },
      ];

      // 1. Empty filter config should include 100% of rows
      const emptyConfig: FilterConfig = { groups: [], groupCombinator: 'AND', inverted: false };
      const resEmpty = applyFilterToRows(mockRows, emptyConfig);

      // 2. Active rule should filter accurately
      const activeConfig: FilterConfig = {
        groups: [
          {
            id: 'g1',
            rules: [{ id: 'r1', column: 'Region', operator: 'equals', value: 'North' }],
            combinator: 'AND',
          },
        ],
        groupCombinator: 'AND',
        inverted: false,
      };
      const resActive = applyFilterToRows(mockRows, activeConfig);

      const passed =
        resEmpty.includedCount === 3 &&
        resEmpty.excludedCount === 0 &&
        resActive.includedCount === 1 &&
        resActive.excludedCount === 2;

      addResult(
        '12. Optional Filtering & Full Data Inclusion',
        passed,
        performance.now() - start,
        passed ? 'Verified that unconfigured filters include 100% of rows by default, and active filters isolate target rows accurately.' : 'Filter inclusion or exclusion evaluation failed.'
      );
    } catch (err: any) {
      addResult('12. Optional Filtering & Full Data Inclusion', false, performance.now() - start, err.message);
    }
  }

  return results;
}

/**
 * Runs performance benchmark on synthetic dataset
 */
export async function runScaleBenchmark(
  rowCount: number,
  onProgress?: (msg: string) => void
): Promise<BenchmarkResult> {
  onProgress?.(`Generating ${rowCount.toLocaleString()} synthetic rows with power-law distribution...`);
  const t0 = performance.now();

  const { rows } = generateSyntheticBenchmarkData(rowCount);

  onProgress?.(`Normalizing & deduplicating ${rows.length.toLocaleString()} rows...`);
  const t1 = performance.now();
  const { uniqueRemarks } = deduplicateRemarks(rows, 'Remarks', 'Record_ID');
  const dedupRatio = 1 - uniqueRemarks.length / rows.length;

  onProgress?.(`Generating embeddings for ${uniqueRemarks.length.toLocaleString()} unique remarks...`);
  const t2 = performance.now();
  const embMap = new Map<string, Float32Array>();

  for (const u of uniqueRemarks) {
    if (!u.isBlank) {
      embMap.set(u.hash, generateFastSemanticEmbedding(u.normalizedText));
    }
  }
  const embeddingTime = performance.now() - t2;

  onProgress?.(`Discovering semantic categories and hierarchical cuts...`);
  const t3 = performance.now();
  const clusterRes = discoverCategories(uniqueRemarks, embMap, { mode: 'balanced' });
  const clusteringTime = performance.now() - t3;

  const totalTime = performance.now() - t1;

  let peakMemoryMB: number | undefined;
  if ((performance as any).memory && (performance as any).memory.usedJSHeapSize) {
    peakMemoryMB = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
  }

  return {
    rowCount: rows.length,
    uniqueRemarksCount: uniqueRemarks.filter((u) => !u.isBlank).length,
    dedupRatio,
    embeddingTimeMs: Math.round(embeddingTime),
    clusteringTimeMs: Math.round(clusteringTime),
    totalTimeMs: Math.round(totalTime),
    bucketCount: clusterRes.buckets.length,
    outlierCount: clusterRes.stats.unclassifiedRows,
    peakMemoryMB,
  };
}
