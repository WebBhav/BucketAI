import { Bucket } from '../types';

export interface GeminiBucketLabel {
  id: string;
  bucket_name: string;
  bucket_description: string;
  representative_examples: string[];
}

export interface MergeSuggestion {
  bucketIdsToMerge: string[];
  suggestedCombinedName: string;
  rationalExplanation: string;
}

// In-memory cache for labeled buckets by bucket fingerprint
const labelCache = new Map<string, GeminiBucketLabel>();

function createBucketFingerprint(bucket: Bucket): string {
  return `${bucket.id}_${bucket.sampleRemarks.slice(0, 5).join('|')}`;
}

/**
 * Checks server health and Gemini configuration status
 */
export async function checkServerGeminiStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.geminiConfigured);
  } catch (err) {
    return false;
  }
}

/**
 * Batch labels discovered buckets using Gemini API via backend proxy,
 * with caching and graceful local heuristic fallback if server/Gemini is unavailable.
 */
export async function labelBucketsWithGemini(
  buckets: Bucket[],
  datasetContext?: string,
  onStatusUpdate?: (status: string) => void,
  signal?: AbortSignal
): Promise<{ updatedBuckets: Bucket[]; usedAi: boolean; error?: string; isCancelled?: boolean }> {
  // Separate blank and outlier buckets from semantic clusters
  const eligibleBuckets = buckets.filter((b) => !b.isBlankBucket && !b.isOutlierBucket);

  if (eligibleBuckets.length === 0) {
    return { updatedBuckets: buckets, usedAi: false };
  }

  // Check which buckets are already in cache
  const neededBuckets: Bucket[] = [];
  eligibleBuckets.forEach((b) => {
    const fp = createBucketFingerprint(b);
    if (!labelCache.has(fp)) {
      neededBuckets.push(b);
    }
  });

  if (neededBuckets.length === 0) {
    // All buckets found in cache
    const updated = buckets.map((b) => {
      const fp = createBucketFingerprint(b);
      const cached = labelCache.get(fp);
      if (cached) {
        return {
          ...b,
          name: cached.bucket_name,
          description: cached.bucket_description,
          sampleRemarks: cached.representative_examples.length > 0 ? cached.representative_examples : b.sampleRemarks,
        };
      }
      return b;
    });
    return { updatedBuckets: updated, usedAi: true };
  }

  onStatusUpdate?.('Requesting AI category names & descriptions...');

  try {
    const response = await fetch('/api/gemini/label-buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: datasetContext || 'Operational remarks',
        buckets: neededBuckets.map((b) => ({
          id: b.id,
          keywords: b.keywords,
          sampleRemarks: b.sampleRemarks.slice(0, 8),
          totalItems: b.totalRows,
        })),
      }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const labels: GeminiBucketLabel[] = data.labels || [];

    const labelMap = new Map<string, GeminiBucketLabel>();
    labels.forEach((l) => {
      if (l.id && l.bucket_name) {
        labelMap.set(l.id, l);
      }
    });

    // Cache the returned labels
    neededBuckets.forEach((b) => {
      const l = labelMap.get(b.id);
      if (l) {
        labelCache.set(createBucketFingerprint(b), l);
      }
    });

    // Merge labels into buckets without touching underlying cluster assignments or original data
    const updatedBuckets = buckets.map((b) => {
      const l = labelMap.get(b.id) || labelCache.get(createBucketFingerprint(b));
      if (l) {
        return {
          ...b,
          name: l.bucket_name,
          description: l.bucket_description,
          sampleRemarks: l.representative_examples && l.representative_examples.length > 0 ? l.representative_examples : b.sampleRemarks,
        };
      }
      return b;
    });

    return { updatedBuckets, usedAi: true };
  } catch (err: any) {
    if (err.name === 'AbortError' || signal?.aborted) {
      return {
        updatedBuckets: buckets,
        usedAi: false,
        isCancelled: true,
      };
    }
    console.warn('Gemini labeling failed:', err);
    return {
      updatedBuckets: buckets,
      usedAi: false,
      error: err.message || 'Gemini naming unavailable. Kept existing category names.',
    };
  }
}

/**
 * Suggests potential merges for semantically overlapping buckets
 */
export async function suggestBucketMerges(
  buckets: Bucket[]
): Promise<MergeSuggestion[]> {
  const eligibleBuckets = buckets.filter((b) => !b.isBlankBucket && !b.isOutlierBucket);
  if (eligibleBuckets.length < 2) return [];

  try {
    const res = await fetch('/api/gemini/suggest-merges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buckets: eligibleBuckets.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          sampleRemarks: b.sampleRemarks.slice(0, 4),
        })),
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions || [];
  } catch (err) {
    console.warn('Merge suggestion failed:', err);
    return [];
  }
}
