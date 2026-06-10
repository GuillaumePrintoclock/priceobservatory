import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrice } from '../src/lib/normalize.js';

const PIXART = { frais_port: 4.5, supplements: [{ quantite_min: 500, montant: 5 }] };

test('Pixart : +4,50 € de port sous 500 ex', () => {
  assert.equal(normalizePrice(20, 100, PIXART), 24.5);
});

test('Pixart : +4,50 € + 5 € à partir de 500 ex', () => {
  assert.equal(normalizePrice(20, 500, PIXART), 29.5);
});

test('sans règles : prix inchangé', () => {
  assert.equal(normalizePrice(20, 1000), 20);
  assert.equal(normalizePrice(20, 1000, undefined), 20);
});

test('arrondi à 2 décimales', () => {
  assert.equal(normalizePrice(19.999, 100, { frais_port: 0.001 }), 20);
});
