// fn-fetch — Récupère la page produit via FireCrawl → Markdown propre.
// Anti-bot et rendu JS gérés par FireCrawl. Si fn-discover a dérivé des
// actions de configuration (pages-configurateurs), elles sont rejouées ici
// pour amener la grille de prix sur la bonne combinaison d'options.
//
// Entrée : { product_id, competitor_id, url, actions? }
// Sortie : { product_id, competitor_id, url, markdown }

import { scrape } from './lib/firecrawl.js';

export async function fetchPage(req, res) {
  const { product_id, competitor_id, url, actions } = req.body ?? {};
  if (!url) return res.status(400).json({ error: 'url requise' });

  const { markdown } = await scrape(url, { actions });
  if (!markdown) {
    return res.status(502).json({ error: 'scrape vide', product_id, competitor_id, url });
  }
  return res.json({ product_id, competitor_id, url, markdown });
}
