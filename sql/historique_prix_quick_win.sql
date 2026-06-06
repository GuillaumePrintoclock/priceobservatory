-- Quick Win — Historisation quotidienne des prix internes (POC).
-- Cible : pocv2-250612.printoclock_analytics.historique_prix_produits
--
-- Orchestration recommandée pour démarrer : Scheduled Query BigQuery (cron natif,
-- zéro infra). Migration vers Cloud Workflow en phase 2 (cf. brief CTO §4).
--
-- ⚠️ GARDE-FOU IDEMPOTENCE : la version manuelle initiale utilisait
--    INSERT INTO ... CURRENT_DATE(). Relancée 2× le même jour → doublons.
--    On purge la partition du jour AVANT de réinsérer (pattern DELETE + INSERT).
--
-- ⚠️ Table cible OBLIGATOIREMENT partitionnée par snapshot_date
--    (~1,8 M lignes/jour → ~660 M lignes/an).

-- 1. Purge idempotente de la partition du jour
DELETE FROM `pocv2-250612.printoclock_analytics.historique_prix_produits`
WHERE snapshot_date = CURRENT_DATE();

-- 2. Réinsertion du snapshot du jour
INSERT INTO `pocv2-250612.printoclock_analytics.historique_prix_produits`
  (snapshot_date, code, /* … colonnes Sylius … */ prix_ttc)
SELECT
  CURRENT_DATE() AS snapshot_date,
  -- TODO: remplacer par la requête Sylius validée (sylius_product_variant,
  --       sylius_channel_pricing, sylius_promotion*) fournie par le métier.
  v.code,
  cp.price / 100 AS prix_ttc
FROM `pocv2-250612.printoclock_production.sylius_product_variant` AS v
JOIN `pocv2-250612.printoclock_production.sylius_channel_pricing` AS cp
  ON cp.product_variant_id = v.id;
