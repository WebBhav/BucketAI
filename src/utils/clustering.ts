import { UniqueRemark, Bucket, ClusteringResult, GranularitySetting } from '../types';
import { cosineSimilarity, normalizeVector } from './embeddings';
import { extractTopKeywords } from './textNormalization';

// Curated distinctive bucket color palette with red & charcoal identity
const BUCKET_COLORS = [
  '#E11D48', // Primary Crimson/Rose
  '#EF4444', // Red
  '#F43F5E', // Bright Rose
  '#E2E8F0', // Platinum
  '#94A3B8', // Slate
  '#64748B', // Cool Charcoal
  '#FB7185', // Coral Red
  '#FDA4AF', // Soft Rose
  '#CBD5E1', // Silver
  '#475569', // Deep Slate
  '#BE123C', // Deep Crimson
  '#881337', // Dark Ruby
  '#A1A1AA', // Zinc
  '#71717A', // Muted Gray
];

interface ClusterNode {
  id: string;
  centroid: Float32Array;
  remarkHashes: string[];
  totalRows: number;
  left?: ClusterNode;
  right?: ClusterNode;
  distance?: number;
}

/**
 * Computes mean vector and normalizes it
 */
function computeCentroid(embeddings: Float32Array[], dimensions: number): Float32Array {
  const centroid = new Float32Array(dimensions);
  if (embeddings.length === 0) return centroid;

  for (const emb of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += emb[i];
    }
  }
  return normalizeVector(centroid);
}

/**
 * Spherical K-Means with K-Means++ initialization
 */
function sphericalKMeans(
  items: { hash: string; embedding: Float32Array; rowCount: number }[],
  k: number,
  maxIterations = 20
): { centroids: Float32Array[]; assignments: number[] } {
  const n = items.length;
  if (n === 0 || k <= 0) return { centroids: [], assignments: [] };
  const actualK = Math.min(k, n);
  const dims = items[0].embedding.length;

  // K-means++ initialization
  const centroids: Float32Array[] = [];
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push(new Float32Array(items[firstIdx].embedding));

  const minDists = new Float32Array(n).fill(Infinity);

  for (let c = 1; c < actualK; c++) {
    let sumDists = 0;
    const lastCentroid = centroids[c - 1];

    for (let i = 0; i < n; i++) {
      // Angular distance: 1 - cosine
      const sim = cosineSimilarity(items[i].embedding, lastCentroid);
      const dist = Math.max(0, 1 - sim);
      if (dist < minDists[i]) {
        minDists[i] = dist;
      }
      sumDists += minDists[i];
    }

    let target = Math.random() * sumDists;
    let selectedIdx = 0;
    for (let i = 0; i < n; i++) {
      target -= minDists[i];
      if (target <= 0) {
        selectedIdx = i;
        break;
      }
    }
    centroids.push(new Float32Array(items[selectedIdx].embedding));
  }

  let assignments = new Int32Array(n);
  let changed = true;
  let iter = 0;

  while (changed && iter < maxIterations) {
    changed = false;
    iter++;

    // Assignment step
    for (let i = 0; i < n; i++) {
      let bestSim = -Infinity;
      let bestCluster = 0;
      const emb = items[i].embedding;

      for (let c = 0; c < actualK; c++) {
        const sim = cosineSimilarity(emb, centroids[c]);
        if (sim > bestSim) {
          bestSim = sim;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Update step
    const clusterSums: Float32Array[] = Array.from({ length: actualK }, () => new Float32Array(dims));
    const clusterCounts = new Int32Array(actualK);

    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      const emb = items[i].embedding;
      const weight = items[i].rowCount; // Weight by row occurrences
      for (let d = 0; d < dims; d++) {
        clusterSums[c][d] += emb[d] * weight;
      }
      clusterCounts[c]++;
    }

    for (let c = 0; c < actualK; c++) {
      if (clusterCounts[c] > 0) {
        normalizeVector(clusterSums[c]);
        centroids[c] = clusterSums[c];
      }
    }
  }

  return { centroids, assignments: Array.from(assignments) };
}

/**
 * Builds an Agglomerative Hierarchy Dendrogram over topic clusters
 */
function buildTopicHierarchy(
  initialClusters: { id: string; centroid: Float32Array; hashes: string[]; totalRows: number }[]
): ClusterNode {
  let activeNodes: ClusterNode[] = initialClusters.map((c) => ({
    id: c.id,
    centroid: c.centroid,
    remarkHashes: c.hashes,
    totalRows: c.totalRows,
  }));

  if (activeNodes.length === 1) return activeNodes[0];

  let nextId = initialClusters.length;
  const dims = initialClusters[0].centroid.length;

  while (activeNodes.length > 1) {
    let maxSim = -Infinity;
    let mergeI = 0;
    let mergeJ = 1;

    for (let i = 0; i < activeNodes.length; i++) {
      for (let j = i + 1; j < activeNodes.length; j++) {
        const sim = cosineSimilarity(activeNodes[i].centroid, activeNodes[j].centroid);
        if (sim > maxSim) {
          maxSim = sim;
          mergeI = i;
          mergeJ = j;
        }
      }
    }

    const nodeA = activeNodes[mergeI];
    const nodeB = activeNodes[mergeJ];

    // Merge centroid weighted by total rows
    const mergedCentroid = new Float32Array(dims);
    for (let d = 0; d < dims; d++) {
      mergedCentroid[d] = nodeA.centroid[d] * nodeA.totalRows + nodeB.centroid[d] * nodeB.totalRows;
    }
    normalizeVector(mergedCentroid);

    const mergedNode: ClusterNode = {
      id: `topic_merged_${nextId++}`,
      centroid: mergedCentroid,
      remarkHashes: [...nodeA.remarkHashes, ...nodeB.remarkHashes],
      totalRows: nodeA.totalRows + nodeB.totalRows,
      left: nodeA,
      right: nodeB,
      distance: 1 - maxSim,
    };

    activeNodes = activeNodes.filter((_, idx) => idx !== mergeI && idx !== mergeJ);
    activeNodes.push(mergedNode);
  }

  return activeNodes[0];
}

/**
 * Cuts the hierarchy to produce target K clusters
 */
function cutHierarchy(root: ClusterNode, targetK: number): ClusterNode[] {
  const clusters: ClusterNode[] = [root];

  while (clusters.length < targetK) {
    // Find node with highest merge distance (most disparate children) to split
    let splitIdx = -1;
    let maxDist = -Infinity;

    for (let i = 0; i < clusters.length; i++) {
      const node = clusters[i];
      if (node.left && node.right) {
        const dist = node.distance ?? 0.5;
        if (dist > maxDist) {
          maxDist = dist;
          splitIdx = i;
        }
      }
    }

    if (splitIdx === -1) break; // No more splittable nodes

    const nodeToSplit = clusters[splitIdx];
    clusters.splice(splitIdx, 1, nodeToSplit.left!, nodeToSplit.right!);
  }

  return clusters;
}

/**
 * Automatic optimal bucket discovery using coherence, separation, and size balance
 */
function recommendOptimalK(
  uniqueCount: number,
  initialTopicCount: number,
  granularity: GranularitySetting
): number {
  const minAllowed = granularity.minBuckets ? Math.max(1, granularity.minBuckets) : 2;
  const maxAllowed = granularity.maxBuckets ? Math.max(minAllowed, granularity.maxBuckets) : 25;

  if (granularity.mode === 'custom' && granularity.targetCount && granularity.targetCount > 0) {
    return Math.max(minAllowed, Math.min(granularity.targetCount, Math.min(maxAllowed, initialTopicCount)));
  }

  if (uniqueCount <= 3) return Math.min(uniqueCount, minAllowed);

  if (granularity.mode === 'broad') {
    const broadTarget = Math.max(minAllowed, Math.min(minAllowed + 2, Math.floor(initialTopicCount * 0.4)));
    return Math.min(broadTarget, maxAllowed);
  }

  if (granularity.mode === 'detailed') {
    const detailedTarget = Math.max(Math.min(maxAllowed, 12), Math.floor(initialTopicCount * 0.85));
    return Math.max(minAllowed, Math.min(detailedTarget, maxAllowed));
  }

  // Balanced default
  // Heuristic: log-based scaling with dataset richness bounded by [minAllowed, maxAllowed]
  const target = Math.round(Math.log2(uniqueCount + 2) * 1.6);
  return Math.max(minAllowed, Math.min(maxAllowed, Math.min(target, initialTopicCount)));
}

/**
 * Main discovery pipeline:
 * Deduplicated remarks -> Initial Topic Clustering -> Hierarchy -> Granularity Cut -> Confidence scoring
 */
export function discoverCategories(
  uniqueRemarks: UniqueRemark[],
  embeddingsMap: Map<string, Float32Array>,
  granularity: GranularitySetting = { mode: 'balanced' },
  existingBuckets?: Bucket[]
): ClusteringResult {
  const startTime = Date.now();

  // Separate blanks and non-blanks
  const blankRemark = uniqueRemarks.find((u) => u.isBlank);
  const eligibleRemarks = uniqueRemarks.filter((u) => !u.isBlank && embeddingsMap.has(u.hash));

  if (eligibleRemarks.length === 0) {
    // Empty or only blanks
    const buckets: Bucket[] = [];
    if (blankRemark) {
      buckets.push({
        id: 'bucket_blank',
        name: 'Blank / No Remark',
        description: 'Records where the remarks column is empty or contains non-informative placeholders.',
        color: '#94A3B8',
        keywords: ['Blank', 'No remark'],
        sampleRemarks: ['[Blank or missing remark text]'],
        uniqueRemarkHashes: [blankRemark.hash],
        totalRows: blankRemark.rowIndices.length,
        reviewedCount: 0,
        isBlankBucket: true,
      });
    }

    return {
      buckets,
      stats: {
        totalRows: blankRemark ? blankRemark.rowIndices.length : 0,
        includedRows: blankRemark ? blankRemark.rowIndices.length : 0,
        excludedRows: 0,
        assignedRows: 0,
        unclassifiedRows: 0,
        needsReviewRows: 0,
        assignedPercentage: 0,
        outlierPercentage: 0,
        clusteringTimeMs: Date.now() - startTime,
      },
      hashToBucketId: new Map(),
      hashToConfidence: new Map(),
    };
  }

  // Prepare items for clustering
  const clusterItems = eligibleRemarks.map((u) => ({
    hash: u.hash,
    embedding: embeddingsMap.get(u.hash)!,
    rowCount: u.rowIndices.length,
    text: u.originalText,
  }));

  // Step 1: Discover initial topics
  // Determine number of initial fine clusters
  const initialK = Math.max(4, Math.min(32, Math.floor(Math.sqrt(clusterItems.length) * 1.5)));
  const { centroids: initialCentroids, assignments: initialAssignments } = sphericalKMeans(
    clusterItems,
    initialK
  );

  // Group items by initial topic
  const initialTopicMap = new Map<number, string[]>();
  for (let i = 0; i < clusterItems.length; i++) {
    const c = initialAssignments[i];
    if (!initialTopicMap.has(c)) initialTopicMap.set(c, []);
    initialTopicMap.get(c)!.push(clusterItems[i].hash);
  }

  const initialTopics: { id: string; centroid: Float32Array; hashes: string[]; totalRows: number }[] = [];
  const remarkByHash = new Map<string, UniqueRemark>();
  uniqueRemarks.forEach((r) => remarkByHash.set(r.hash, r));

  initialTopicMap.forEach((hashes, topicIdx) => {
    let rowsCount = 0;
    hashes.forEach((h) => {
      rowsCount += remarkByHash.get(h)?.rowIndices.length || 1;
    });
    initialTopics.push({
      id: `init_topic_${topicIdx}`,
      centroid: initialCentroids[topicIdx],
      hashes,
      totalRows: rowsCount,
    });
  });

  // Step 2: Build Dendrogram Hierarchy over initial topics
  const hierarchyRoot = buildTopicHierarchy(initialTopics);

  // Step 3: Determine target K based on Granularity
  const targetK = recommendOptimalK(eligibleRemarks.length, initialTopics.length, granularity);

  // Cut hierarchy to get target clusters
  const cutNodes = cutHierarchy(hierarchyRoot, targetK);

  // Preserve any manually created or modified buckets if provided
  const lockedBuckets = (existingBuckets || []).filter((b) => b.isManuallyCreatedOrModified);
  const lockedHashes = new Set<string>();
  lockedBuckets.forEach((b) => b.uniqueRemarkHashes.forEach((h) => lockedHashes.add(h)));

  // Generate discovered buckets
  const buckets: Bucket[] = [];
  const hashToBucketId = new Map<string, string>();
  const hashToConfidence = new Map<string, 'High' | 'Medium' | 'Low' | 'Needs Review'>();

  let outlierCount = 0;
  let needsReviewCount = 0;
  let assignedRows = 0;
  const outlierHashes: string[] = [];

  // Add locked manual buckets first
  lockedBuckets.forEach((b) => {
    buckets.push(b);
    b.uniqueRemarkHashes.forEach((h) => {
      hashToBucketId.set(h, b.id);
      hashToConfidence.set(h, 'High'); // Manually reviewed/assigned
    });
    assignedRows += b.totalRows;
  });

  // Process cut nodes for automatic assignment
  const clusterCentroids: { id: string; centroid: Float32Array }[] = [];

  cutNodes.forEach((node, idx) => {
    // Filter out remarks that belong to locked manual buckets
    const availableHashes = node.remarkHashes.filter((h) => !lockedHashes.has(h));
    if (availableHashes.length === 0) return;

    const bucketId = `bucket_${idx + 1}`;
    clusterCentroids.push({ id: bucketId, centroid: node.centroid });

    // Gather sample remarks and extract keywords
    const sampleRemarks: string[] = [];
    let bucketRowCount = 0;

    for (const h of availableHashes) {
      const u = remarkByHash.get(h);
      if (u) {
        bucketRowCount += u.rowIndices.length;
        if (sampleRemarks.length < 8 && !sampleRemarks.includes(u.originalText)) {
          sampleRemarks.push(u.originalText);
        }
      }
    }

    const keywords = extractTopKeywords(sampleRemarks, 4);
    const fallbackName = keywords.length > 0 ? keywords.slice(0, 3).join(' / ') : `Category ${idx + 1}`;

    buckets.push({
      id: bucketId,
      name: fallbackName,
      description: `Discovered group centered around ${keywords.slice(0, 3).join(', ') || 'related operational comments'}.`,
      color: BUCKET_COLORS[idx % BUCKET_COLORS.length],
      keywords,
      sampleRemarks,
      uniqueRemarkHashes: availableHashes,
      totalRows: bucketRowCount,
      reviewedCount: 0,
      isManuallyCreatedOrModified: false,
    });
  });

  // Calculate refined assignment & confidence for each remark
  eligibleRemarks.forEach((u) => {
    if (lockedHashes.has(u.hash)) return;

    const emb = embeddingsMap.get(u.hash)!;
    let topSim = -1;
    let runnerUpSim = -1;
    let bestBucketId = '';

    for (const c of clusterCentroids) {
      const sim = cosineSimilarity(emb, c.centroid);
      if (sim > topSim) {
        runnerUpSim = topSim;
        topSim = sim;
        bestBucketId = c.id;
      } else if (sim > runnerUpSim) {
        runnerUpSim = sim;
      }
    }

    // Outlier detection threshold: very low similarity to centroid
    if (topSim < 0.28) {
      outlierHashes.push(u.hash);
      outlierCount += u.rowIndices.length;
      hashToConfidence.set(u.hash, 'Needs Review');
      return;
    }

    const margin = topSim - runnerUpSim;
    let confidence: 'High' | 'Medium' | 'Low' | 'Needs Review' = 'Medium';

    if (topSim >= 0.65 && margin >= 0.15) {
      confidence = 'High';
    } else if (topSim >= 0.45 && margin >= 0.08) {
      confidence = 'Medium';
    } else if (margin < 0.05) {
      confidence = 'Needs Review';
      needsReviewCount += u.rowIndices.length;
    } else {
      confidence = 'Low';
    }

    hashToBucketId.set(u.hash, bestBucketId);
    hashToConfidence.set(u.hash, confidence);
    assignedRows += u.rowIndices.length;
  });

  // If there are outliers, create an explicit Unclassified / Outliers bucket
  if (outlierHashes.length > 0) {
    const outlierSamples: string[] = [];
    for (const h of outlierHashes.slice(0, 8)) {
      const u = remarkByHash.get(h);
      if (u) outlierSamples.push(u.originalText);
    }

    buckets.push({
      id: 'bucket_outliers',
      name: 'Unclassified / Ambiguous Remarks',
      description: 'Remarks with low semantic similarity to discovered patterns or mixed multi-topic phrasing requiring human review.',
      color: '#64748B',
      keywords: ['Outlier', 'Unclassified'],
      sampleRemarks: outlierSamples,
      uniqueRemarkHashes: outlierHashes,
      totalRows: outlierCount,
      reviewedCount: 0,
      isOutlierBucket: true,
    });

    outlierHashes.forEach((h) => {
      hashToBucketId.set(h, 'bucket_outliers');
    });
  }

  // Add Blank remarks bucket if any exists
  if (blankRemark) {
    buckets.push({
      id: 'bucket_blank',
      name: 'Blank / No Remark',
      description: 'Records where the remarks column is blank or contains placeholder dashes/NA.',
      color: '#94A3B8',
      keywords: ['Blank'],
      sampleRemarks: ['[Blank or missing remark text]'],
      uniqueRemarkHashes: [blankRemark.hash],
      totalRows: blankRemark.rowIndices.length,
      reviewedCount: 0,
      isBlankBucket: true,
    });
    hashToBucketId.set(blankRemark.hash, 'bucket_blank');
    hashToConfidence.set(blankRemark.hash, 'High');
  }

  // Update bucket row counts and assigned unique hashes accurately
  buckets.forEach((b) => {
    const assigned = uniqueRemarks.filter((u) => hashToBucketId.get(u.hash) === b.id);
    b.uniqueRemarkHashes = assigned.map((u) => u.hash);
    b.totalRows = assigned.reduce((acc, u) => acc + u.rowIndices.length, 0);
  });

  const totalRowsCount = uniqueRemarks.reduce((acc, u) => acc + u.rowIndices.length, 0);

  return {
    buckets: buckets.filter((b) => b.totalRows > 0),
    stats: {
      totalRows: totalRowsCount,
      includedRows: totalRowsCount,
      excludedRows: 0,
      assignedRows,
      unclassifiedRows: outlierCount,
      needsReviewRows: needsReviewCount,
      assignedPercentage: totalRowsCount > 0 ? Math.round((assignedRows / totalRowsCount) * 100) : 0,
      outlierPercentage: totalRowsCount > 0 ? Math.round((outlierCount / totalRowsCount) * 100) : 0,
      clusteringTimeMs: Date.now() - startTime,
    },
    hashToBucketId,
    hashToConfidence,
  };
}

/**
 * Reclusters a single bucket into K sub-clusters (Bucket Split operation)
 */
export function splitBucket(
  bucketToSplit: Bucket,
  allUniqueRemarks: UniqueRemark[],
  embeddingsMap: Map<string, Float32Array>,
  k = 2
): Bucket[] {
  const remarkByHash = new Map<string, UniqueRemark>();
  allUniqueRemarks.forEach((r) => remarkByHash.set(r.hash, r));

  const items = bucketToSplit.uniqueRemarkHashes
    .map((h) => remarkByHash.get(h))
    .filter((u): u is UniqueRemark => Boolean(u && embeddingsMap.has(u.hash)))
    .map((u) => ({
      hash: u.hash,
      embedding: embeddingsMap.get(u.hash)!,
      rowCount: u.rowIndices.length,
      text: u.originalText,
    }));

  if (items.length <= 1) {
    return [bucketToSplit];
  }

  const { assignments } = sphericalKMeans(items, k);
  const subBuckets: Bucket[] = [];

  for (let c = 0; c < k; c++) {
    const subHashes = items.filter((_, idx) => assignments[idx] === c).map((item) => item.hash);
    if (subHashes.length === 0) continue;

    const sampleRemarks: string[] = [];
    let rowsCount = 0;
    subHashes.forEach((h) => {
      const u = remarkByHash.get(h);
      if (u) {
        rowsCount += u.rowIndices.length;
        if (sampleRemarks.length < 6) sampleRemarks.push(u.originalText);
      }
    });

    const keywords = extractTopKeywords(sampleRemarks, 3);
    const name = keywords.length > 0 ? `${bucketToSplit.name}: ${keywords.join(' ')}` : `${bucketToSplit.name} (Part ${c + 1})`;

    subBuckets.push({
      id: `${bucketToSplit.id}_split_${c + 1}_${Date.now()}`,
      name,
      description: `Refined sub-category split from ${bucketToSplit.name}.`,
      color: BUCKET_COLORS[(Math.floor(Math.random() * 10) + c) % BUCKET_COLORS.length],
      keywords,
      sampleRemarks,
      uniqueRemarkHashes: subHashes,
      totalRows: rowsCount,
      reviewedCount: 0,
      isManuallyCreatedOrModified: true,
    });
  }

  return subBuckets;
}

/**
 * Merges two or more buckets into a single combined bucket
 */
export function mergeBuckets(
  bucketsToMerge: Bucket[],
  newCombinedName: string,
  allUniqueRemarks: UniqueRemark[]
): Bucket {
  const remarkByHash = new Map<string, UniqueRemark>();
  allUniqueRemarks.forEach((r) => remarkByHash.set(r.hash, r));

  const allHashes = Array.from(new Set(bucketsToMerge.flatMap((b) => b.uniqueRemarkHashes)));
  const allSamples = Array.from(new Set(bucketsToMerge.flatMap((b) => b.sampleRemarks))).slice(0, 10);
  const totalRows = bucketsToMerge.reduce((sum, b) => sum + b.totalRows, 0);
  const keywords = extractTopKeywords(allSamples, 4);

  return {
    id: `merged_${Date.now()}`,
    name: newCombinedName,
    description: `Consolidated category merging ${bucketsToMerge.map((b) => b.name).join(' & ')}.`,
    color: bucketsToMerge[0].color,
    keywords,
    sampleRemarks: allSamples,
    uniqueRemarkHashes: allHashes,
    totalRows,
    reviewedCount: bucketsToMerge.reduce((sum, b) => sum + b.reviewedCount, 0),
    isManuallyCreatedOrModified: true,
  };
}
