import { test } from 'node:test';
import assert from 'node:assert/strict';
import { busdaysBetween, toBusinessDelay } from '../src/lib/dates.js';

// Convention np.busday_count : [from, to), lun→ven.
test('lundi → mardi = 1 jour ouvré', () => {
  assert.equal(busdaysBetween(new Date('2026-06-08'), new Date('2026-06-09')), 1);
});

test('vendredi → lundi = 1 jour ouvré (week-end ignoré)', () => {
  assert.equal(busdaysBetween(new Date('2026-06-12'), new Date('2026-06-15')), 1);
});

test('même jour = 0', () => {
  assert.equal(busdaysBetween(new Date('2026-06-10'), new Date('2026-06-10')), 0);
});

test('semaine complète lundi → lundi = 5', () => {
  assert.equal(busdaysBetween(new Date('2026-06-08'), new Date('2026-06-15')), 5);
});

test('toBusinessDelay préfère la date affichée', () => {
  // mercredi 10/06 → mardi 16/06 : jeu+ven+lun = 4 ouvrés (10,11,12,15)
  const d = toBusinessDelay({ delai_date: '2026-06-16', delai_jours_annonce: 99 }, new Date('2026-06-10'));
  assert.equal(d, 4);
});

test('toBusinessDelay retombe sur le délai annoncé', () => {
  assert.equal(toBusinessDelay({ delai_date: null, delai_jours_annonce: 3 }), 3);
});

test('toBusinessDelay sans aucune info → null', () => {
  assert.equal(toBusinessDelay({}), null);
});
