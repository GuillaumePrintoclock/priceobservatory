// Conversion des dates de livraison concurrent en délais ouvrés (J+n).
// Reprend la convention de l'ancien pipeline Python (np.busday_count) :
// jours ouvrés lundi→vendredi, comptés de `from` (inclus) à `to` (exclu),
// jours fériés non déduits.

export function busdaysBetween(from, to) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  let count = 0;
  while (d < end) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

// Délai ouvré d'une offre : date de livraison ISO si le site l'affiche,
// sinon le nombre de jours annoncé tel quel.
export function toBusinessDelay({ delai_date, delai_jours_annonce }, today = new Date()) {
  if (delai_date) {
    const target = new Date(`${delai_date}T00:00:00Z`);
    if (!Number.isNaN(target.getTime())) return busdaysBetween(today, target);
  }
  return delai_jours_annonce ?? null;
}
