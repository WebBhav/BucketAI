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

// API: Label Buckets with Gemini
app.post('/api/gemini/label-buckets', async (req: Request, res: Response) => {
  try {
    const { buckets, context } = req.body;
    if (!Array.isArray(buckets) || buckets.length === 0) {
      return res.status(400).json({ error: 'Buckets array is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Falling back to local labeling.',
      });
    }

    const prompt = `You are an expert enterprise business analyst. We have grouped unlabelled operational remarks/comments from an Excel dataset into semantic clusters.
For each cluster provided below, generate a professional, concise, and business-accurate bucket name (2-5 words), a clear 1-2 sentence description explaining the core theme of the cluster, and select 2-3 of the most representative remarks from the provided samples.

Dataset Context: ${context || 'General business operational remarks/records'}

Clusters to label:
${JSON.stringify(
  buckets.map((b: any) => ({
    id: b.id,
    heuristic_keywords: b.keywords,
    sample_remarks: b.sampleRemarks.slice(0, 8),
    total_items: b.totalItems,
  })),
  null,
  2
)}

Return strict structured JSON for every single cluster matching the given id.`;

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
              id: { type: Type.STRING, description: 'The exact cluster id passed in' },
              bucket_name: { type: Type.STRING, description: 'Concise business-accurate name (2-5 words)' },
              bucket_description: { type: Type.STRING, description: '1-2 sentence explanation of the theme' },
              representative_examples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 most representative remarks from the sample list',
              },
            },
            required: ['id', 'bucket_name', 'bucket_description', 'representative_examples'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text);
    return res.json({ labels: parsed });
  } catch (error: any) {
    console.error('Error labeling buckets with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate bucket labels with Gemini',
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
