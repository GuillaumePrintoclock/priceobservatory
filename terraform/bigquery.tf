# Ressources BigQuery + GCS du projet : existant importé (Quick Win) +
# tables du pipeline concurrentiel.

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

# ── Pipeline concurrentiel ───────────────────────────────────────────

# Offres concurrentes : 1 ligne par produit × concurrent × quantité × délai.
# Le délai de livraison (jours ouvrés) est une dimension de comparaison à part
# entière — critère métier clé sur le Print.
resource "google_bigquery_table" "competitor_offers_master" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "competitor_offers_master"
  description         = "Grilles tarifaires concurrentes : produit × concurrent × quantité × délai ouvré"
  deletion_protection = true

  time_partitioning {
    type  = "DAY"
    field = "snapshot_date"
  }

  clustering = ["product_id", "competitor"]

  schema = jsonencode([
    { name = "snapshot_date", type = "DATE", mode = "REQUIRED", description = "Date du run — clé de partition" },
    { name = "product_id", type = "STRING", mode = "REQUIRED", description = "Id de la spec (config/products.yaml)" },
    { name = "competitor", type = "STRING", mode = "REQUIRED", description = "Id concurrent (config/competitors.yaml)" },
    { name = "url", type = "STRING", mode = "NULLABLE", description = "Page produit scrapée" },
    { name = "quantite", type = "INTEGER", mode = "NULLABLE", description = "Quantité de la grille" },
    { name = "delai_jours_ouvres", type = "INTEGER", mode = "NULLABLE", description = "Délai de livraison en jours ouvrés (convention busday_count)" },
    { name = "delai_date", type = "DATE", mode = "NULLABLE", description = "Date de livraison affichée, le cas échéant" },
    { name = "prix", type = "FLOAT", mode = "NULLABLE", description = "Prix normalisé (frais de port inclus selon règles concurrent)" },
    { name = "prix_affiche", type = "FLOAT", mode = "NULLABLE", description = "Prix tel qu'affiché sur le site" },
    { name = "prix_barre", type = "FLOAT", mode = "NULLABLE", description = "Prix barré (avant promo), le cas échéant" },
    { name = "devise", type = "STRING", mode = "NULLABLE" },
    { name = "prix_ttc", type = "BOOLEAN", mode = "NULLABLE", description = "true=TTC, false=HT, null=non précisé sur la page" },
  ])
}

# Cache d'URLs résolues — journal append-only, la dernière ligne d'un couple
# produit × concurrent fait foi (valid=false = invalidation).
resource "google_bigquery_table" "resolved_urls" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "resolved_urls"
  description         = "Cache auto-alimenté des URLs produit résolues par fn-discover"
  deletion_protection = false # cache reconstructible par re-résolution

  clustering = ["product_id", "competitor"]

  schema = jsonencode([
    { name = "product_id", type = "STRING", mode = "REQUIRED" },
    { name = "competitor", type = "STRING", mode = "REQUIRED" },
    { name = "url", type = "STRING", mode = "NULLABLE" },
    { name = "method", type = "STRING", mode = "NULLABLE", description = "search | invalidation" },
    { name = "confidence", type = "FLOAT", mode = "NULLABLE" },
    { name = "valid", type = "BOOLEAN", mode = "NULLABLE" },
    { name = "resolved_at", type = "TIMESTAMP", mode = "REQUIRED" },
  ])
}

# Produits non résolus / pages non conformes — visibles, jamais bloquants.
resource "google_bigquery_table" "discovery_failures" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "discovery_failures"
  description         = "Échecs de découverte ou de matching, par run"
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "failure_date"
  }

  schema = jsonencode([
    { name = "failure_date", type = "DATE", mode = "REQUIRED", description = "Date du run — clé de partition" },
    { name = "product_id", type = "STRING", mode = "REQUIRED" },
    { name = "competitor", type = "STRING", mode = "REQUIRED" },
    { name = "stage", type = "STRING", mode = "NULLABLE", description = "search | match | extract_mismatch" },
    { name = "reason", type = "STRING", mode = "NULLABLE" },
    { name = "url", type = "STRING", mode = "NULLABLE" },
  ])
}
