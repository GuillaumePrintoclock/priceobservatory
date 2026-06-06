// Chargement de la configuration versionnée (YAML) et des secrets.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from 'js-yaml';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(__dirname, '..', '..', 'config');

// Charge config/concurrents/<concurrent>.yaml (mappings SKU→URL + mots-clés fallback).
export async function loadConcurrentConfig(concurrent) {
  const path = join(CONFIG_DIR, 'concurrents', `${concurrent}.yaml`);
  const raw = await readFile(path, 'utf8');
  return yaml.load(raw);
}

const secretClient = new SecretManagerServiceClient();

// Lit la dernière version d'un secret depuis Secret Manager.
export async function getSecret(name) {
  const project = process.env.GCP_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${project}/secrets/${name}/versions/latest`,
  });
  return version.payload.data.toString('utf8');
}
