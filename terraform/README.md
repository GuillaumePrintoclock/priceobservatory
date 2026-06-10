# terraform/ — Infrastructure GCP

Toute la configuration du projet `priceobservatory-498507` est gérée ici
(décision CTO : IaC centralisée). État distant : `gs://priceobservatory-498507-tfstate` (versionné).

| Fichier | Contenu |
|---|---|
| `apis.tf` | 15 APIs activées (`disable_on_destroy = false`) |
| `service_accounts.tf` | `po-pipeline` (runtime) + `po-deploy` (CI/CD) + rôles IAM |
| `wif.tf` | Workload Identity Federation GitHub ↔ GCP, restreint au repo |
| `bigquery.tf` | Dataset `analytics`, table `historique_prix_produits` (importés), bucket imports |
| `outputs.tf` | Valeurs des secrets GitHub Actions |

## Usage

```bash
cd terraform
terraform init      # backend GCS — nécessite gcloud auth application-default login
terraform plan
terraform apply
```

## Notes

- La table `historique_prix_produits` a `deletion_protection = true` (36 M+ lignes).
- Les tables du pipeline concurrentiel (`competitor_offers_master`, `discovery_failures`,
  `resolved_urls`) seront ajoutées une fois le modèle de spec produit arbitré.
- La scheduled query du Quick Win tourne encore sous le compte utilisateur ;
  migration vers `po-pipeline` prévue — nécessite que Guillaume accorde à ce SA
  `roles/bigquery.dataViewer` sur `pocv2-250612.printoclock_production`.
- Budget/alertes de coûts : non gérés ici (droits billing requis — côté Guillaume).
