import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Play, Cpu, Loader2, Gauge } from 'lucide-react';
import { TestResultItem, BenchmarkResult } from '../types';
import { runAutomatedTestSuite, runScaleBenchmark } from '../utils/testSuite';

interface TestBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestBenchmarkModal: React.FC<TestBenchmarkModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'tests' | 'benchmarks'>('tests');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [currentTestName, setCurrentTestName] = useState('');

  const [benchmarkSize, setBenchmarkSize] = useState<number>(5000);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState('');
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    try {
      const results = await runAutomatedTestSuite((name) => {
        setCurrentTestName(name);
      });
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
      setCurrentTestName('');
    }
  };

  const handleRunBenchmark = async (size: number) => {
    setIsRunningBenchmark(true);
    setBenchmarkProgress(`Initializing ${size.toLocaleString()} rows...`);
    try {
      const res = await runScaleBenchmark(size, (msg) => setBenchmarkProgress(msg));
      setBenchmarkResults((prev) => [res, ...prev.filter((p) => p.rowCount !== size)]);
    } catch (err: any) {
      alert(`Benchmark failed: ${err.message}`);
    } finally {
      setIsRunningBenchmark(false);
      setBenchmarkProgress('');
    }
  };

  const allPassed = testResults.length > 0 && testResults.every((t) => t.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                System Diagnostics, Verification & Scale Benchmarks
              </h2>
              <p className="text-xs text-slate-500">
                Automated tests and progressive stress testing (5k, 20k, 100k rows)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tests')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Automated Test Suite ({testResults.length > 0 ? `${testResults.filter((t) => t.passed).length}/${testResults.length}` : '10 Tests'})
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'benchmarks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Scale Benchmarks (5k / 20k / 100k)
          </button>
        </div>

        {/* Tab 1: Automated Test Suite */}
        {activeTab === 'tests' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-600">
                Validates Excel parsing, blanks, duplicate PKs, row ordering, caching, clustering, splits, merges, and injection protection.
              </span>
              <button
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg shrink-0 cursor-pointer shadow-xs"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run All Tests</span>
                  </>
                )}
              </button>
            </div>

            {isRunningTests && (
              <div className="text-xs text-slate-600 font-mono flex items-center gap-2 p-2 bg-blue-50 rounded">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Executing: {currentTestName}</span>
              </div>
            )}

            {testResults.length > 0 && (
              <div className="space-y-2">
                {testResults.map((test) => (
                  <div
                    key={test.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      {test.passed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900">{test.name}</span>
                        <p className="text-slate-600 mt-0.5">{test.details}</p>
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                      {test.durationMs.toFixed(1)}ms
                    </span>
                  </div>
                ))}
              </div>
            )}

            {testResults.length === 0 && !isRunningTests && (
              <div className="text-center py-12 text-slate-400 text-xs">
                Click &quot;Run All Tests&quot; to execute the automated verification suite.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Scale Benchmarks */}
        {activeTab === 'benchmarks' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <span className="text-xs font-semibold text-slate-700 block">
                Select Benchmark Scale:
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {[5000, 20000, 100000].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleRunBenchmark(size)}
                    disabled={isRunningBenchmark}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <Gauge className="w-3.5 h-3.5 text-blue-600" />
                    <span>Run {size.toLocaleString()} Rows</span>
                  </button>
                ))}
              </div>

              {isRunningBenchmark && (
                <div className="flex items-center gap-2 text-xs font-mono text-blue-700 bg-blue-50 p-2.5 rounded">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>{benchmarkProgress}</span>
                </div>
              )}
            </div>

            {/* Benchmark History Cards */}
            {benchmarkResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Measured Scale Benchmarks:
                </h4>
                {benchmarkResults.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-sm text-slate-900 font-mono">
                        {b.rowCount.toLocaleString()} Total Rows
                      </span>
                      <span className="font-mono text-emerald-600 font-bold">
                        Total Time: {(b.totalTimeMs / 1000).toFixed(2)}s
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Unique Remarks</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {b.uniqueRemarksCount.toLocaleString()} ({Math.round(b.dedupRatio * 100)}% dedup)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Embedding Time</span>
                        <span className="font-semibold text-blue-600 tabular-nums">
                          {b.embeddingTimeMs}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Clustering Time</span>
                        <span className="font-semibold text-purple-600 tabular-nums">
                          {b.clusteringTimeMs}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Resulting Buckets</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {b.bucketCount} buckets ({b.outlierCount} outliers)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
