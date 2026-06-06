// fn-fetch — Récupère le contenu de la page produit via FireCrawl → Markdown propre.
// Anti-bot géré par FireCrawl, zéro sélecteur CSS (cf. brief CTO §1).
//
// Entrée : { url, sku, concurrent }
// Sortie : { sku, concurrent, url, markdown }

import { getSecret } from './lib/config.js';

export async function fetch(req, res) {
  const { url, sku, concurrent } = req.body ?? {};
  if (!url) return res.status(400).json({ error: 'url requise' });

  const _apiKey = await getSecret('FIRECRAWL_API_KEY');

  // TODO: appel FireCrawl scrape (format markdown), gérer timeouts + retries légers
  //   import FirecrawlApp from '@mendable/firecrawl-js';
  //   const app = new FirecrawlApp({ apiKey: _apiKey });
  //   const result = await app.scrapeUrl(url, { formats: ['markdown'] });
  throw new Error('fn-fetch: appel FireCrawl à implémenter');

  // return res.json({ sku, concurrent, url, markdown: result.markdown });
}
