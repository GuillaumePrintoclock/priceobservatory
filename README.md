# Price Observatory

Pipeline unifié de veille tarifaire concurrentielle pour Printoclock.
Un seul pipeline pour toutes les gammes (Print, Objets Pub) et tous les concurrents :
la distinction mapping direct vs recherche par mots-clés est absorbée par une cascade
dans `fn-discover`. À partir d'une URL valide, le traitement est uniforme :
**FireCrawl → Gemini → BigQuery**.

## Architecture

```
Cloud Scheduler (cron quotidien)
        │
        ▼
Cloud Workflows ──► fn-discover ──► fn-fetch ──► fn-extract ──► fn-load ──► BigQuery
                    (cascade URL)   (FireCrawl)   (Gemini)       (insert)    competitor_offers_master
                         │                                                   discovery_failures (SKU non résolus)
                         └─ SKU non résolu ────────────────────────────────►
```

| Brique | Choix |
|---|---|
| Langage | Node.js 20 (Functions Framework) |
| Déclencheur | Cloud Scheduler (cron unique) |
| Orchestration | Google Cloud Workflows |
| Compute | Cloud Functions Gen 2 |
| Scraping | FireCrawl API → Markdown |
| Parsing | Gemini via Vertex AI → JSON strict (validé Zod) |
| Stockage | BigQuery (partition `snapshot_date`) |
| Config | YAML versionné (ce repo) |
| Secrets | Secret Manager |

## Structure

```
src/            Code des Cloud Functions
  index.js      Enregistre les 4 entry-points HTTP
  discover.js   Cascade de résolution d'URL
  fetch.js      FireCrawl → Markdown
  extract.js    Gemini → JSON (schéma Zod)
  load.js       Insert BigQuery
  lib/config.js Chargement config YAML + secrets
config/         Périmètre versionné (gammes × concurrents)
workflows/      Définition Cloud Workflows (YAML)
sql/            Quick Win — historisation prix POC
.github/        CI/CD (placeholder, décision IaC reportée)
```

## Développement local

```bash
nvm use 20
npm install

# Lancer une function en local (Functions Framework)
npm run start:discover    # puis POST sur http://localhost:8080

npm run lint
npm run format
```

> Auth GCP requise pour les appels réels (BigQuery, Vertex AI, Secret Manager) :
> `gcloud auth application-default login`

## Cadence & relevés manuels (runbook)

Les deux jobs tournent **tous les lundis** :

| Job | Heure | Mécanisme |
|---|---|---|
| Historisation prix internes | lundi 05:00 UTC (07:00 Paris) | Scheduled Query BigQuery |
| Relevé concurrentiel (171 couples) | lundi 07:30 Paris | Cloud Scheduler → Workflow |

**Relevé concurrentiel manuel** — à tout moment, sans attendre le lundi :

```bash
scripts/releve.sh                           # tout le périmètre
scripts/releve.sh fly-a5-135cb-rv           # 1 produit × 3 concurrents
scripts/releve.sh fly-a5-135cb-rv pixart    # 1 couple précis
```

**Historisation interne manuelle** :

```bash
bq mk --transfer_run --run_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  projects/535402837590/locations/europe-west9/transferConfigs/6a2891d0-0000-2313-bd08-9898fbb40dd5
```
(idempotente : relançable le même jour sans doublons)

## Quick Win — historisation des prix

Indépendant du pipeline principal, via une **Scheduled Query BigQuery**.
Voir [`sql/`](sql/) (inclut le garde-fou d'idempotence).

## État

🚧 Squelette initial — stubs de functions à implémenter (marqués `TODO`).
Périmètre, accès et points d'arbitrage : voir le brief CTO du projet.
