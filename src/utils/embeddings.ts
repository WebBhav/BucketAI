import { batchGetCachedEmbeddings, batchSetCachedEmbeddings } from './cacheDb';

export type EmbeddingEngineType = 'transformer-minilm' | 'fast-semantic';

export interface EmbeddingProgress {
  stage: 'checking_cache' | 'loading_model' | 'generating' | 'saving_cache' | 'completed';
  completed: number;
  total: number;
  cachedCount: number;
  percent: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
}

// Global pipeline singleton to avoid reloading ONNX model repeatedly
let transformerPipeline: any = null;
let currentPipelineModel: string | null = null;
let isPipelineLoading = false;

/**
 * L2 Normalizes a Float32Array vector in-place
 */
export function normalizeVector(vec: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sum);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

/**
 * Cosine similarity between two normalized unit vectors (dot product)
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * High-performance 384-dimensional semantic n-gram & subword feature extractor.
 * Provides deterministic, high-quality, instant embeddings when offline or
 * when running massive benchmarks (100k rows).
 */
export function generateFastSemanticEmbedding(text: string, dimensions = 384): Float32Array {
  const vec = new Float32Array(dimensions);
  if (!text || text.trim() === '') {
    return vec;
  }

  const clean = text.toLowerCase().trim();
  const words = clean.split(/[^a-z0-9_-]+/).filter(Boolean);

  // Character 3-grams and 4-grams for subword morphological capturing
  for (let i = 0; i <= clean.length - 3; i++) {
    const gram = clean.substring(i, i + 3);
    let hash = 2166136261;
    for (let j = 0; j < gram.length; j++) {
      hash = (hash ^ gram.charCodeAt(j)) * 16777619;
    }
    const idx = Math.abs(hash) % dimensions;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vec[idx] += sign * 1.5;
  }

  // Word unigrams and bigrams
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    let hashW = 0x811c9dc5;
    for (let j = 0; j < w.length; j++) {
      hashW ^= w.charCodeAt(j);
      hashW = Math.imul(hashW, 0x01000193);
    }
    const idxW = Math.abs(hashW) % dimensions;
    const weight = Math.log(1 + w.length);
    vec[idxW] += weight * 2.0;

    // Bigram
    if (i < words.length - 1) {
      const bi = `${w}_${words[i + 1]}`;
      let hashBi = 0x811c9dc5;
      for (let j = 0; j < bi.length; j++) {
        hashBi ^= bi.charCodeAt(j);
        hashBi = Math.imul(hashBi, 0x01000193);
      }
      const idxBi = Math.abs(hashBi) % dimensions;
      vec[idxBi] += 2.5;
    }
  }

  return normalizeVector(vec);
}

/**
 * Loads the Transformers.js feature extraction pipeline
 */
async function getTransformerPipeline(modelName = 'Xenova/all-MiniLM-L6-v2', onProgress?: (msg: string) => void) {
  if (transformerPipeline && currentPipelineModel === modelName) {
    return transformerPipeline;
  }
  if (isPipelineLoading) {
    // Wait until loading finishes
    while (isPipelineLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return transformerPipeline;
  }

  isPipelineLoading = true;
  try {
    onProgress?.('Initializing browser ONNX runtime...');
    // Dynamic import to avoid breaking initial bundle if unsupported
    const { pipeline, env } = await import('@xenova/transformers');

    // Configure env for browser
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    onProgress?.(`Loading sentence embedding model (${modelName})...`);
    transformerPipeline = await pipeline('feature-extraction', modelName, {
      quantized: true,
      progress_callback: (progress: any) => {
        if (progress.status === 'progress' && progress.file) {
          const pct = Math.round((progress.loaded / (progress.total || 1)) * 100);
          onProgress?.(`Downloading ${progress.file.split('/').pop()}: ${pct}%`);
        }
      },
    });
    currentPipelineModel = modelName;
    return transformerPipeline;
  } finally {
    isPipelineLoading = false;
  }
}

/**
 * Batched embedding generation with IndexedDB cache and fallback resilience
 */
export async function generateEmbeddings(
  remarks: { hash: string; text: string }[],
  engine: EmbeddingEngineType = 'fast-semantic',
  onProgress?: (p: EmbeddingProgress) => void,
  signal?: AbortSignal
): Promise<Map<string, Float32Array>> {
  const startTime = Date.now();
  const total = remarks.length;
  const resultMap = new Map<string, Float32Array>();

  if (total === 0) return resultMap;

  const modelVersion = engine === 'transformer-minilm' ? 'minilm-l6-v2-q' : 'fast-semantic-v1';

  // Step 1: Check cache in IndexedDB
  onProgress?.({
    stage: 'checking_cache',
    completed: 0,
    total,
    cachedCount: 0,
    percent: 5,
    elapsedMs: Date.now() - startTime,
    estimatedRemainingMs: 0,
  });

  const cachedMap = await batchGetCachedEmbeddings(
    modelVersion,
    remarks.map((r) => r.hash)
  );

  const missingRemarks: { hash: string; text: string }[] = [];
  remarks.forEach((r) => {
    if (cachedMap.has(r.hash)) {
      resultMap.set(r.hash, cachedMap.get(r.hash)!);
    } else {
      missingRemarks.push(r);
    }
  });

  const cachedCount = resultMap.size;
  if (missingRemarks.length === 0) {
    onProgress?.({
      stage: 'completed',
      completed: total,
      total,
      cachedCount,
      percent: 100,
      elapsedMs: Date.now() - startTime,
      estimatedRemainingMs: 0,
    });
    return resultMap;
  }

  // Step 2: Compute missing embeddings
  let pipe: any = null;
  if (engine === 'transformer-minilm') {
    try {
      pipe = await getTransformerPipeline('Xenova/all-MiniLM-L6-v2', (statusText) => {
        onProgress?.({
          stage: 'loading_model',
          completed: cachedCount,
          total,
          cachedCount,
          percent: 15,
          elapsedMs: Date.now() - startTime,
          estimatedRemainingMs: 0,
        });
      });
    } catch (modelLoadErr) {
      console.warn('Transformer model loading failed, falling back to fast-semantic engine:', modelLoadErr);
      pipe = null;
    }
  }

  const batchSize = pipe ? 16 : 250;
  const toCache: { hash: string; vector: Float32Array; textSnippet: string }[] = [];
  let processedMissing = 0;

  for (let i = 0; i < missingRemarks.length; i += batchSize) {
    if (signal?.aborted) {
      throw new Error('Embedding generation cancelled by user.');
    }

    const batch = missingRemarks.slice(i, i + batchSize);

    if (pipe) {
      try {
        const texts = batch.map((b) => b.text || ' ');
        const output = await pipe(texts, { pooling: 'mean', normalize: true });
        
        // Extract tensors
        const data = output.data as Float32Array;
        const dims = output.dims; // [batchSize, 384]
        const vectorDim = dims ? dims[1] : 384;

        for (let b = 0; b < batch.length; b++) {
          const start = b * vectorDim;
          const end = start + vectorDim;
          const vec = new Float32Array(data.subarray(start, end));
          normalizeVector(vec);
          resultMap.set(batch[b].hash, vec);
          toCache.push({ hash: batch[b].hash, vector: vec, textSnippet: batch[b].text });
        }
      } catch (pipeErr) {
        console.warn('Batch inference failed on transformer, falling back to fast-semantic for batch:', pipeErr);
        // Fallback for this batch
        for (const item of batch) {
          const vec = generateFastSemanticEmbedding(item.text);
          resultMap.set(item.hash, vec);
          toCache.push({ hash: item.hash, vector: vec, textSnippet: item.text });
        }
      }
    } else {
      // Fast semantic engine
      for (const item of batch) {
        const vec = generateFastSemanticEmbedding(item.text);
        resultMap.set(item.hash, vec);
        toCache.push({ hash: item.hash, vector: vec, textSnippet: item.text });
      }
    }

    processedMissing += batch.length;
    const completed = cachedCount + processedMissing;
    const elapsed = Date.now() - startTime;
    const rate = processedMissing / Math.max(1, elapsed);
    const remainingCount = missingRemarks.length - processedMissing;
    const estRemaining = Math.round(remainingCount / Math.max(0.001, rate));

    onProgress?.({
      stage: 'generating',
      completed,
      total,
      cachedCount,
      percent: Math.min(95, Math.round((completed / total) * 100)),
      elapsedMs: elapsed,
      estimatedRemainingMs: estRemaining,
    });

    // Yield to main thread briefly for responsive UI
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Step 3: Save newly computed vectors to IndexedDB
  onProgress?.({
    stage: 'saving_cache',
    completed: total,
    total,
    cachedCount,
    percent: 98,
    elapsedMs: Date.now() - startTime,
    estimatedRemainingMs: 0,
  });

  await batchSetCachedEmbeddings(modelVersion, toCache);

  onProgress?.({
    stage: 'completed',
    completed: total,
    total,
    cachedCount,
    percent: 100,
    elapsedMs: Date.now() - startTime,
    estimatedRemainingMs: 0,
  });

  return resultMap;
}
