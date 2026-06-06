// fn-load — Insertion dans BigQuery.
//   - offre résolue → competitor_offers_master (partition snapshot_date)
//   - SKU non résolu → discovery_failures
//
// Entrée : offre normalisée (extract) OU { resolved: false, ... } (discover)

import { BigQuery } from '@google-cloud/bigquery';

const DATASET = process.env.BQ_DATASET ?? 'printoclock_analytics';
const TABLE_OFFERS = 'competitor_offers_master';
const TABLE_FAILURES = 'discovery_failures';

const bq = new BigQuery();

export async function load(req, res) {
  const payload = req.body ?? {};

  // Aiguillage : échec de découverte vs offre exploitable
  if (payload.resolved === false) {
    await insertRows(TABLE_FAILURES, [
      {
        sku: payload.sku,
        concurrent: payload.concurrent,
        reason: payload.reason,
        snapshot_date: today(),
      },
    ]);
    return res.json({ status: 'logged_failure', sku: payload.sku });
  }

  await insertRows(TABLE_OFFERS, [{ ...payload, snapshot_date: today() }]);
  return res.json({ status: 'loaded', sku: payload.sku });
}

async function insertRows(table, rows) {
  // TODO: gérer insertId pour l'idempotence (éviter doublons en cas de retry Workflow)
  await bq.dataset(DATASET).table(table).insert(rows);
}

function today() {
  // snapshot_date au format YYYY-MM-DD (clé de partition)
  return new Date().toISOString().slice(0, 10);
}
