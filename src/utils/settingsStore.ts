import { UserSettings, FilterPreset } from '../types';

const SETTINGS_STORAGE_KEY = 'bucketai_user_settings_v2';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  defaultGranularity: 'balanced',
  minBuckets: 3,
  maxBuckets: 10,
  defaultRemarksCol: 'Remarks',
  defaultPrimaryKeyCol: 'PO_Number',
  defaultContextCols: [],
  enginePreference: 'fast-semantic',
  enableGeminiNaming: true,
  reviewThreshold: 'standard',
  savedFilterPresets: [
    {
      id: 'preset_non_blank',
      name: 'Non-Blank Remarks Only',
      config: {
        groups: [
          {
            id: 'g1',
            rules: [
              {
                id: 'r1',
                column: 'Remarks',
                operator: 'is_not_null',
              },
            ],
            combinator: 'AND',
          },
        ],
        groupCombinator: 'AND',
        inverted: false,
      },
      updatedAt: Date.now(),
    },
  ],
};

/**
 * Loads user settings from localStorage with fallback to default
 */
export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    const parsed = JSON.parse(raw);

    const min = typeof parsed.minBuckets === 'number' && parsed.minBuckets > 0 ? parsed.minBuckets : 3;
    const max = typeof parsed.maxBuckets === 'number' && parsed.maxBuckets >= min ? parsed.maxBuckets : 10;

    return {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      minBuckets: min,
      maxBuckets: max,
      savedFilterPresets: parsed.savedFilterPresets || DEFAULT_USER_SETTINGS.savedFilterPresets,
    };
  } catch (err) {
    console.warn('Failed to read user settings from localStorage:', err);
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Saves user settings to localStorage (excludes any sensitive tokens or keys)
 */
export function saveUserSettings(settings: UserSettings): void {
  try {
    // Validate range before saving
    const min = Math.max(1, settings.minBuckets || 3);
    const max = Math.max(min, settings.maxBuckets || 10);
    const validated: UserSettings = {
      ...settings,
      minBuckets: min,
      maxBuckets: max,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(validated));
  } catch (err) {
    console.warn('Failed to save user settings to localStorage:', err);
  }
}

/**
 * Resets user settings to default
 */
export function resetUserSettings(): UserSettings {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (err) {}
  return DEFAULT_USER_SETTINGS;
}

/**
 * Saves a new named filter preset into user settings
 */
export function saveFilterPreset(preset: FilterPreset): UserSettings {
  const settings = loadUserSettings();
  const existingIdx = settings.savedFilterPresets.findIndex(
    (p) => p.id === preset.id || p.name === preset.name
  );
  if (existingIdx >= 0) {
    settings.savedFilterPresets[existingIdx] = preset;
  } else {
    settings.savedFilterPresets.push(preset);
  }
  saveUserSettings(settings);
  return settings;
}
