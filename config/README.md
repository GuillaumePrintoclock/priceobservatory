# config/

Configuration versionnée du périmètre de veille. **Source de vérité unique** —
ajouter ou modifier un concurrent / une gamme se fait par une Pull Request, ce qui
garde tout auditable (cf. brief CTO §1).

| Fichier | Rôle |
|---|---|
| `gammes.yaml` | Gammes suivies, concurrents actifs, périmètre MVP |
| `concurrents/<nom>.yaml` | Par concurrent : `base_url`, mapping SKU→URL direct, paramètres de recherche fallback |

## Ajouter un concurrent

1. Créer `concurrents/<nom>.yaml` sur le modèle de `pixart.yaml`
2. L'ajouter à la liste `concurrents:` dans `gammes.yaml`
3. Ouvrir une PR → review Tech → merge déclenche le déploiement
