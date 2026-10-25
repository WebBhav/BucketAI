import React from 'react';
import { Sliders, Sparkles, Cpu, Layers, HelpCircle, Shield, ArrowRight } from 'lucide-react';
import { GranularitySetting } from '../types';
import { EmbeddingEngineType } from '../utils/embeddings';

interface ConfigurationSectionProps {
  granularity: GranularitySetting;
  onChangeGranularity: (setting: GranularitySetting) => void;
  engine: EmbeddingEngineType;
  onChangeEngine: (engine: EmbeddingEngineType) => void;
  enableGeminiNaming: boolean;
  onToggleGeminiNaming: (enabled: boolean) => void;
  hasGeminiKey: boolean;
  onStartDiscovery: () => void;
  isLoading: boolean;
  uniqueRemarkCount: number;
  totalRowCount: number;
}

export const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({
  granularity,
  onChangeGranularity,
  engine,
  onChangeEngine,
  enableGeminiNaming,
  onToggleGeminiNaming,
  hasGeminiKey,
  onStartDiscovery,
  isLoading,
  uniqueRemarkCount,
  totalRowCount,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          2. Category Discovery & Granularity Parameters
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure how RemarkIQ discovers topic groups, cuts the semantic hierarchy, and generates category names.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section A: Granularity Control */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Granularity & Target Bucket Count
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {granularity.mode.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cuts the semantic dendrogram without re-embedding the text. Adjust to control category specificity.
            </p>

            {/* Granularity Preset Segmented Control */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-white border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => onChangeGranularity({ mode: 'broad' })}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  granularity.mode === 'broad'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Broad
              </button>
              <button
                type="button"
                onClick={() => onChangeGranularity({ mode: 'balanced' })}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  granularity.mode === 'balanced'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => onChangeGranularity({ mode: 'detailed' })}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  granularity.mode === 'detailed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Detailed
              </button>
              <button
                type="button"
                onClick={() => onChangeGranularity({ mode: 'custom', targetCount: granularity.targetCount || 5 })}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  granularity.mode === 'custom'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom K
              </button>
            </div>

            {/* Description of current mode */}
            <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100">
              {granularity.mode === 'broad' && (
                <span>
                  <strong>Broad:</strong> Produces 3–5 high-level thematic groups (e.g. Logistics, Quality, Finance).
                </span>
              )}
              {granularity.mode === 'balanced' && (
                <span>
                  <strong>Balanced (Recommended):</strong> Automatically identifies the most stable semantic cut balancing cluster cohesion and size distribution.
                </span>
              )}
              {granularity.mode === 'detailed' && (
                <span>
                  <strong>Detailed:</strong> Discovers fine-grained sub-categories (e.g. Port Delays, Damaged Packaging, Missing Certificates).
                </span>
              )}
              {granularity.mode === 'custom' && (
                <div className="flex items-center justify-between gap-3">
                  <span>Target number of buckets:</span>
                  <div className="flex items-center gap-1.5">
                    {[2, 5, 8, 12, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => onChangeGranularity({ mode: 'custom', targetCount: num })}
                        className={`px-2 py-1 text-xs rounded border ${
                          granularity.targetCount === num
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={granularity.targetCount || 5}
                      onChange={(e) =>
                        onChangeGranularity({
                          mode: 'custom',
                          targetCount: Math.max(2, parseInt(e.target.value) || 2),
                        })
                      }
                      className="w-14 px-2 py-0.5 text-xs font-mono border border-slate-200 rounded text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section B: Embedding Engine & Performance */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Inference & Embedding Engine
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All embeddings are computed locally on your device and cached in IndexedDB.
            </p>

            <div className="space-y-2.5">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  engine === 'fast-semantic'
                    ? 'bg-white border-blue-500 ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="engine"
                  checked={engine === 'fast-semantic'}
                  onChange={() => onChangeEngine('fast-semantic')}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Fast Semantic Feature Extractor (Instant, Offline-Safe)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    384-dimensional subword and n-gram vectorizer. Instant calculation; handles 100,000 rows in seconds without downloading neural models.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  engine === 'transformer-minilm'
                    ? 'bg-white border-blue-500 ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="engine"
                  checked={engine === 'transformer-minilm'}
                  onChange={() => onChangeEngine('transformer-minilm')}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Transformers.js Neural Model (all-MiniLM-L6-v2)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Runs quantized ONNX model in browser. Downloads ~25MB once and caches in browser cache.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section C: AI Category Labeling with Gemini */}
        <div className="mt-6 p-5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                AI Category Labeling & Synthesis (Gemini 3.8)
              </h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableGeminiNaming}
                onChange={(e) => onToggleGeminiNaming(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            When enabled, Gemini synthesizes discovered remark clusters into clear business titles and descriptions.
            Only 4–8 representative sample remarks per cluster are sent to the AI; your full Excel file is never sent.
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Privacy Guarantee: Zero raw data upload. Offline local heuristic naming is always available as fallback.
            </span>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Processing <span className="font-mono font-semibold text-slate-900">{uniqueRemarkCount.toLocaleString()}</span> unique remarks across <span className="font-mono font-semibold text-slate-900">{totalRowCount.toLocaleString()}</span> total rows.
          </div>

          <button
            onClick={onStartDiscovery}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <span>Run Category Discovery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
