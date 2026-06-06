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

## Quick Win — historisation des prix

Indépendant du pipeline principal, démarrable immédiatement via une **Scheduled Query
BigQuery**. Voir [`sql/historique_prix_quick_win.sql`](sql/historique_prix_quick_win.sql)
(inclut le garde-fou d'idempotence).

## État

🚧 Squelette initial — stubs de functions à implémenter (marqués `TODO`).
Périmètre, accès et points d'arbitrage : voir le brief CTO du projet.
