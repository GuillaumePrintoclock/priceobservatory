// Chargement de la configuration versionnée (YAML) et des secrets.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from 'js-yaml';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(__dirname, '..', '..', 'config');

async function loadYaml(file) {
  return yaml.load(await readFile(join(CONFIG_DIR, file), 'utf8'));
}

// Watchlist produits, defaults fusionnés dans chaque entrée.
export async function loadProducts() {
  const { defaults = {}, products = [] } = await loadYaml('products.yaml');
  return products.map((p) => ({
    quantites: defaults.quantites,
    delais: defaults.delais,
    matching: defaults.matching,
    ...p,
  }));
}

export async function getProduct(productId) {
  const product = (await loadProducts()).find((p) => p.id === productId);
  if (!product) throw new Error(`produit inconnu dans products.yaml : ${productId}`);
  return product;
}

export async function loadCompetitorsConfig() {
  return loadYaml('competitors.yaml');
}

export async function getCompetitor(competitorId) {
  const { competitors } = await loadCompetitorsConfig();
  const competitor = competitors.find((c) => c.id === competitorId && c.actif !== false);
  if (!competitor) throw new Error(`concurrent inconnu ou inactif : ${competitorId}`);
  return competitor;
}

const secretClient = new SecretManagerServiceClient();

// Lit un secret — variable d'environnement d'abord (dev local), Secret Manager sinon.
export async function getSecret(name) {
  if (process.env[name]) return process.env[name];
  const project = process.env.GCP_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${project}/secrets/${name}/versions/latest`,
  });
  return version.payload.data.toString('utf8');
}
