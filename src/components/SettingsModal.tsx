import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Save, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { UserSettings } from '../types';
import { saveUserSettings, resetUserSettings } from '../utils/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<UserSettings>({ ...settings });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const handleSave = () => {
    // Validate bucket range
    const min = Math.max(1, form.minBuckets || 2);
    const max = Math.max(min, form.maxBuckets || 10);

    if (min > max) {
      setRangeError('Minimum buckets cannot exceed maximum buckets.');
      return;
    }

    const validated: UserSettings = {
      ...form,
      minBuckets: min,
      maxBuckets: max,
    };

    saveUserSettings(validated);
    onUpdateSettings(validated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default values?')) {
      const def = resetUserSettings();
      setForm(def);
      onUpdateSettings(def);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-100">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-white">BucketAI Preferences</h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          {/* Bucket Range Configuration */}
          <div className="space-y-2">
            <label className="block font-semibold text-white">
              Default Bucket Count Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Minimum Buckets</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.minBuckets}
                  onChange={(e) => {
                    setRangeError(null);
                    setForm({ ...form, minBuckets: parseInt(e.target.value) || 2 });
                  }}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Maximum Buckets</span>
                <input
                  type="number"
                  min={form.minBuckets || 2}
                  max={50}
                  value={form.maxBuckets}
                  onChange={(e) => {
                    setRangeError(null);
                    setForm({ ...form, maxBuckets: parseInt(e.target.value) || 10 });
                  }}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {rangeError && (
              <p className="text-[11px] text-rose-400">{rangeError}</p>
            )}

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Guides the automatic clustering cut rather than forcing an artificial count when the data does not support it.
            </p>
          </div>

          {/* Default Granularity Preset */}
          <div>
            <label className="block font-semibold text-white mb-1.5">Default Granularity</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'broad', label: 'Broad' },
                { key: 'balanced', label: 'Balanced' },
                { key: 'detailed', label: 'Detailed' },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setForm({ ...form, defaultGranularity: g.key as any })}
                  className={`py-1.5 text-xs rounded border transition-all cursor-pointer font-medium ${
                    form.defaultGranularity === g.key
                      ? 'bg-rose-950/60 border-rose-600 text-rose-300 font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Collapsible Section */}
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Advanced Preferences</span>
            </button>

            {showAdvanced && (
              <div className="pt-3 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-zinc-300 mb-1">Preferred Remarks Header</label>
                  <input
                    type="text"
                    value={form.defaultRemarksCol}
                    onChange={(e) => setForm({ ...form, defaultRemarksCol: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Embedding Engine</label>
                  <select
                    value={form.enginePreference}
                    onChange={(e) => setForm({ ...form, enginePreference: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
                  >
                    <option value="fast-semantic">Fast Semantic (Instant, In-Browser)</option>
                    <option value="transformer-minilm">Transformers.js (all-MiniLM-L6-v2 ONNX)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded cursor-pointer shadow-sm"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
