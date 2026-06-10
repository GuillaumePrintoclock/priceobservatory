-- ============================================================================
-- Quick Win — Table d'historisation des prix internes POC
-- Projet : priceobservatory-498507  ·  Dataset : analytics
-- ============================================================================
--
-- ⚠️ PRÉ-REQUIS — créer le dataset DANS LA MÊME RÉGION que la source Sylius,
--    sinon les requêtes cross-projet échouent (BigQuery interdit le cross-region).
--    Région de la source pocv2-250612.printoclock_production : europe-west9 (confirmée).
--         bq --location=europe-west9 mk --dataset priceobservatory-498507:analytics
--
-- Ensuite, exécuter cette DDL (la région est héritée du dataset).
-- ============================================================================

CREATE TABLE IF NOT EXISTS `priceobservatory-498507.analytics.historique_prix_produits`
(
  snapshot_date            DATE    NOT NULL OPTIONS(description = "Date du snapshot quotidien — clé de partition"),
  id                       INT64            OPTIONS(description = "sylius_product_variant.id"),
  code                     STRING           OPTIONS(description = "Code variante produit (ex. DEP_..._Q500_J4)"),
  public_price             FLOAT64          OPTIONS(description = "Prix public TTC en euros"),
  public_price_discounted  FLOAT64          OPTIONS(description = "Meilleur prix après promo active, en euros")
)
PARTITION BY snapshot_date
CLUSTER BY code
OPTIONS (
  description = "Historisation quotidienne des prix internes POC (source Sylius). ~1,8 M lignes/jour, ~660 M lignes/an.",
  -- Garde-fou coût : passer à TRUE pour forcer un filtre snapshot_date sur toute requête
  -- (recommandé une fois l'historique chargé, si Metabase/Sheets filtrent toujours par date).
  require_partition_filter = FALSE
);

-- Partitionnement par snapshot_date (jour) : ~10 000 partitions max ≈ 27 ans, large.
-- Clustering par code : lookups "évolution d'un produit dans le temps" peu coûteux.
