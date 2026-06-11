#!/usr/bin/env bash
# Relevé concurrentiel MANUEL — sans attendre le passage du lundi.
#
# Usage :
#   scripts/releve.sh                           # tout le périmètre (products × competitors actifs)
#   scripts/releve.sh fly-a5-135cb-rv           # 1 produit × tous les concurrents
#   scripts/releve.sh fly-a5-135cb-rv pixart    # 1 couple précis
#
# Prérequis : gcloud auth login (compte avec droits sur priceobservatory-498507).
set -euo pipefail
cd "$(dirname "$0")/.."

PRODUCT="${1:-}"
COMPETITOR="${2:-}"

PAIRS=$(node --input-type=module -e "
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
const products = yaml.load(readFileSync('config/products.yaml','utf8')).products;
const competitors = yaml.load(readFileSync('config/competitors.yaml','utf8')).competitors
  .filter(c => c.actif !== false).map(c => c.id);
const wantedP = '$PRODUCT', wantedC = '$COMPETITOR';
const pairs = [];
for (const p of products) {
  if (wantedP && p.id !== wantedP) continue;
  for (const c of competitors) {
    if (wantedC && c !== wantedC) continue;
    pairs.push({ product_id: p.id, competitor_id: c });
  }
}
if (pairs.length === 0) { console.error('aucun couple ne correspond — vérifie les ids'); process.exit(1); }
console.log(JSON.stringify({ pairs }));
")

N=$(echo "$PAIRS" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).pairs.length))")
echo "→ $N couple(s) à traiter"

EXEC=$(gcloud workflows execute price-observatory \
  --location=europe-west9 --project=priceobservatory-498507 \
  --data="$PAIRS" --format='value(name)')
EXEC_ID="${EXEC##*/}"
echo "→ exécution lancée : $EXEC_ID"
echo "→ suivi : gcloud workflows executions describe $EXEC_ID --workflow price-observatory --location europe-west9 --format='value(state)'"

while true; do
  sleep 30
  STATE=$(gcloud workflows executions describe "$EXEC_ID" --workflow price-observatory --location europe-west9 --format='value(state)' 2>/dev/null)
  echo "  $(date +%H:%M:%S) : $STATE"
  [ "$STATE" != "ACTIVE" ] && break
done

echo
echo "Résultat en base :"
bq query --use_legacy_sql=false --location=europe-west9 --format=pretty "
SELECT competitor, COUNT(*) AS offres
FROM \`priceobservatory-498507.analytics.competitor_offers_master\`
WHERE snapshot_date = CURRENT_DATE() GROUP BY 1 ORDER BY 1"
