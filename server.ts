import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API: Label Buckets with Gemini (Gemini 3.1 Flash-Lite)
app.post('/api/gemini/label-buckets', async (req: Request, res: Response) => {
  try {
    const { buckets, context } = req.body;
    if (!Array.isArray(buckets) || buckets.length === 0) {
      return res.status(400).json({ error: 'Buckets array is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Preserving existing bucket names.',
      });
    }

    const systemInstruction = `You are an enterprise data-taxonomy specialist. Your task is to create concise, meaningful, non-overlapping names and descriptions for categories discovered from actual remark data.

You are naming existing buckets, not performing a new classification.

For each bucket, you will receive its current identifier, representative remarks, and record count.

Follow these rules:

1. Identify the common business meaning shared by the representative remarks.
2. Give each bucket a concise name of approximately 2–6 words.
3. Write a one-sentence description explaining what belongs in the bucket.
4. Use consistent naming style across all buckets.
5. Prefer specific, business-relevant language over generic labels such as "Other Issues" or "Miscellaneous".
6. Do not invent causes, business context, or conclusions that are not supported by the examples.
7. Do not rename buckets based on one unusual example when the remaining examples indicate a different dominant theme.
8. Keep genuinely different buckets distinct. Avoid duplicate or synonymous names.
9. Preserve the original bucket identifier and record count. Do not create, delete, merge, split, or reassign buckets.
10. If the examples are insufficient or contradictory, use a cautious descriptive name and flag the bucket for review.
11. Preserve special buckets such as "Blank / No Remarks" and "Other / Unclear" where applicable; do not replace them with misleading business categories.

Return valid JSON only, using this schema:

{
  "buckets": [
    {
      "bucket_id": "existing_id",
      "name": "Concise business category",
      "description": "One-sentence explanation grounded in the examples.",
      "review_required": false
    }
  ]
}

Return exactly one output entry for each supplied bucket ID. Do not include Markdown fences or additional prose.`;

    const userPrompt = `Dataset Context: ${context || 'Operational remarks'}

Buckets to name:
${JSON.stringify(
  buckets.map((b: any) => ({
    bucket_id: b.id,
    record_count: b.totalItems || b.totalRows || 0,
    representative_remarks: (b.sampleRemarks || []).slice(0, 8),
  })),
  null,
  2
)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            buckets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bucket_id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  review_required: { type: Type.BOOLEAN },
                },
                required: ['bucket_id', 'name', 'description', 'review_required'],
              },
            },
          },
          required: ['buckets'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response received from Gemini naming model.');
    }

    const parsed = JSON.parse(text);
    const returnedBuckets = Array.isArray(parsed) ? parsed : (parsed.buckets || []);

    // Strict validation against input bucket IDs
    const inputIds = new Set(buckets.map((b: any) => b.id));
    const validatedBuckets: any[] = [];
    const accountedIds = new Set<string>();

    for (const item of returnedBuckets) {
      if (item && item.bucket_id && inputIds.has(item.bucket_id)) {
        accountedIds.add(item.bucket_id);
        validatedBuckets.push({
          bucket_id: item.bucket_id,
          name: String(item.name || '').trim() || item.bucket_id,
          description: String(item.description || '').trim(),
          review_required: Boolean(item.review_required),
        });
      }
    }

    // Preserve any bucket whose response was omitted
    for (const id of inputIds) {
      if (!accountedIds.has(id)) {
        const orig = buckets.find((b: any) => b.id === id);
        validatedBuckets.push({
          bucket_id: id,
          name: orig?.name || id,
          description: orig?.description || '',
          review_required: true,
        });
      }
    }

    return res.json({ buckets: validatedBuckets });
  } catch (error: any) {
    console.error('Error labeling buckets with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate bucket labels with Gemini 3.1 Flash-Lite.',
    });
  }
});

// API: Suggest bucket merges
app.post('/api/gemini/suggest-merges', async (req: Request, res: Response) => {
  try {
    const { buckets } = req.body;
    if (!Array.isArray(buckets) || buckets.length < 2) {
      return res.status(400).json({ error: 'At least two buckets required to suggest merges' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const prompt = `Analyze these discovered remark categories and identify any pairs or groups of categories that have significant semantic overlap and should potentially be merged:

Categories:
${JSON.stringify(
  buckets.map((b: any) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    sampleRemarks: (b.sampleRemarks || []).slice(0, 4),
  })),
  null,
  2
)}

Return recommendations as JSON with targetBucketIds, suggestedCombinedName, and rationalExplanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bucketIdsToMerge: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'IDs of the 2 or more buckets that overlap',
              },
              suggestedCombinedName: { type: Type.STRING },
              rationalExplanation: { type: Type.STRING },
            },
            required: ['bucketIdsToMerge', 'suggestedCombinedName', 'rationalExplanation'],
          },
        },
      },
    });

    const text = response.text;
    const parsed = JSON.parse(text || '[]');
    return res.json({ suggestions: parsed });
  } catch (error: any) {
    console.error('Error suggesting merges:', error);
    return res.status(500).json({ error: error?.message || 'Failed to suggest merges' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`RemarkIQ server running on http://0.0.0.0:${port}`);
  });
}

startServer();
