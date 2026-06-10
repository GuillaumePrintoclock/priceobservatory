#!/usr/bin/env bash
# Crée la requête planifiée quotidienne (historisation prix POC).
# Interactif : bq va afficher une URL OAuth → ouvre-la, autorise, colle le version_info.
set -euo pipefail
cd "$(dirname "$0")"

PARAMS_FILE="$(mktemp)"
python3 - "$PARAMS_FILE" <<'PY'
import json, sys
sql = open('02_scheduled_query.sql').read()
open(sys.argv[1], 'w').write(json.dumps({'query': sql}))
PY

bq mk --transfer_config \
  --project_id=priceobservatory-498507 \
  --location=europe-west9 \
  --target_dataset=analytics \
  --display_name="Historisation prix POC (quotidien)" \
  --data_source=scheduled_query \
  --schedule="every day 05:00" \
  --params="$(cat "$PARAMS_FILE")"

rm -f "$PARAMS_FILE"
echo
echo "✓ Vérification :"
bq ls --transfer_config --transfer_location=europe-west9 --project_id=priceobservatory-498507
