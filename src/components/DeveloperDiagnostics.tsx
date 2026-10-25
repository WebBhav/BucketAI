import React, { useState } from 'react';
import { Cpu, Play, CheckCircle, XCircle, Loader2, Gauge, ArrowLeft } from 'lucide-react';
import { TestResultItem, BenchmarkResult } from '../types';
import { runAutomatedTestSuite, runScaleBenchmark } from '../utils/testSuite';

export const DeveloperDiagnostics: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [currentTestName, setCurrentTestName] = useState('');

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
      alert(`Benchmark error: ${err.message}`);
    } finally {
      setIsRunningBenchmark(false);
      setBenchmarkProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-6 max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-rose-500" />
          <div>
            <h1 className="text-lg font-bold text-white">BucketAI — Internal Diagnostics & Tests</h1>
            <p className="text-xs text-zinc-400">Developer-only testing suite & scale benchmarks</p>
          </div>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Diagnostics</span>
        </button>
      </div>

      {/* Test Suite Section */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Automated Verification Suite (12 Tests)</h2>
            <p className="text-xs text-zinc-400">
              Validates Excel parsing, blanks, duplicate PKs, grouped filter logic, chart preservation, formula safety, and AI naming cancellation.
            </p>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 rounded cursor-pointer"
          >
            {isRunningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Run All Tests</span>
          </button>
        </div>

        {isRunningTests && (
          <div className="p-3 bg-zinc-950 rounded text-xs font-mono text-rose-400 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Executing: {currentTestName}</span>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="space-y-2 pt-2">
            {testResults.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-lg flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {t.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-white">{t.name}</span>
                    <p className="text-zinc-400 mt-0.5">{t.details}</p>
                  </div>
                </div>
                <span className="text-zinc-500 font-mono text-[11px] tabular-nums whitespace-nowrap">
                  {t.durationMs.toFixed(1)}ms
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scale Benchmark Runner */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Scale Benchmarking (5k / 20k / 100k)</h2>
            <p className="text-xs text-zinc-400">
              Measures memory, deduplication ratio, embedding latency, and clustering runtime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[5000, 20000, 100000].map((size) => (
              <button
                key={size}
                onClick={() => handleRunBenchmark(size)}
                disabled={isRunningBenchmark}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded cursor-pointer"
              >
                {size.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {isRunningBenchmark && (
          <div className="p-3 bg-zinc-950 rounded text-xs font-mono text-zinc-300 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
            <span>{benchmarkProgress}</span>
          </div>
        )}

        {benchmarkResults.length > 0 && (
          <div className="space-y-3 pt-2">
            {benchmarkResults.map((b, idx) => (
              <div
                key={idx}
                className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-lg text-xs space-y-2 font-mono"
              >
                <div className="flex items-center justify-between font-bold text-white text-sm">
                  <span>{b.rowCount.toLocaleString()} Rows Dataset</span>
                  <span className="text-rose-400">Total: {(b.totalTimeMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-400 text-[11px]">
                  <div>Unique: {b.uniqueRemarksCount} ({Math.round(b.dedupRatio * 100)}% dedup)</div>
                  <div>Embedding: {b.embeddingTimeMs}ms</div>
                  <div>Clustering: {b.clusteringTimeMs}ms</div>
                  <div>Buckets: {b.bucketCount}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
