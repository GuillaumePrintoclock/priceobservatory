// fn-discover — Résolution de l'URL à scraper pour un SKU donné.
//
// Cascade (cf. brief CTO §2) :
//   1. SKU a-t-il un mapping URL direct dans la config ? (cas Print historique)
//   2. URL valide ? (HTTP 200 + page produit reconnue) → résolu
//   3. URL cassée → fallback recherche par mots-clés (logique Objets Pub)
//   4. Pas de mapping initial → recherche par mots-clés directe
//   5. Recherche infructueuse → log dans discovery_failures, skip le SKU
//
// Entrée  : { sku, concurrent }
// Sortie  : { sku, concurrent, url, method: 'mapping'|'search', resolved: true }
//        ou { sku, concurrent, resolved: false, reason }

import { loadConcurrentConfig } from './lib/config.js';

export async function discover(req, res) {
  const { sku, concurrent } = req.body ?? {};
  if (!sku || !concurrent) {
    return res.status(400).json({ error: 'sku et concurrent requis' });
  }

  const config = await loadConcurrentConfig(concurrent);

  // 1. Mapping direct ?
  const mapped = config.mappings?.[sku];

  // 2. Tester l'URL mappée
  if (mapped) {
    const valid = await isValidProductUrl(mapped);
    if (valid) {
      return res.json({ sku, concurrent, url: mapped, method: 'mapping', resolved: true });
    }
    // 3. URL cassée → on tombe en fallback recherche (ci-dessous)
  }

  // 4. Recherche par mots-clés (fallback, ou cas Objets Pub natif)
  const found = await searchByKeywords(sku, concurrent, config);
  if (found) {
    return res.json({ sku, concurrent, url: found, method: 'search', resolved: true });
  }

  // 5. Échec → fn-load se chargera d'écrire dans discovery_failures
  return res.json({
    sku,
    concurrent,
    resolved: false,
    reason: mapped ? 'url_cassee_et_recherche_infructueuse' : 'aucun_resultat_recherche',
  });
}

// TODO: HTTP HEAD/GET + heuristique "vraie page produit" (pas de redirection catégorie / 404 maquillée)
async function isValidProductUrl(_url) {
  throw new Error('isValidProductUrl: à implémenter');
}

// TODO: FireCrawl search / SERP sur les mots-clés du SKU, retourne la meilleure URL produit
async function searchByKeywords(_sku, _concurrent, _config) {
  throw new Error('searchByKeywords: à implémenter');
}
