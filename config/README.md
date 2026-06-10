# config/

Configuration versionnée du périmètre de veille. **Source de vérité unique** —
toute modification passe par une Pull Request, auditable.

| Fichier | Rôle | Qui l'édite |
|---|---|---|
| `products.yaml` | Watchlist : specs des produits à suivre (attributs Sylius) + quantités | Sacha (métier) |
| `competitors.yaml` | Liste définie des concurrents + réglages de recherche | Sacha / Tech |

## Principe — search-first, zéro URL maintenue

On ne stocke **aucune URL concurrent** ici. `fn-discover` :
1. construit une requête de recherche depuis la spec (libellé + attributs traduits en clair) ;
2. matche les pages candidates contre la spec (`matching.strict` / `tolerant` / `ignore`) ;
3. met l'URL validée en cache (table BigQuery `resolved_urls`, auto-alimentée, revalidée à chaque run).

Une URL qui casse chez un concurrent est re-résolue automatiquement au run suivant.
Les produits introuvables partent dans `discovery_failures` — visibles, jamais bloquants.

## Ajouter un produit à suivre

1. Identifier la famille (`sylius_product.code`, ex. `FLY`) et les valeurs d'options
   (codes Sylius : `format`, `material`, `print_side`, `finishing`…)
2. Ajouter une entrée dans `products.yaml` avec `id`, `libelle` (phrase naturelle,
   sert à la recherche), `attributs`, `quantites`
3. PR → review → merge = prise en compte au prochain run quotidien
