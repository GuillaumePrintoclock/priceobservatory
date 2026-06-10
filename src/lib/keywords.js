// Terme de recherche court pour le /map FireCrawl : `mots_cles` si fourni
// dans la spec, sinon les 2 premiers mots du libellé (« Flyer A5, papier… »
// → « Flyer A5 »). Un terme long dégrade le classement du filtre map.

export function searchTerm(product) {
  if (product.mots_cles) return product.mots_cles;
  return (product.libelle ?? '')
    .replace(/[,;:.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');
}
