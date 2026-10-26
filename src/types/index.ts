// BucketAI Core Data Models & Interfaces

export type WorkflowStep = 'upload' | 'preview' | 'mapping' | 'bucketise' | 'results';

export interface RawRow {
  __row_index__: number;
  [key: string]: any;
}

export interface ColumnMeta {
  name: string;
  letter: string; // e.g. A, B, ... K, ... AB
  index: number;
  inferredType: 'string' | 'number' | 'boolean' | 'date' | 'empty';
  sampleValues: any[];
}

export type FilterOperator =
  | 'is_null'
  | 'is_not_null'
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'is_true'
  | 'is_false';

export interface FilterRule {
  id: string;
  column: string;
  operator: FilterOperator;
  value?: string;
}

export interface FilterGroup {
  id: string;
  rules: FilterRule[];
  combinator: 'AND' | 'OR';
}

export interface FilterConfig {
  groups: FilterGroup[];
  groupCombinator: 'AND' | 'OR';
  inverted: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  config: FilterConfig;
  updatedAt: number;
}

export interface ColumnSuggestion {
  primaryKeyCol: string;
  remarksCol: string;
  contextCols: string[];
  allColumns: string[];
}

export interface UniqueRemark {
  hash: string;
  originalText: string;
  normalizedText: string;
  isBlank: boolean;
  rowIndices: number[]; // All original row indices containing this remark
  embedding?: Float32Array;
  clusterId?: string;
  confidence?: 'High' | 'Medium' | 'Low' | 'Needs Review';
  distanceToCentroid?: number;
}

export interface Bucket {
  id: string;
  name: string;
  description: string;
  color: string;
  keywords: string[];
  sampleRemarks: string[];
  uniqueRemarkHashes: string[];
  totalRows: number;
  reviewedCount: number;
  isManuallyCreatedOrModified?: boolean;
  isOutlierBucket?: boolean;
  isBlankBucket?: boolean;
  reviewRequired?: boolean;
}

export interface GranularitySetting {
  mode: 'broad' | 'balanced' | 'detailed' | 'custom';
  minBuckets?: number;
  maxBuckets?: number;
  targetCount?: number;
}

export interface DatasetStats {
  totalRows: number;
  blankRemarksCount: number;
  duplicatePkCount: number;
  uniqueRemarksCount: number;
  nonBlankEligibleCount: number;
  columnCount: number;
  includedRowsCount?: number;
  excludedRowsCount?: number;
}

export interface ClusteringResult {
  buckets: Bucket[];
  stats: {
    totalRows: number;
    includedRows: number;
    excludedRows: number;
    assignedRows: number;
    unclassifiedRows: number;
    needsReviewRows: number;
    assignedPercentage: number;
    outlierPercentage: number;
    clusteringTimeMs: number;
  };
  hashToBucketId: Map<string, string>;
  hashToConfidence: Map<string, 'High' | 'Medium' | 'Low' | 'Needs Review'>;
}

export interface RowAssignment {
  rowIndex: number;
  pkValue: any;
  originalRemark: string;
  bucketId: string;
  bucketName: string;
  confidence: 'High' | 'Medium' | 'Low' | 'Needs Review';
  reviewed: boolean;
  isExcludedByFilter?: boolean;
}

export interface TestResultItem {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

export interface BenchmarkResult {
  rowCount: number;
  uniqueRemarksCount: number;
  dedupRatio: number;
  embeddingTimeMs: number;
  clusteringTimeMs: number;
  totalTimeMs: number;
  bucketCount: number;
  outlierCount: number;
  peakMemoryMB?: number;
}

export interface UserSettings {
  defaultGranularity: 'broad' | 'balanced' | 'detailed';
  minBuckets: number;
  maxBuckets: number;
  defaultRemarksCol: string;
  defaultPrimaryKeyCol: string;
  defaultContextCols: string[];
  enginePreference: 'fast-semantic' | 'transformer-minilm';
  enableGeminiNaming: boolean;
  reviewThreshold: 'strict' | 'standard' | 'lenient';
  savedFilterPresets: FilterPreset[];
}

export interface WorkbookPreservationMeta {
  originalFileBuffer?: ArrayBuffer;
  originalFileName?: string;
  hasCharts: boolean;
  sheetCount: number;
  originalSheets: string[];
  detectedFeatures: string[];
}
