// Appels Gemini via Vertex AI (SDK @google/genai), sortie JSON contrainte par schéma.

import { GoogleGenAI } from '@google/genai';

const LOCATION = process.env.VERTEX_LOCATION ?? 'europe-west9';
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

// prompt: string · schema: responseSchema (format OpenAPI Vertex)
export async function generateJson(prompt, schema) {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GCP_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT,
    location: LOCATION,
  });
  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0,
    },
  });
  if (!result.text) throw new Error('Gemini : réponse vide');
  return JSON.parse(result.text);
}
