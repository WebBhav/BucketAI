/**
 * BucketAI — Intelligent Remark Bucketisation & Discovery
 * Built by Vaibhav Singhal
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavigationRail } from './components/NavigationRail';
import { LandingPage } from './components/LandingPage';
import { DeveloperDiagnostics } from './components/DeveloperDiagnostics';
import { AiNamingModal } from './components/AiNamingModal';
import { UploadStep } from './components/steps/UploadStep';
import { PreviewStep } from './components/steps/PreviewStep';
import { MappingFilteringStep } from './components/steps/MappingFilteringStep';
import { BucketisationStep } from './components/steps/BucketisationStep';
import { ResultsExportStep } from './components/steps/ResultsExportStep';
import { ProgressModal } from './components/ProgressModal';
import { SettingsModal } from './components/SettingsModal';
import {
  RenameModal,
  MergeModal,
  SplitModal,
  InspectBucketDrawer,
} from './components/BucketActionModals';
import {
  WorkflowStep,
  RawRow,
  DatasetStats,
  UniqueRemark,
  Bucket,
  ClusteringResult,
  GranularitySetting,
  RowAssignment,
  ColumnMeta,
  FilterConfig,
  WorkbookPreservationMeta,
  UserSettings,
} from './types';
import {
  parseExcelOrCsv,
  extractSheetData,
  exportChartPreservingWorkbook,
  buildColumnMetas,
} from './utils/excelHandler';
import { deduplicateRemarks } from './utils/textNormalization';
import {
  generateEmbeddings,
  EmbeddingEngineType,
  EmbeddingProgress,
} from './utils/embeddings';
import {
  discoverCategories,
  mergeBuckets,
  splitBucket,
} from './utils/clustering';
import {
  labelBucketsWithGemini,
  suggestBucketMerges,
  checkServerGeminiStatus,
  MergeSuggestion,
} from './utils/geminiClient';
import { applyFilterToRows } from './utils/filterEngine';
import { loadUserSettings } from './utils/settingsStore';
import { SAMPLE_DATASETS, SampleDatasetMeta } from './data/sampleDatasets';
import * as XLSX from 'xlsx';

export default function App() {
  // App View Mode: landing | utility | diagnostics
  const [viewMode, setViewMode] = useState<'landing' | 'utility' | 'diagnostics'>('landing');

  // User Settings
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Workflow Step Management
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');

  // Workbook State
  const workbookRef = useRef<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMetas, setColumnMetas] = useState<ColumnMeta[]>([]);
  const [primaryKeyCol, setPrimaryKeyCol] = useState<string>('');
  const [remarksCol, setRemarksCol] = useState<string>('');
  const [contextCols, setContextCols] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [preservationMeta, setPreservationMeta] = useState<WorkbookPreservationMeta | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Conditional Row Filter Config (Optional by default, do not prefill)
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    groups: [],
    groupCombinator: 'AND',
    inverted: false,
  });

  // Normalized Unique Remarks & Deduplication
  const [uniqueRemarks, setUniqueRemarks] = useState<UniqueRemark[]>([]);
  const embeddingsMapRef = useRef<Map<string, Float32Array>>(new Map());

  // Configuration Parameters
  const [granularity, setGranularity] = useState<GranularitySetting>({
    mode: settings.defaultGranularity,
    minBuckets: settings.minBuckets,
    maxBuckets: settings.maxBuckets,
  });
  const [engine, setEngine] = useState<EmbeddingEngineType>(settings.enginePreference);

  // Clustering Results
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([]);

  // Modals & Async Execution States
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [progressState, setProgressState] = useState<EmbeddingProgress | null>(null);
  const [progressStatusText, setProgressStatusText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const [renameBucketTarget, setRenameBucketTarget] = useState<Bucket | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [splitBucketTarget, setSplitBucketTarget] = useState<Bucket | null>(null);
  const [inspectBucketTarget, setInspectBucketTarget] = useState<Bucket | null>(null);
  
  // Gemini 3.1 Flash-Lite AI Naming States & Cancellation Refs
  const [isAiNamingModalOpen, setIsAiNamingModalOpen] = useState(false);
  const [isAiLabeling, setIsAiLabeling] = useState(false);
  const [aiNamingError, setAiNamingError] = useState<string | null>(null);
  const aiAbortControllerRef = useRef<AbortController | null>(null);
  const isAiCancelledRef = useRef<boolean>(false);
  const originalBucketsRef = useRef<Bucket[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Check URL query param for developer diagnostics
  useEffect(() => {
    checkServerGeminiStatus();
    if (
      window.location.search.includes('view=diagnostics') ||
      window.location.pathname.includes('/internal/diagnostics')
    ) {
      setViewMode('diagnostics');
    }
  }, []);

  // Sheet Selection Handler with Full Cache Invalidation
  const handleSelectSheet = (sheetName: string) => {
    if (!workbookRef.current || sheetName === activeSheet) return;
    try {
      const parsed = extractSheetData(workbookRef.current, sheetName, preservationMeta);
      setActiveSheet(sheetName);
      setColumns(parsed.columns);
      setColumnMetas(parsed.columnMetas);
      setRows(parsed.rows);

      const pk = parsed.columns.includes(settings.defaultPrimaryKeyCol)
        ? settings.defaultPrimaryKeyCol
        : parsed.suggestion.primaryKeyCol;
      const rem = parsed.columns.includes(settings.defaultRemarksCol)
        ? settings.defaultRemarksCol
        : parsed.suggestion.remarksCol;

      setPrimaryKeyCol(pk);
      setRemarksCol(rem);
      setContextCols(parsed.suggestion.contextCols);

      // Invalidate downstream deduplication, embeddings, and clustering
      const dedup = deduplicateRemarks(parsed.rows, rem, pk);
      setUniqueRemarks(dedup.uniqueRemarks);
      setStats(dedup.stats);
      embeddingsMapRef.current.clear();
      setClusteringResult(null);
      setMergeSuggestions([]);
    } catch (err: any) {
      alert(`Could not load worksheet "${sheetName}": ${err.message}`);
    }
  };

  // File Upload Handler
  const handleFileUpload = async (file: File) => {
    try {
      setValidationError(null);
      setFileName(file.name);
      setFileSize(file.size);

      const parsed = await parseExcelOrCsv(file);
      workbookRef.current = parsed.workbookObj || null;
      setSheetNames(parsed.sheetNames);
      setActiveSheet(parsed.activeSheet);
      setColumns(parsed.columns);
      setColumnMetas(parsed.columnMetas);
      setPreservationMeta(parsed.preservationMeta);

      const pk = parsed.columns.includes(settings.defaultPrimaryKeyCol)
        ? settings.defaultPrimaryKeyCol
        : parsed.suggestion.primaryKeyCol;
      const rem = parsed.columns.includes(settings.defaultRemarksCol)
        ? settings.defaultRemarksCol
        : parsed.suggestion.remarksCol;

      setPrimaryKeyCol(pk);
      setRemarksCol(rem);
      setContextCols(parsed.suggestion.contextCols);
      setRows(parsed.rows);

      // Filters remain optional; do not prefill automatically
      setFilterConfig({
        groups: [],
        groupCombinator: 'AND',
        inverted: false,
      });

      const dedup = deduplicateRemarks(parsed.rows, rem, pk);
      setUniqueRemarks(dedup.uniqueRemarks);
      setStats(dedup.stats);
      embeddingsMapRef.current.clear();
      setClusteringResult(null);
      setMergeSuggestions([]);

      // Switch to utility view and advance to Data Preview (or Upload if multiple sheets)
      setViewMode('utility');
      if (parsed.sheetNames.length > 1) {
        setCurrentStep('upload');
      } else {
        setCurrentStep('preview');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to read spreadsheet file');
      setViewMode('utility');
      setCurrentStep('upload');
    }
  };

  // Sample Dataset Handler
  const handleLoadSample = (sample: SampleDatasetMeta) => {
    const sampleRows = sample.getData();
    workbookRef.current = null;
    setFileName(`sample_${sample.id}.xlsx`);
    setFileSize(45 * 1024);
    setSheetNames(['Sheet1']);
    setActiveSheet('Sheet1');
    setColumns(sample.columns);
    const metas = buildColumnMetas(sample.columns, sampleRows);
    setColumnMetas(metas);
    setPrimaryKeyCol(sample.primaryKeyCol);
    setRemarksCol(sample.remarksCol);
    setContextCols(sample.columns.filter((c) => c !== sample.primaryKeyCol && c !== sample.remarksCol));
    setRows(sampleRows);

    // Filters remain optional; do not prefill automatically
    setFilterConfig({
      groups: [],
      groupCombinator: 'AND',
      inverted: false,
    });

    const dedup = deduplicateRemarks(sampleRows, sample.remarksCol, sample.primaryKeyCol);
    setUniqueRemarks(dedup.uniqueRemarks);
    setStats(dedup.stats);
    embeddingsMapRef.current.clear();
    setClusteringResult(null);
    setMergeSuggestions([]);

    setViewMode('utility');
    setCurrentStep('preview');
  };

  const handleRemoveFile = () => {
    workbookRef.current = null;
    setFileName(null);
    setRows([]);
    setColumns([]);
    setColumnMetas([]);
    setStats(null);
    setClusteringResult(null);
    setMergeSuggestions([]);
    setCurrentStep('upload');
  };

  // Run Semantic Discovery Pipeline (Step 4)
  const handleStartDiscovery = async (overrideGranularity?: GranularitySetting) => {
    if (rows.length === 0 || !remarksCol) return;

    const { includedIndices } = applyFilterToRows(rows, filterConfig);
    const includedRows = rows.filter((r) => includedIndices.has(r.__row_index__));

    if (includedRows.length === 0) {
      alert('The current filter rules exclude all rows. Please adjust your filter in Step 3.');
      return;
    }

    const currentGranularity = overrideGranularity || granularity;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProgressOpen(true);
    setProgressStatusText('Deduplicating remarks & computing semantic vectors in browser...');

    try {
      const dedup = deduplicateRemarks(includedRows, remarksCol, primaryKeyCol);
      setUniqueRemarks(dedup.uniqueRemarks);

      const nonBlank = dedup.uniqueRemarks.filter((u) => !u.isBlank);
      const embeddings = await generateEmbeddings(
        nonBlank.map((u) => ({ hash: u.hash, text: u.normalizedText })),
        engine,
        (p) => setProgressState(p),
        controller.signal
      );

      embeddingsMapRef.current = embeddings;

      setProgressStatusText('Clustering semantic topics within target bucket range...');
      const clusterRes = discoverCategories(
        dedup.uniqueRemarks,
        embeddings,
        {
          ...currentGranularity,
          minBuckets: settings.minBuckets,
          maxBuckets: settings.maxBuckets,
        },
        clusteringResult?.buckets
      );

      setClusteringResult({
        ...clusterRes,
        stats: {
          ...clusterRes.stats,
          totalRows: rows.length,
          includedRows: includedRows.length,
          excludedRows: rows.length - includedRows.length,
        },
      });

      setIsProgressOpen(false);
    } catch (err: any) {
      if (!err.message?.includes('cancelled')) {
        alert(`Clustering pipeline error: ${err.message}`);
      }
      setIsProgressOpen(false);
    }
  };

  // Live Granularity Adjustments
  const handleChangeGranularity = (newSetting: GranularitySetting) => {
    setGranularity(newSetting);
    if (embeddingsMapRef.current.size > 0 && clusteringResult) {
      const reCut = discoverCategories(
        uniqueRemarks,
        embeddingsMapRef.current,
        {
          ...newSetting,
          minBuckets: settings.minBuckets,
          maxBuckets: settings.maxBuckets,
        },
        clusteringResult.buckets
      );
      setClusteringResult({
        ...reCut,
        buckets: reCut.buckets,
        stats: {
          ...reCut.stats,
          totalRows: rows.length,
          includedRows: clusteringResult.stats.includedRows,
          excludedRows: clusteringResult.stats.excludedRows,
        },
      });
    }
  };

  // AI Bucket Naming via Gemini 3.1 Flash-Lite (triggered from Continue to Results & Exports)
  const handleProceedFromBucketise = () => {
    if (!clusteringResult || clusteringResult.buckets.length === 0) return;
    // Snapshot original buckets to restore if user cancels or chooses to proceed without AI
    originalBucketsRef.current = JSON.parse(JSON.stringify(clusteringResult.buckets));
    setAiNamingError(null);
    setIsAiNamingModalOpen(true);
  };

  const handleSkipAiNaming = () => {
    setIsAiNamingModalOpen(false);
    setAiNamingError(null);
    setCurrentStep('results');
  };

  const handleImproveNames = async () => {
    if (!clusteringResult || isAiLabeling) return; // Prevent duplicate requests

    setIsAiLabeling(true);
    setAiNamingError(null);
    isAiCancelledRef.current = false;

    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    try {
      const aiRes = await labelBucketsWithGemini(
        clusteringResult.buckets,
        `Remarks from column "${remarksCol}" in ${fileName || 'Excel file'}`,
        undefined,
        controller.signal
      );

      // If user cancelled, or a late response arrives after cancellation, NEVER apply!
      if (isAiCancelledRef.current || controller.signal.aborted || aiRes.isCancelled) {
        return;
      }

      if (aiRes.error) {
        setAiNamingError(aiRes.error);
        setIsAiLabeling(false);
        return;
      }

      // Successful naming: update bucket names and descriptions, then automatically proceed to Results & Exports
      setClusteringResult((prev) => (prev ? { ...prev, buckets: aiRes.updatedBuckets } : null));

      suggestBucketMerges(aiRes.updatedBuckets).then((sug) => {
        if (!isAiCancelledRef.current) {
          setMergeSuggestions(sug);
        }
      });

      setIsAiNamingModalOpen(false);
      setIsAiLabeling(false);
      setCurrentStep('results');
    } catch (err: any) {
      if (isAiCancelledRef.current || controller.signal.aborted) {
        return;
      }
      setAiNamingError(err.message || 'Gemini 3.1 Flash-Lite is currently unavailable. Please retry or continue without AI.');
      setIsAiLabeling(false);
    }
  };

  const handleCancelAiNaming = () => {
    isAiCancelledRef.current = true;
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAiLabeling(false);
    setAiNamingError(null);
    setIsAiNamingModalOpen(false);

    // Restore previous bucket names and descriptions if cancellation occurs
    if (originalBucketsRef.current.length > 0 && clusteringResult) {
      setClusteringResult((prev) =>
        prev ? { ...prev, buckets: originalBucketsRef.current } : null
      );
    }

    // Return the user to the bucket review step
    setCurrentStep('bucketise');
  };

  const handleContinueWithoutAi = () => {
    setIsAiNamingModalOpen(false);
    setAiNamingError(null);
    setCurrentStep('results');
  };

  // Bucket Actions
  const handleSaveRename = (bucketId: string, newName: string, newDescription: string) => {
    if (!clusteringResult) return;
    const updated = clusteringResult.buckets.map((b) =>
      b.id === bucketId
        ? { ...b, name: newName, description: newDescription, isManuallyCreatedOrModified: true }
        : b
    );
    setClusteringResult({ ...clusteringResult, buckets: updated });
  };

  const handleMergeBuckets = (bucketIds: string[], newCombinedName: string) => {
    if (!clusteringResult) return;
    const toMerge = clusteringResult.buckets.filter((b) => bucketIds.includes(b.id));
    if (toMerge.length < 2) return;

    const merged = mergeBuckets(toMerge, newCombinedName, uniqueRemarks);
    const remaining = clusteringResult.buckets.filter((b) => !bucketIds.includes(b.id));

    const newHashToBucket = new Map(clusteringResult.hashToBucketId);
    merged.uniqueRemarkHashes.forEach((h) => newHashToBucket.set(h, merged.id));

    setClusteringResult({
      ...clusteringResult,
      buckets: [merged, ...remaining],
      hashToBucketId: newHashToBucket,
    });

    setMergeSuggestions((prev) =>
      prev.filter((s) => !s.bucketIdsToMerge.some((id) => bucketIds.includes(id)))
    );
  };

  const handleSplitBucket = (bucket: Bucket, k: number) => {
    if (!clusteringResult || embeddingsMapRef.current.size === 0) return;
    const subBuckets = splitBucket(bucket, uniqueRemarks, embeddingsMapRef.current, k);

    const remaining = clusteringResult.buckets.filter((b) => b.id !== bucket.id);
    const newHashToBucket = new Map(clusteringResult.hashToBucketId);

    subBuckets.forEach((sub) => {
      sub.uniqueRemarkHashes.forEach((h) => newHashToBucket.set(h, sub.id));
    });

    setClusteringResult({
      ...clusteringResult,
      buckets: [...remaining, ...subBuckets],
      hashToBucketId: newHashToBucket,
    });
  };

  const handleMoveRemark = (hash: string, targetBucketId: string) => {
    if (!clusteringResult) return;
    const newHashToBucket = new Map(clusteringResult.hashToBucketId);
    newHashToBucket.set(hash, targetBucketId);

    const updatedBuckets = clusteringResult.buckets.map((b) => {
      const assigned = uniqueRemarks.filter((u) => newHashToBucket.get(u.hash) === b.id);
      return {
        ...b,
        uniqueRemarkHashes: assigned.map((u) => u.hash),
        totalRows: assigned.reduce((acc, u) => acc + u.rowIndices.length, 0),
        isManuallyCreatedOrModified: true,
      };
    });

    setClusteringResult({
      ...clusteringResult,
      buckets: updatedBuckets,
      hashToBucketId: newHashToBucket,
    });
  };

  const handleToggleReviewed = (bucketId: string) => {
    if (!clusteringResult) return;
    const updated = clusteringResult.buckets.map((b) => {
      if (b.id === bucketId) {
        const isReviewed = b.reviewedCount >= b.totalRows;
        return {
          ...b,
          reviewedCount: isReviewed ? 0 : b.totalRows,
        };
      }
      return b;
    });
    setClusteringResult({ ...clusteringResult, buckets: updated });
  };

  // Chart-Preserving Excel Export Handler
  const handleExport = async () => {
    if (!clusteringResult || rows.length === 0) return;
    setIsExporting(true);

    try {
      const { includedIndices } = applyFilterToRows(rows, filterConfig);
      const assignments = new Map<number, RowAssignment>();

      rows.forEach((row) => {
        const rowIdx = row.__row_index__;
        const isIncluded = includedIndices.has(rowIdx);

        if (!isIncluded) {
          assignments.set(rowIdx, {
            rowIndex: rowIdx,
            pkValue: row[primaryKeyCol],
            originalRemark: row[remarksCol],
            bucketId: '',
            bucketName: '',
            confidence: 'Medium',
            reviewed: false,
            isExcludedByFilter: true,
          });
        } else {
          const u = uniqueRemarks.find((item) => item.rowIndices.includes(rowIdx));
          const bucketId = u ? clusteringResult.hashToBucketId.get(u.hash) || 'bucket_outliers' : 'bucket_outliers';
          const bucket = clusteringResult.buckets.find((b) => b.id === bucketId);
          const conf = u ? clusteringResult.hashToConfidence.get(u.hash) || 'Medium' : 'Medium';

          assignments.set(rowIdx, {
            rowIndex: rowIdx,
            pkValue: row[primaryKeyCol],
            originalRemark: row[remarksCol],
            bucketId,
            bucketName: bucket?.name || 'Unassigned',
            confidence: conf,
            reviewed: bucket?.reviewedCount ? bucket.reviewedCount > 0 : false,
            isExcludedByFilter: false,
          });
        }
      });

      const exportName = fileName
        ? fileName.replace(/\.[^/.]+$/, '_BucketAI.xlsx')
        : 'BucketAI_Categorized_Remarks.xlsx';

      await exportChartPreservingWorkbook(
        rows,
        columns,
        assignments,
        clusteringResult.buckets,
        primaryKeyCol,
        preservationMeta,
        exportName
      );
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGoBack = () => {
    if (isAiLabeling) {
      handleCancelAiNaming();
      return;
    }
    if (currentStep === 'results') setCurrentStep('bucketise');
    else if (currentStep === 'bucketise') setCurrentStep('mapping');
    else if (currentStep === 'mapping') setCurrentStep('preview');
    else if (currentStep === 'preview') setCurrentStep('upload');
  };

  const handleStepTransition = (target: WorkflowStep) => {
    if (isAiLabeling) {
      handleCancelAiNaming();
    }
    if (target === 'bucketise' && !clusteringResult) {
      handleStartDiscovery();
    }
    setCurrentStep(target);
  };

  // VIEW 1: Diagnostics Mode
  if (viewMode === 'diagnostics') {
    return (
      <DeveloperDiagnostics
        onExit={() => {
          window.history.replaceState({}, '', '/');
          setViewMode('landing');
        }}
      />
    );
  }

  // VIEW 2: Public Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onStartUtility={() => setViewMode('utility')}
        onFileUpload={handleFileUpload}
        onLoadSample={handleLoadSample}
      />
    );
  }

  // VIEW 3: Main Utility Pipeline
  const { includedCount } = applyFilterToRows(rows, filterConfig);

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 antialiased font-sans bg-dot-grid">
      {/* Left-Side Navigation Rail */}
      <NavigationRail
        currentStep={currentStep}
        onNavigateStep={handleStepTransition}
        fileName={fileName}
        totalRows={rows.length}
        filteredRowsCount={includedCount}
        bucketCount={clusteringResult ? clusteringResult.buckets.length : 0}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onGoHome={() => setViewMode('landing')}
        canGoBack={currentStep !== 'upload'}
        onGoBack={handleGoBack}
      />

      {/* Main Workflow Viewport */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col justify-between">
        <div className="flex-1">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <UploadStep
              fileName={fileName}
              fileSize={fileSize}
              totalRows={rows.length}
              columnsCount={columns.length}
              sheetNames={sheetNames}
              activeSheet={activeSheet}
              onSelectSheet={handleSelectSheet}
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              onRemoveFile={handleRemoveFile}
              onProceed={() => setCurrentStep('preview')}
              isLoading={isProgressOpen}
              validationError={validationError}
            />
          )}

          {/* Step 2: Data Preview */}
          {currentStep === 'preview' && (
            <PreviewStep
              rows={rows}
              columns={columns}
              columnMetas={columnMetas}
              stats={stats}
              sheetNames={sheetNames}
              activeSheet={activeSheet}
              onSelectSheet={handleSelectSheet}
              onBack={() => setCurrentStep('upload')}
              onProceed={() => setCurrentStep('mapping')}
            />
          )}

          {/* Step 3: Column Mapping & Conditional Row Filtering */}
          {currentStep === 'mapping' && (
            <MappingFilteringStep
              columns={columns}
              columnMetas={columnMetas}
              primaryKeyCol={primaryKeyCol}
              remarksCol={remarksCol}
              contextCols={contextCols}
              onSelectPkCol={setPrimaryKeyCol}
              onSelectRemarksCol={setRemarksCol}
              onToggleContextCol={(col) =>
                setContextCols((prev) =>
                  prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
                )
              }
              rows={rows}
              filterConfig={filterConfig}
              onChangeFilterConfig={setFilterConfig}
              onBack={() => setCurrentStep('preview')}
              onProceed={() => {
                handleStartDiscovery();
                setCurrentStep('bucketise');
              }}
            />
          )}

          {/* Step 4: Category Discovery & Granularity */}
          {currentStep === 'bucketise' && (
            <BucketisationStep
              clusteringResult={clusteringResult}
              granularity={granularity}
              onChangeGranularity={handleChangeGranularity}
              engine={engine}
              onChangeEngine={setEngine}
              minBuckets={settings.minBuckets}
              maxBuckets={settings.maxBuckets}
              onStartDiscovery={handleStartDiscovery}
              isDiscovering={isProgressOpen}
              onOpenRename={setRenameBucketTarget}
              onOpenMerge={() => setIsMergeModalOpen(true)}
              onOpenSplit={setSplitBucketTarget}
              onInspectBucket={setInspectBucketTarget}
              onToggleReviewed={handleToggleReviewed}
              mergeSuggestions={mergeSuggestions}
              onApplyMergeSuggestion={(sug) =>
                handleMergeBuckets(sug.bucketIdsToMerge, sug.suggestedCombinedName)
              }
              onBack={() => setCurrentStep('mapping')}
              onProceed={handleProceedFromBucketise}
              includedRowsCount={includedCount}
              uniqueRemarkCount={uniqueRemarks.length}
            />
          )}

          {/* Step 5: Results & Chart-Preserving Export */}
          {currentStep === 'results' && clusteringResult && (
            <ResultsExportStep
              clusteringResult={clusteringResult}
              allRows={rows}
              uniqueRemarks={uniqueRemarks}
              remarksCol={remarksCol}
              primaryKeyCol={primaryKeyCol}
              preservationMeta={preservationMeta}
              onExport={handleExport}
              onInspectBucket={setInspectBucketTarget}
              onBack={() => setCurrentStep('bucketise')}
              isExporting={isExporting}
            />
          )}
        </div>

        {/* Global Minimalist Footer */}
        <footer className="mt-12 pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">BucketAI</span>
            <span>·</span>
            <span>Local Browser Inference</span>
            <span>·</span>
            <span>Chart & OpenXML Structure Preservation</span>
          </div>

          <div className="text-zinc-400 font-medium">
            Built by Vaibhav Singhal
          </div>
        </footer>
      </main>

      {/* Progress & Async Execution Modal */}
      <ProgressModal
        isOpen={isProgressOpen}
        progress={progressState}
        statusText={progressStatusText}
        onCancel={() => {
          abortControllerRef.current?.abort();
          setIsProgressOpen(false);
        }}
      />

      {/* AI Naming Confirmation Modal (Gemini 3.1 Flash-Lite) */}
      <AiNamingModal
        isOpen={isAiNamingModalOpen}
        bucketCount={clusteringResult ? clusteringResult.buckets.length : 0}
        isLoading={isAiLabeling}
        errorMessage={aiNamingError}
        onImproveNames={handleImproveNames}
        onSkipForNow={handleSkipAiNaming}
        onCancelRequest={handleCancelAiNaming}
        onRetry={handleImproveNames}
        onContinueWithoutAi={handleContinueWithoutAi}
        onClose={handleCancelAiNaming}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={setSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={Boolean(renameBucketTarget)}
        bucket={renameBucketTarget}
        onClose={() => setRenameBucketTarget(null)}
        onSave={handleSaveRename}
      />

      {/* Merge Modal */}
      <MergeModal
        isOpen={isMergeModalOpen}
        buckets={clusteringResult ? clusteringResult.buckets : []}
        onClose={() => setIsMergeModalOpen(false)}
        onMerge={handleMergeBuckets}
      />

      {/* Split Modal */}
      <SplitModal
        isOpen={Boolean(splitBucketTarget)}
        bucket={splitBucketTarget}
        onClose={() => setSplitBucketTarget(null)}
        onSplit={handleSplitBucket}
      />

      {/* Inspect Bucket Drawer */}
      <InspectBucketDrawer
        isOpen={Boolean(inspectBucketTarget)}
        bucket={inspectBucketTarget}
        uniqueRemarks={uniqueRemarks}
        allRows={rows}
        remarksCol={remarksCol}
        primaryKeyCol={primaryKeyCol}
        onClose={() => setInspectBucketTarget(null)}
        onMoveRemark={handleMoveRemark}
        allBuckets={clusteringResult ? clusteringResult.buckets : []}
      />
    </div>
  );
}
