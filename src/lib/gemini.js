// Appels Gemini via Vertex AI (SDK @google/genai), sortie JSON contrainte par schéma.

import { GoogleGenAI } from '@google/genai';

const LOCATION = process.env.VERTEX_LOCATION ?? 'europe-west9';
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

// prompt: string · schema: responseSchema (format OpenAPI Vertex)
// Timeout par tentative + retries : l'endpoint peut pendre sans réponse
// (sans ça, on attend les 5 min du timeout par défaut d'undici).
export async function generateJson(prompt, schema, { timeoutMs = 120000, retries = 2 } = {}) {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GCP_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT,
    location: LOCATION,
  });
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0,
          abortSignal: AbortSignal.timeout(timeoutMs),
        },
      });
      if (!result.text) throw new Error('Gemini : réponse vide');
      return JSON.parse(result.text);
    } catch (e) {
      const transient =
        e.name === 'TimeoutError' || e.name === 'AbortError' ||
        e.message?.includes('fetch failed') || e.message?.includes('réponse vide') ||
        e.status === 429 || e.status === 503;
      if (!transient || attempt >= retries) throw e;
    }
  }
}
