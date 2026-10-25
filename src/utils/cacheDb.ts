import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'remarkiq_embeddings_cache';
const DB_VERSION = 1;
const STORE_NAME = 'embeddings';

export interface CachedEmbeddingRecord {
  key: string; // `${modelVersion}_${textHash}`
  modelVersion: string;
  hash: string;
  textSnippet: string;
  vector: number[]; // stored as standard number array in IDB
  dimensions: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('modelVersion', 'modelVersion');
          store.createIndex('updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Retrieve cached embedding vector for a given hash and model version
 */
export async function getCachedEmbedding(
  modelVersion: string,
  hash: string
): Promise<Float32Array | null> {
  try {
    const db = await getDb();
    const key = `${modelVersion}_${hash}`;
    const record = await db.get(STORE_NAME, key);
    if (record && record.vector) {
      return new Float32Array(record.vector);
    }
    return null;
  } catch (err) {
    console.warn('Error reading from IndexedDB embedding cache:', err);
    return null;
  }
}

/**
 * Retrieve multiple cached embeddings in batch
 */
export async function batchGetCachedEmbeddings(
  modelVersion: string,
  hashes: string[]
): Promise<Map<string, Float32Array>> {
  const result = new Map<string, Float32Array>();
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    await Promise.all(
      hashes.map(async (hash) => {
        const key = `${modelVersion}_${hash}`;
        const record = await store.get(key);
        if (record && record.vector) {
          result.set(hash, new Float32Array(record.vector));
        }
      })
    );
    await tx.done;
  } catch (err) {
    console.warn('Batch IndexedDB read error:', err);
  }
  return result;
}

/**
 * Save multiple embedding vectors in batch to IndexedDB
 */
export async function batchSetCachedEmbeddings(
  modelVersion: string,
  items: { hash: string; vector: Float32Array; textSnippet: string }[]
): Promise<void> {
  if (items.length === 0) return;
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();

    for (const item of items) {
      const key = `${modelVersion}_${item.hash}`;
      await store.put({
        key,
        modelVersion,
        hash: item.hash,
        textSnippet: item.textSnippet.slice(0, 80),
        vector: Array.from(item.vector),
        dimensions: item.vector.length,
        updatedAt: now,
      });
    }
    await tx.done;
  } catch (err) {
    console.warn('Batch IndexedDB write error:', err);
  }
}

/**
 * Clears all cached embeddings in IndexedDB
 */
export async function clearEmbeddingCache(): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).clear();
    await tx.done;
  } catch (err) {
    console.error('Failed to clear IndexedDB cache:', err);
  }
}

/**
 * Get cache stats (total cached items count and estimated size)
 */
export async function getCacheStats(): Promise<{ count: number; modelVersions: string[] }> {
  try {
    const db = await getDb();
    const count = await db.count(STORE_NAME);
    const allKeys = await db.getAllKeys(STORE_NAME);
    const versions = new Set<string>();
    for (const key of allKeys) {
      const parts = String(key).split('_');
      if (parts.length > 1) {
        versions.add(parts[0]);
      }
    }
    return { count, modelVersions: Array.from(versions) };
  } catch (err) {
    return { count: 0, modelVersions: [] };
  }
}
