// Normalisation des prix concurrents à périmètre comparable.
// Règles portées depuis l'ancien pipeline Python (ex. Pixart affiche hors
// frais de port : +4,50 €/prix, +5 € au-delà de 500 ex) — déclarées par
// concurrent dans config/competitors.yaml (clé `normalisation`).

export function normalizePrice(prixAffiche, quantite, normalisation = {}) {
  let prix = prixAffiche;
  if (normalisation.frais_port) prix += normalisation.frais_port;
  for (const s of normalisation.supplements ?? []) {
    if (quantite >= s.quantite_min) prix += s.montant;
  }
  return Math.round(prix * 100) / 100;
}
