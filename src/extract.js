// fn-extract — Markdown → grille tarifaire structurée via Gemini.
//
// Le prix n'est PAS un scalaire : les imprimeurs affichent une grille
// quantité × délai de livraison (critère métier clé sur le Print). On extrait
// la grille complète, on convertit les dates en jours ouvrés (convention de
// l'ancien pipeline : busday_count) et on normalise les prix (frais de port).
// On vérifie aussi que la page correspond bien à la spec — sinon fn-load
// invalidera le cache d'URL.
//
// Entrée : { product_id, competitor_id, url, markdown }
// Sortie : { ..., matches_spec, offers: [{quantite, delai_jours_ouvres, prix, prix_affiche, ...}] }

import { z } from 'zod';
import { getProduct, getCompetitor } from './lib/config.js';
import { generateJson } from './lib/gemini.js';
import { toBusinessDelay } from './lib/dates.js';
import { normalizePrice } from './lib/normalize.js';

const ExtractionSchema = z.object({
  matches_spec: z.boolean(),
  mismatch_reason: z.string().nullish(),
  devise: z.string().default('EUR'),
  prix_ttc: z.boolean().nullish(), // false = HT affiché (à trancher : base de comparaison)
  offers: z.array(
    z.object({
      quantite: z.number().int().positive(),
      prix_affiche: z.number().positive(),
      prix_barre: z.number().positive().nullish(),
      delai_date: z.string().nullish(), // ISO si le site affiche une date de livraison
      delai_jours_annonce: z.number().int().nullish(), // sinon "sous N jours"
    })
  ),
});

const VERTEX_SCHEMA = {
  type: 'object',
  properties: {
    matches_spec: { type: 'boolean' },
    mismatch_reason: { type: 'string', nullable: true },
    devise: { type: 'string' },
    prix_ttc: { type: 'boolean', nullable: true },
    offers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          quantite: { type: 'integer' },
          prix_affiche: { type: 'number' },
          prix_barre: { type: 'number', nullable: true },
          delai_date: { type: 'string', nullable: true },
          delai_jours_annonce: { type: 'integer', nullable: true },
        },
        required: ['quantite', 'prix_affiche'],
      },
    },
  },
  required: ['matches_spec', 'offers'],
};

export async function extract(req, res) {
  const { product_id: productId, competitor_id: competitorId, url, markdown } = req.body ?? {};
  if (!productId || !competitorId || !markdown) {
    return res.status(400).json({ error: 'product_id, competitor_id et markdown requis' });
  }

  const product = await getProduct(productId);
  const competitor = await getCompetitor(competitorId);

  const raw = await generateJson(buildPrompt(product, sanitizeMarkdown(markdown)), VERTEX_SCHEMA);
  const data = ExtractionSchema.parse(raw); // garde-fou data quality avant BigQuery

  const today = new Date();
  const offers = data.offers.map((o) => ({
    quantite: o.quantite,
    prix_affiche: o.prix_affiche,
    prix: normalizePrice(o.prix_affiche, o.quantite, competitor.normalisation),
    prix_barre: o.prix_barre ?? null,
    devise: data.devise,
    prix_ttc: data.prix_ttc ?? null,
    delai_date: o.delai_date ?? null,
    delai_jours_ouvres: toBusinessDelay(o, today),
  }));

  return res.json({
    product_id: productId,
    competitor_id: competitorId,
    url,
    matches_spec: data.matches_spec,
    mismatch_reason: data.mismatch_reason ?? null,
    offers,
  });
}

// Allège le markdown avant envoi à Gemini : les images et URLs interminables
// sont du bruit pur pour l'extraction (et font pendre le modèle sur les
// grosses pages). Les liens à URL courte sont conservés — leur slug peut
// porter du sens (ex. Helloprint encode le délai dans l'URL).
export function sanitizeMarkdown(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\(https?:\/\/[^)]{80,}\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

function buildPrompt(product, markdown) {
  return `Tu analyses la page produit d'un site d'imprimerie en ligne (contenu Markdown ci-dessous).

Produit attendu :
- Libellé : ${product.libelle}
- Attributs : ${JSON.stringify(product.attributs)}

Tâches :
1. matches_spec : la page correspond-elle à ce produit ? Le format doit
   correspondre exactement ; matière et finition peuvent être des équivalents
   proches (ex. 135g ≈ 130g). Sinon, explique dans mismatch_reason.
2. offers : extrais la grille tarifaire COMPLÈTE quantité × délai de livraison.
   - une entrée par couple (quantité, délai) affiché
   - prix_affiche : le prix affiché (prix promo si remisé) ; prix_barre : le prix barré le cas échéant
   - delai_date : la date de livraison au format YYYY-MM-DD si le site affiche
     une date (nous sommes le ${new Date().toISOString().slice(0, 10)}) ;
     sinon delai_jours_annonce : le nombre de jours annoncé
   - prix_ttc : true si les prix sont TTC, false si HT, null si non précisé
N'invente aucune valeur : n'extrais que ce qui figure dans la page.

Page :
${markdown.slice(0, 60000)}`;
}
