# sql/ — Quick Win : historisation des prix internes POC

Historisation quotidienne des prix Sylius dans BigQuery, indépendante du pipeline
de veille concurrentielle. Démarrable immédiatement.

| Fichier | Rôle |
|---|---|
| `01_create_table.sql` | DDL de la table partitionnée `historique_prix_produits` |
| `02_scheduled_query.sql` | Requête planifiée quotidienne, idempotente (DELETE partition du jour + INSERT) |

## Cible

`priceobservatory-498507.analytics.historique_prix_produits`
— partition `snapshot_date` (jour), cluster `code`.
Source : `pocv2-250612.printoclock_production.*` (cross-projet, lecture seule).

## Ordre de mise en place

1. **Région** — la source `printoclock_production` est en `europe-west9` ; le dataset doit y être aussi
   (cross-region interdit par BigQuery) :
   ```bash
   bq --location=europe-west9 mk --dataset priceobservatory-498507:analytics
   ```
2. **Table** — exécuter `01_create_table.sql`.
3. **Accès cross-projet** — le compte qui exécute la requête planifiée doit avoir
   `bigquery.dataViewer` sur `pocv2-250612.printoclock_production` (à accorder par Guillaume),
   `bigquery.dataEditor` sur `analytics` et `bigquery.jobUser` sur le projet (déclarés en Terraform).
4. **Scheduled Query** — créer une requête planifiée quotidienne avec `02_scheduled_query.sql`
   (DML multi-statement, pas de table de destination à renseigner).
5. **Backfill historique** — charger les CSV manuels (GDrive) via GCS → `bq load` (voir guide).
