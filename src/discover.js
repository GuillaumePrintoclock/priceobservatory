// fn-discover — Résout l'URL de la page produit chez un concurrent à partir
// de la SPÉCIFICATION produit (search-first, zéro URL maintenue à la main).
//
//   1. Cache resolved_urls → revalidation HTTP légère → fast path
//   2. Sinon : recherche FireCrawl restreinte au domaine (mots-clés = libellé spec)
//   3. Gemini choisit le meilleur candidat (snippets vs attributs de la spec)
//   4. Mise en cache de l'URL retenue
//
// La vérification fine (la page correspond-elle vraiment à la spec ?) est
// faite par fn-extract sur le contenu complet — qui invalide le cache en
// cas de mismatch via fn-load.
//
// Entrée  : { product_id, competitor_id }
// Sortie  : { product_id, competitor_id, url, method: 'cache'|'search', confidence, resolved: true }
//        ou { product_id, competitor_id, resolved: false, stage, reason }

import { getProduct, getCompetitor, loadCompetitorsConfig } from './lib/config.js';
import { mapSite, scrape } from './lib/firecrawl.js';
import { searchTerm } from './lib/keywords.js';
import { generateJson } from './lib/gemini.js';
import { extractOptionInventory, deriveActions, deriveConfiguredUrl } from './lib/configure.js';
import { getCachedUrl, saveResolvedUrl } from './lib/bq.js';

export async function discover(req, res) {
  const { product_id: productId, competitor_id: competitorId } = req.body ?? {};
  if (!productId || !competitorId) {
    return res.status(400).json({ error: 'product_id et competitor_id requis' });
  }

  const product = await getProduct(productId);
  const competitor = await getCompetitor(competitorId);
  const base = { product_id: productId, competitor_id: competitorId };

  // 1. Cache (URL + actions de configuration dérivées à la découverte)
  const cached = await getCachedUrl(productId, competitorId);
  if (cached && (await isAlive(cached.url))) {
    return res.json({
      ...base,
      url: cached.url,
      actions: cached.actions,
      method: 'cache',
      confidence: cached.confidence,
      resolved: true,
    });
  }

  // 2. Cartographie du site concurrent filtrée par terme court (cf. lib/keywords)
  const { recherche } = await loadCompetitorsConfig();
  const candidates = await mapSite(competitor.base_url, searchTerm(product), {
    limit: recherche?.resultats_max ?? 8,
  });
  if (candidates.length === 0) {
    return res.json({ ...base, resolved: false, stage: 'search', reason: 'aucun_resultat' });
  }

  // 3. Choix du meilleur candidat par Gemini
  const choice = await pickCandidate(product, competitor, candidates);
  if (!choice?.url) {
    return res.json({ ...base, resolved: false, stage: 'match', reason: choice?.reason ?? 'aucun_candidat_fiable' });
  }

  // 4. Page-configurateur ? Deux stratégies, dans l'ordre :
  //    a. clics sur options (inventaire data-test → Gemini) — cas Pixart
  //    b. configuration encodée dans l'URL (grammaire des liens → Gemini) — cas Helloprint
  //    Aucune des deux → grille statique ou config par défaut, fn-extract tranche (matches_spec).
  const { rawHtml, markdown } = await scrape(choice.url, { formats: ['rawHtml', 'markdown'] });
  let finalUrl = choice.url;
  let actions = null;

  const inventory = extractOptionInventory(rawHtml);
  if (inventory.length > 0) {
    const derived = await deriveActions(product, inventory);
    if (derived?.incomplete) {
      return res.json({ ...base, resolved: false, stage: 'configure', reason: derived.reason });
    }
    actions = derived?.actions ?? null;
  } else {
    const byUrl = await deriveConfiguredUrl(product, markdown, choice.url);
    if (byUrl?.url && (await isAlive(byUrl.url))) finalUrl = byUrl.url;
  }

  // 5. Cache
  await saveResolvedUrl({ productId, competitorId, url: finalUrl, method: 'search', confidence: choice.confidence, actions });
  return res.json({ ...base, url: finalUrl, actions, method: 'search', confidence: choice.confidence, resolved: true });
}

// Revalidation légère : la page répond et n'est pas retombée sur l'accueil.
async function isAlive(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
    return res.ok && new URL(res.url).pathname.length > 1;
  } catch {
    return false;
  }
}

const CHOICE_SCHEMA = {
  type: 'object',
  properties: {
    url: { type: 'string', nullable: true },
    confidence: { type: 'number' },
    reason: { type: 'string' },
  },
  required: ['confidence', 'reason'],
};

async function pickCandidate(product, competitor, candidates) {
  const prompt = `Tu aides à trouver la page produit d'un site d'imprimerie en ligne.

Produit recherché chez ${competitor.nom} :
- Libellé : ${product.libelle}
- Attributs : ${JSON.stringify(product.attributs)}

Résultats de recherche (candidats) :
${candidates.map((c, i) => `${i + 1}. ${c.url}\n   ${c.title}\n   ${c.description}`).join('\n')}

Choisis l'URL de la page PRODUIT correspondant le mieux à la spécification
(pas une page catégorie, blog ou accueil). Le format (${product.attributs?.format ?? 'n/a'})
doit pouvoir correspondre exactement ; matière et finition peuvent être des
équivalents proches. confidence est un score entre 0 et 1. Si aucun candidat
n'est une page produit plausible, renvoie url=null avec la raison.`;
  return generateJson(prompt, CHOICE_SCHEMA);
}
