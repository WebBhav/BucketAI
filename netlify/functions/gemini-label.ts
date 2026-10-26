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

    const parsed = JSON.parse(response.text || '{}');
    const returnedBuckets = Array.isArray(parsed) ? parsed : (parsed.buckets || []);

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buckets: validatedBuckets }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
