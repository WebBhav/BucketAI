import { GoogleGenAI, Type } from '@google/genai';

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
  headers: Record<string, string>;
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503,
        body: JSON.stringify({
          error: 'GEMINI_API_KEY environment variable is not configured in Netlify settings.',
        }),
      };
    }

    const { buckets, context } = JSON.parse(event.body || '{}');
    if (!Array.isArray(buckets) || buckets.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Buckets array is required' }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are an expert enterprise business analyst. We have grouped unlabelled operational remarks/comments from an Excel dataset into semantic clusters.
For each cluster provided below, generate a professional, concise, and business-accurate bucket name (2-5 words), a clear 1-2 sentence description explaining the core theme of the cluster, and select 2-3 of the most representative remarks from the provided samples.

Dataset Context: ${context || 'General business operational remarks/records'}

Clusters to label:
${JSON.stringify(
  buckets.map((b: any) => ({
    id: b.id,
    heuristic_keywords: b.keywords,
    sample_remarks: b.sampleRemarks?.slice(0, 8),
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
              id: { type: Type.STRING },
              bucket_name: { type: Type.STRING },
              bucket_description: { type: Type.STRING },
              representative_examples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['id', 'bucket_name', 'bucket_description', 'representative_examples'],
          },
        },
      },
    });

    const labels = JSON.parse(response.text || '[]');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labels }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
