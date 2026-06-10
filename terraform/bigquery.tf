# Ressources BigQuery + GCS existantes (créées au Quick Win), importées dans
# l'état Terraform pour devenir gérées ici.
#
# Les tables du pipeline concurrentiel (competitor_offers_master,
# discovery_failures, resolved_urls) seront ajoutées ici une fois le modèle
# de spec produit arbitré avec Sacha.

resource "google_bigquery_dataset" "analytics" {
  dataset_id  = "analytics"
  location    = var.region
  description = "Price Observatory — historisation prix + veille concurrentielle"
}

resource "google_bigquery_table" "historique_prix_produits" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "historique_prix_produits"
  description         = "Historisation quotidienne des prix internes POC (source Sylius). ~1,8 M lignes/jour, ~660 M lignes/an."
  deletion_protection = true # 36 M+ lignes d'historique — pas de destroy accidentel

  time_partitioning {
    type  = "DAY"
    field = "snapshot_date"
  }

  clustering = ["code"]

  schema = jsonencode([
    {
      name        = "snapshot_date"
      type        = "DATE"
      mode        = "REQUIRED"
      description = "Date du snapshot quotidien — clé de partition"
    },
    {
      name        = "id"
      type        = "INTEGER"
      mode        = "NULLABLE"
      description = "sylius_product_variant.id"
    },
    {
      name        = "code"
      type        = "STRING"
      mode        = "NULLABLE"
      description = "Code variante produit (ex. DEP_..._Q500_J4)"
    },
    {
      name        = "public_price"
      type        = "FLOAT"
      mode        = "NULLABLE"
      description = "Prix public TTC en euros"
    },
    {
      name        = "public_price_discounted"
      type        = "FLOAT"
      mode        = "NULLABLE"
      description = "Meilleur prix après promo active, en euros"
    },
  ])
}

resource "google_storage_bucket" "imports" {
  name                        = "${var.project_id}-imports"
  location                    = var.region
  uniform_bucket_level_access = true
}
