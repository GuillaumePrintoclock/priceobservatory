// Configuration des pages-configurateurs (ex. Pixart) : la grille de prix
// affichée dépend des options sélectionnées. On dérive les clics nécessaires
// pour amener la page sur la spec, à partir des sélecteurs de test stables
// (attributs data-test="select-…") présents dans le HTML.
//
// Dérivées UNE fois à la découverte, les actions sont mises en cache avec
// l'URL (resolved_urls.actions) et rejouées par fn-fetch à chaque run.

import { generateJson } from './gemini.js';

// Inventaire des options cliquables. Pattern Pixart (data-test) pour l'instant ;
// d'autres sites pourront ajouter leurs patterns ici. Vide = page non
// configurable (grille statique), aucun clic nécessaire.
export function extractOptionInventory(rawHtml) {
  const matches = rawHtml.matchAll(/data-test="(select-[^"]+)"/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

const ACTIONS_SCHEMA = {
  type: 'object',
  properties: {
    selectors: {
      type: 'array',
      items: { type: 'string' },
      description: 'Valeurs data-test à cliquer, dans l’ordre',
    },
    incomplete: { type: 'boolean' },
    reason: { type: 'string', nullable: true },
  },
  required: ['selectors', 'incomplete'],
};

// Gemini fait correspondre les attributs de la spec aux options du site
// (il gère les équivalences : 135CB interne ↔ « 130 gsm » + « Classic Gloss »).
export async function deriveActions(product, inventory) {
  if (inventory.length === 0) return null;

  const prompt = `Un configurateur de produit d'imprimerie expose ces options cliquables
(valeurs d'attribut data-test) :
${inventory.map((s) => `- ${s}`).join('\n')}

Produit à configurer :
- Libellé : ${product.libelle}
- Attributs : ${JSON.stringify(product.attributs)}

Donne dans "selectors" la liste ORDONNÉE des valeurs data-test à cliquer pour
sélectionner ce produit (une par groupe d'options pertinent). Choisis
l'équivalent le plus proche quand la valeur exacte n'existe pas (ex. 135 g
→ "130 gsm" ; couché brillant → "Classic Gloss" ; sans finition →
"Lamination None" ; recto seul → "Front side only printing").
Ne renvoie que des valeurs présentes dans la liste, à l'identique.
Si un attribut essentiel (format, grammage) n'a aucun équivalent, mets
incomplete=true et explique dans reason.`;

  const out = await generateJson(prompt, ACTIONS_SCHEMA);
  if (out.incomplete) return { incomplete: true, reason: out.reason ?? 'option essentielle absente' };

  // Garde-fou : ne jamais cliquer un sélecteur halluciné
  const valid = out.selectors.filter((s) => inventory.includes(s));

  const actions = [{ type: 'wait', milliseconds: 8000 }];
  for (const s of valid) {
    actions.push({ type: 'click', selector: `[data-test="${s}"]` });
    actions.push({ type: 'wait', milliseconds: 2500 });
  }
  actions.push({ type: 'wait', milliseconds: 4000 });
  return { incomplete: false, actions };
}
