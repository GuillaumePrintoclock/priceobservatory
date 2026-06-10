import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchTerm } from '../src/lib/keywords.js';

test('mots_cles prioritaire quand fourni', () => {
  assert.equal(searchTerm({ mots_cles: 'flyer pas cher', libelle: 'Flyer A5, 135g' }), 'flyer pas cher');
});

test('défaut : 2 premiers mots du libellé, ponctuation nettoyée', () => {
  assert.equal(
    searchTerm({ libelle: 'Flyer A5, papier couché brillant 135g, impression recto seul, sans finition' }),
    'Flyer A5'
  );
});

test('libellé manquant → chaîne vide', () => {
  assert.equal(searchTerm({}), '');
});
