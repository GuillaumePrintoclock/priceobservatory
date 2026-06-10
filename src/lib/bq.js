// Accès BigQuery : cache d'URLs résolues + insertions.
// resolved_urls est un journal append-only : la dernière ligne d'un couple
// produit × concurrent fait foi (valid=false = invalidation).

import { BigQuery } from '@google-cloud/bigquery';

const DATASET = process.env.BQ_DATASET ?? 'analytics';
const bq = new BigQuery();

export async function getCachedUrl(productId, competitorId) {
  const [rows] = await bq.query({
    query: `
      SELECT url, valid, confidence
      FROM \`${DATASET}.resolved_urls\`
      WHERE product_id = @productId AND competitor = @competitorId
      ORDER BY resolved_at DESC
      LIMIT 1`,
    params: { productId, competitorId },
  });
  const last = rows[0];
  return last?.valid ? last : null;
}

export async function saveResolvedUrl({ productId, competitorId, url, method, confidence, valid = true }) {
  await insertRows('resolved_urls', [
    {
      product_id: productId,
      competitor: competitorId,
      url,
      method,
      confidence,
      valid,
      resolved_at: new Date().toISOString(),
    },
  ]);
}

export async function insertRows(table, rows) {
  await bq.dataset(DATASET).table(table).insert(rows);
}
