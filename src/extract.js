// fn-extract — Markdown → JSON strict via Gemini (Vertex AI).
// Résilient aux changements de design du site concurrent (cf. brief CTO §1).
//
// Entrée : { sku, concurrent, url, markdown }
// Sortie : offre normalisée validée par schéma Zod

import { z } from 'zod';

// Schéma de l'offre extraite — garde-fou data quality avant insertion BigQuery.
export const OfferSchema = z.object({
  prix_ttc: z.number().positive(),
  devise: z.string().default('EUR'),
  quantite: z.number().int().positive().optional(),
  disponible: z.boolean(),
  titre_produit: z.string().min(1),
  url: z.string().url(),
});

export async function extract(req, res) {
  const { sku, concurrent, url, markdown } = req.body ?? {};
  if (!markdown) return res.status(400).json({ error: 'markdown requis' });

  // TODO: appel Gemini via @google-cloud/vertexai avec responseSchema = OfferSchema (JSON mode)
  //   import { VertexAI } from '@google-cloud/vertexai';
  //   const vertex = new VertexAI({ project, location });
  //   const model = vertex.getGenerativeModel({ model: 'gemini-2.0-flash' });
  //   const raw = await model.generateContent(prompt(markdown));
  throw new Error('fn-extract: appel Gemini à implémenter');

  // const parsed = OfferSchema.parse(JSON.parse(raw)); // rejette les extractions douteuses
  // return res.json({ sku, concurrent, ...parsed });
}
