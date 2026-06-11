// Client FireCrawl v2 (REST direct — payloads éprouvés par le workflow N8N).

import { getSecret } from './config.js';

const BASE = 'https://api.firecrawl.dev/v2';

// Timeout explicite + 1 retry : l'API peut pendre sur les scrapes lents
// (sans ça, on attend les 5 min du timeout par défaut d'undici).
async function call(path, body, { timeoutMs = 180000, retries = 1 } = {}) {
  const apiKey = await getSecret('FIRECRAWL_API_KEY');
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw new Error(`FireCrawl ${path} → HTTP ${res.status} : ${(await res.text()).slice(0, 300)}`);
      }
      return await res.json();
    } catch (e) {
      const transient = e.name === 'TimeoutError' || e.name === 'AbortError' || e.message?.includes('fetch failed');
      if (!transient || attempt >= retries) throw e;
    }
  }
}

// Découverte de pages SUR le site du concurrent : /map liste les URLs du
// domaine (sitemap + crawl) filtrées par pertinence. Bien plus précis qu'une
// recherche web (l'opérateur site: n'est pas supporté par /search — vérifié).
// ⚠️ le filtre `search` fonctionne avec un terme COURT (« flyer A5 ») ;
// une phrase longue dégrade le classement.
export async function mapSite(baseUrl, searchTerm, { limit = 8 } = {}) {
  const data = await call('/map', { url: baseUrl, search: searchTerm, limit });
  return (data.links ?? []).map((l) => ({
    url: l.url ?? l,
    title: l.title ?? '',
    description: l.description ?? '',
  }));
}

// Scrape → Markdown. maxAge 48 h (cache FireCrawl), waitFor pour les grilles
// de prix chargées en JS (réglages repris du N8N).
// `actions` : clics de configuration (pages-configurateurs) — désactive le
// cache FireCrawl, le rendu dépendant des interactions.
// `formats` : ['markdown'] par défaut ; ['rawHtml'] pour inventorier les options.
export async function scrape(url, { actions, formats = ['markdown'] } = {}) {
  const body = {
    url,
    formats,
    onlyMainContent: !formats.includes('rawHtml'),
    location: { country: 'FR', languages: ['fr'] },
  };
  if (actions?.length) {
    body.actions = actions;
  } else {
    body.waitFor = 10000;
    body.maxAge = 172800000;
  }
  const data = await call('/scrape', body);
  return {
    markdown: data.data?.markdown ?? '',
    rawHtml: data.data?.rawHtml ?? '',
    metadata: data.data?.metadata ?? {},
  };
}
