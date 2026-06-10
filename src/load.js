// fn-load — Aiguillage final vers BigQuery.
//   - offres extraites (matches_spec=true)  → competitor_offers_master (1 ligne par quantité × délai)
//   - page ne correspondant pas à la spec   → discovery_failures + invalidation du cache d'URL
//   - échec de découverte (resolved=false)  → discovery_failures

import { insertRows, saveResolvedUrl } from './lib/bq.js';

export async function load(req, res) {
  const p = req.body ?? {};
  const today = new Date().toISOString().slice(0, 10);
  const base = { product_id: p.product_id, competitor: p.competitor_id };

  // Échec de découverte
  if (p.resolved === false) {
    await insertRows('discovery_failures', [
      { ...base, failure_date: today, stage: p.stage ?? 'discover', reason: p.reason ?? 'inconnu' },
    ]);
    return res.json({ status: 'logged_failure', ...base });
  }

  // Page trouvée mais mauvais produit → log + invalidation cache (re-résolution au prochain run)
  if (p.matches_spec === false) {
    await Promise.all([
      insertRows('discovery_failures', [
        { ...base, failure_date: today, stage: 'extract_mismatch', reason: p.mismatch_reason ?? 'spec_non_conforme', url: p.url },
      ]),
      saveResolvedUrl({
        productId: p.product_id,
        competitorId: p.competitor_id,
        url: p.url,
        method: 'invalidation',
        confidence: 0,
        valid: false,
      }),
    ]);
    return res.json({ status: 'mismatch_logged_and_invalidated', ...base });
  }

  // Offres valides
  if (!Array.isArray(p.offers) || p.offers.length === 0) {
    return res.status(400).json({ error: 'payload sans offers', ...base });
  }
  await insertRows(
    'competitor_offers_master',
    p.offers.map((o) => ({
      snapshot_date: today,
      ...base,
      url: p.url,
      quantite: o.quantite,
      delai_jours_ouvres: o.delai_jours_ouvres,
      delai_date: o.delai_date,
      prix: o.prix,
      prix_affiche: o.prix_affiche,
      prix_barre: o.prix_barre,
      devise: o.devise,
      prix_ttc: o.prix_ttc,
    }))
  );
  return res.json({ status: 'loaded', count: p.offers.length, ...base });
}
