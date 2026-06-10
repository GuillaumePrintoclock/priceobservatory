-- ============================================================================
-- Quick Win — Requête planifiée quotidienne (BigQuery Scheduled Query)
-- Cible : priceobservatory-498507.analytics.historique_prix_produits
-- Source : pocv2-250612.printoclock_production.*  (cross-projet, lecture seule)
-- ============================================================================
--
-- Idempotente : purge la partition du jour AVANT réinsertion → relançable sans
-- doublons (la version d'origine en INSERT seul en créait à chaque run).
-- Multi-statement : les Scheduled Queries BigQuery supportent DELETE; ... INSERT;
-- ============================================================================

-- 1) Purge idempotente de la partition du jour (pruning sur la clé de partition)
DELETE FROM `priceobservatory-498507.analytics.historique_prix_produits`
WHERE snapshot_date = CURRENT_DATE();

-- 2) Réinsertion du snapshot du jour — logique métier inchangée (promos / options / quantités)
INSERT INTO `priceobservatory-498507.analytics.historique_prix_produits`
  (snapshot_date, id, code, public_price, public_price_discounted)

WITH active_promos AS (
  SELECT
    promo.id AS promotion_id,
    pa.type AS action_type,
    pa.configuration AS action_config,
    pr.type AS rule_type,
    pr.configuration AS rule_config
  FROM `pocv2-250612.printoclock_production.sylius_promotion` promo
  INNER JOIN `pocv2-250612.printoclock_production.sylius_promotion_action` pa ON pa.promotion_id = promo.id
  LEFT JOIN `pocv2-250612.printoclock_production.sylius_promotion_rule` pr ON pr.promotion_id = promo.id
  WHERE promo.enabled = 1
    AND promo.coupon_based = 0
    AND (promo.starts_at IS NULL OR promo.starts_at <= CURRENT_TIMESTAMP())
    AND (promo.ends_at IS NULL OR promo.ends_at >= CURRENT_TIMESTAMP())
),

product_options AS (
  SELECT
    pvov.variant_id,
    ARRAY_AGG(ov.code IGNORE NULLS) AS option_codes
  FROM `pocv2-250612.printoclock_production.sylius_product_variant_option_value` pvov
  JOIN `pocv2-250612.printoclock_production.sylius_product_option_value` ov ON pvov.option_value_id = ov.id
  GROUP BY pvov.variant_id
),

base_products AS (
  SELECT
    pv.id AS variant_id,
    pv.code AS variant_code,
    p.code AS product_code,
    pv.total_cost_price,
    cp.price AS original_price,
    CAST(REGEXP_EXTRACT(pv.code, r'Q([0-9]+)') AS INT64) AS qty,
    (pv.total_cost_price * 100) AS cost_x_100,
    COALESCE(po.option_codes, []) AS option_codes
  FROM `pocv2-250612.printoclock_production.sylius_product_variant` pv
  INNER JOIN `pocv2-250612.printoclock_production.sylius_product` p ON pv.product_id = p.id
  LEFT JOIN `pocv2-250612.printoclock_production.sylius_channel_pricing` cp ON pv.id = cp.product_variant_id
  LEFT JOIN product_options po ON pv.id = po.variant_id
),

evaluated_promos AS (
  SELECT
    bp.variant_id,
    CASE
      WHEN ap.action_type = 'unit_percentage_discount'
        THEN SAFE_DIVIDE(bp.original_price, 100) * (1 - CAST(JSON_EXTRACT_SCALAR(ap.action_config, '$.POC.percentage') AS FLOAT64))
      WHEN ap.action_type = 'unit_fixed_discount'
        THEN SAFE_DIVIDE((bp.original_price - CAST(JSON_EXTRACT_SCALAR(ap.action_config, '$.POC.amount') AS FLOAT64)), 100)
      ELSE SAFE_DIVIDE(bp.original_price, 100)
    END AS discounted_price
  FROM base_products bp
  CROSS JOIN active_promos ap
  WHERE
    (ap.rule_type IS NULL OR (ap.rule_type = 'product_list' AND EXISTS(SELECT 1 FROM UNNEST(JSON_EXTRACT_STRING_ARRAY(ap.rule_config, '$.products')) x WHERE x = bp.product_code)))
    AND EXISTS(SELECT 1 FROM UNNEST(JSON_EXTRACT_STRING_ARRAY(ap.action_config, '$.POC.filters.products_filter.products')) x WHERE x = bp.product_code)
    AND bp.qty BETWEEN
        COALESCE(CAST(NULLIF(JSON_EXTRACT_SCALAR(ap.action_config, '$.POC.filters.quantity_range_filter.min'), 'null') AS INT64), 0)
        AND COALESCE(CAST(NULLIF(JSON_EXTRACT_SCALAR(ap.action_config, '$.POC.filters.quantity_range_filter.max'), 'null') AS INT64), 9999999)
    AND bp.cost_x_100 BETWEEN
        COALESCE(CAST(NULLIF(JSON_EXTRACT_SCALAR(ap.action_config, '$.POC.filters.cost_range_filter.min'), 'null') AS FLOAT64), 0)
        AND COALESCE(CAST(NULLIF(JSON_EXTRACT_SCALAR(ap.action_config, '$.POC.filters.cost_range_filter.max'), 'null') AS FLOAT64), 99999999)
    AND (
        ARRAY_LENGTH(JSON_EXTRACT_STRING_ARRAY(ap.action_config, '$.POC.filters.product_option_values_filter.productOptionValues')) IS NULL
        OR ARRAY_LENGTH(JSON_EXTRACT_STRING_ARRAY(ap.action_config, '$.POC.filters.product_option_values_filter.productOptionValues')) = 0
        OR (
            (SELECT COUNT(1) FROM UNNEST(JSON_EXTRACT_STRING_ARRAY(ap.action_config, '$.POC.filters.product_option_values_filter.productOptionValues')) req WHERE req IN UNNEST(bp.option_codes))
            = ARRAY_LENGTH(JSON_EXTRACT_STRING_ARRAY(ap.action_config, '$.POC.filters.product_option_values_filter.productOptionValues'))
        )
    )
)

SELECT * FROM (
  SELECT
    CURRENT_DATE() AS snapshot_date,
    bp.variant_id AS id,
    bp.variant_code AS code,
    SAFE_DIVIDE(bp.original_price, 100) AS public_price,
    LEAST(
      MIN(SAFE_DIVIDE(bp.original_price, 100)),
      COALESCE(MIN(ep.discounted_price), MIN(SAFE_DIVIDE(bp.original_price, 100)))
    ) AS public_price_discounted
  FROM base_products bp
  LEFT JOIN evaluated_promos ep ON bp.variant_id = ep.variant_id
  GROUP BY 1, 2, 3, 4
)
WHERE (public_price IS NOT NULL OR public_price_discounted IS NOT NULL)
  AND (public_price > 0 OR public_price_discounted > 0);
