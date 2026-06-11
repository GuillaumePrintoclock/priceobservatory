# Inventaire des périmètres scrapés par les systèmes legacy

Relevé du 2026-06-11, à partir du code Python (`printo-scrap-main`), du mapping
`printo-gamme-mapping.csv` et de la table de sortie N8N
(`pocv2-250612.priceobservatory.offers`). Sert de base pour construire la
watchlist `config/products.yaml` avec Sacha.

---

## 1. Print — pipeline Python/Selenium

- **Concurrents (3)** : Pixartprinting, Helloprint, Exaprint
- **359 SKU suivis**, 8 gammes, 359 déclinaisons produit
- **Délai = dimension native** : grille relevée par date de livraison, convertie
  en J+n ouvrés puis réalignée sur nos délais internes via la matrice CSV
  (SKU × concurrent × J1→J9)

### Délais comparés par concurrent

| Concurrent | Délais internes couverts (nb de SKU mappés) |
|---|---|
| helloprint | J1 (251) · J2 (122) · J3 (198) · J4 (25) · J5 (224) · J6 (48) · J7 (52) · J8 (6) · J9 (11) |
| pixart | J1 (319) · J2 (261) · J3 (58) · J4 (261) · J5 (46) · J8 (6) |
| exaprint | J1 (212) · J2 (253) · J3 (178) · J4 (135) · J5 (152) · J6 (167) · J7 (27) · J8 (48) · J9 (8) |

### Détail par gamme

Une « déclinaison » = un produit complet hors quantité (papier, impression,
finition, format). Lecture des codes : grammage+papier (135CB = 135g couché
brillant, 350DM = 350g demi-mat…), impression (R = recto, RV = recto-verso),
finition (NOF = sans, PMR = pelliculage mat recto…).

### BRO — Brochures (piqûre + dos carré collé) · 114 SKU, 5 déclinaisons

Quantités : 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000

```
BRO_135CM_C300CBPB_NOPL_NOSTAPL_NOCAL_DCC_BRA4-A3_CLA
BRO_135CM_C300CBPB_NOPL_NOSTAPL_NOCAL_DCC_BRA5-A4_CLA
BRO_135CM_NOCOVER_NOPL_STAPLNUM-32x45_NOCAL_2PM_SBRA4-A3_CLA
BRO_135CM_NOCOVER_NOPL_STAPLNUM-32x45_NOCAL_2PM_SBRA5-A4_CLA
BRO_135CM_NOCOVER_NOPL_STAPLNUM-32x45_NOCAL_2PM_SBRA6-A5_CLA
```

### FLY — Flyers · 72 SKU, 9 déclinaisons

Quantités : 100, 250, 500, 1000, 2500, 5000, 10000, 20000

```
FLY_135CB_RV_NOF_A4_CLA
FLY_135CB_RV_NOF_A5_CLA
FLY_135CB_RV_NOF_A6_CLA
FLY_250DM_RV_NOF_A4_CLA
FLY_250DM_RV_NOF_A5_CLA
FLY_250DM_RV_NOF_A6_CLA
FLY_350DM_RV_NOF_A4_CLA
FLY_350DM_RV_NOF_A5_CLA
FLY_350DM_RV_NOF_A6_CLA
```

### DEP — Dépliants · 48 SKU, 6 déclinaisons

Quantités : 100, 250, 500, 1000, 2500, 5000, 10000, 20000

```
DEP_135CB_RV_NOF_1PS_CRN_200x200-100x200_CLA
DEP_135CB_RV_NOF_1PS_CRN_A3-A4_CLA
DEP_135CB_RV_NOF_1PS_CRN_A4-A5_CLA
DEP_135CB_RV_NOF_2PR_CRN_297x210-99x210_CLA
DEP_135CB_RV_NOF_2PR_CRN_450x200-150x200_CLA
DEP_250DM_RV_NOF_1PS_CRY_A4-A5_CLA
```

### CVI — Cartes de visite · 48 SKU, 6 déclinaisons

Quantités : 50, 100, 250, 500, 1000, 2500, 5000, 10000

```
CVI_350DM_RV_NOF_NOSUV_DRT_CRN_85x54_CLA
CVI_350DM_RV_PMRV_NOSUV_DRT_CRN_85x54_CLA
CVI_350DM_RV_PMR_NOSUV_DRT_CRN_85x54_CLA
CVI_350DM_RV_PSTRV_NOSUV_DRT_CRN_85x54_CLA
CVI_350DM_R_NOF_NOSUV_DRT_CRN_85x54_CLA
CVI_350DM_R_PMR_NOSUV_DRT_CRN_85x54_CLA
```

### AFF — Affiches · 41 SKU, 6 déclinaisons

Quantités : 10, 25, 50, 100, 250, 500, 1000, 5000, 10000

```
AFF_135CB_R_NDS_NOF_300x400_CLA
AFF_135CB_R_NDS_NOF_400x600_CLA
AFF_135CB_R_NDS_NOF_700x1000_CLA
AFF_135CB_R_NDS_NOF_800x1200_CLA
AFF_135CB_R_NDS_NOF_A1_CLA
AFF_250DM_R_NDS_NOF_300x400_CLA
```

### BFP — Drapeaux plume (beach flags) · 12 SKU, 4 déclinaisons

Quantités : 1, 2, 10

```
BFP_PLA_RV_BFP2-4_MATSAC_BFP550x1900_CLA
BFP_PLA_RV_BFP3-08_MATSAC_BFP780x2470_CLA
BFP_PLA_R_BFP2-4_MATSAC_BFP550x1900_CLA
BFP_PLA_R_BFP3-08_MATSAC_BFP780x2470_CLA
```

### RUC — Roll-ups classiques · 12 SKU, 4 déclinaisons

Quantités : 1, 2, 10

```
RUC_M1BAN_RUC100_R1000x2000_CLA
RUC_M1BAN_RUC85_R850x2000_CLA
RUC_STDBAN_RUC100_R1000x2000_CLA
RUC_STDBAN_RUC85_R850x2000_CLA
```

### RUE — Roll-ups éco · 12 SKU, 4 déclinaisons

Quantités : 1, 2, 10

```
RUE_M1BAN_RUE100_R1000x2000_CLA
RUE_M1BAN_RUE85_R850x2000_CLA
RUE_STDBAN_RUE100_R1000x2000_CLA
RUE_STDBAN_RUE85_R850x2000_CLA
```

---

## 2. Objets Pub — workflow N8N « Price Observatory »

⚠️ **Flux à l'arrêt depuis le 2026-03-19** (dernier relevé en base).

- **Source** : Google Sheet `Liste_ObjetsPubPMax_ACompleterAvecConcurrents`
  (doc `10KRXgrM0OGT3F2auViY-oB9l142PajmK5mEDGgP6qJg`) — URLs concurrentes
  **saisies à la main** par produit (3-4 par produit). Sheet non accessible à
  ce jour avec nos comptes (accès à demander) ; l'inventaire ci-dessous vient
  de la table de SORTIE BigQuery.
- **78 produits suivis** (référence POC `PFC_*` + libellé)
- **88 domaines concurrents** au total — dont un produit-test
  (Tote bag Madras, PFC_120181) balayé sur 87 domaines ; les autres produits
  ont chacun leur petit panel
- **Données par relevé : 1 prix HT unitaire** — ni quantité, ni délai de
  livraison (contrairement au Print)
- **Qualité : 510 relevés en erreur sur 976 (52 %)** — « prix introuvable » etc.

### Noyau de concurrents récurrents (hors produit-test)

| Domaine | Produits couverts |
|---|---|
| wordans.fr | 33 |
| igo-objetspub.fr | 22 |
| cadoetik.com | 19 |
| giffits.fr | 17 |
| easyflyer.fr | 13 |
| pens.com | 12 |
| lamaisonduteeshirt.com | 11 |
| mesobjetspublicitaires.com | 11 |
| exaprint.fr | 10 |
| g2mcom.com | 10 |
| objetpubdesign.com | 8 |
| kadimage.fr | 8 |

### Liste complète des 88 domaines

```
wordans.fr
igo-objetspub.fr
cadoetik.com
giffits.fr
easyflyer.fr
pens.com
lamaisonduteeshirt.com
exaprint.fr
mesobjetspublicitaires.com
g2mcom.com
objetpubdesign.com
kadimage.fr
smart-goodies.com
vegea.com
madamecadeau.fr
promotionice.com
pixartprinting.fr
crafters.fr
stampasi.fr
objets-personnalisables.com
objetrama.fr
4dimension.fr
france-goodies.com
kely.fr
newcom-fr.com
versionecologique.com
4youcommunication.fr
printecom.fr
shop.jordenen.com
goodiespub.fr
sacpub.com
repli-k.fr
airspire.fr
helloprint.com
cadeauxadler.com
hellopro.fr
katanga.fr
comptoirdelobjet.fr
bcm-goodies.com
stylo-france.fr
goodies-promo.fr
notoria.com
pandacola.com
siddep.fr
smartobjet.fr
objetfrancais.pub
lignesdirectes.fr
catalogue.groupe-fullace.fr
fulfiller.com
olacreation.fr
myobjetpublicitaire.com
bergam.fr
pai-impression.com
capkdo-normandie.fr
genicado.com
teefactory.fr
promedif-produits.com
karibanbrands.com
concept-impression.com
winpub.fr
kustomlab.fr
tee-shirts-online.com
pubavenue.com
veditex.com
cadactuel.com
lecadeaudurable.fr
fullcom.fr
needen.fr
airspire-boutique.fr
toptex.fr
objets-publicitaires-pro.com
helice.fr
dfccom.com
multigift.com
geant-beaux-arts.fr
stylos-publicitaires-pro.com
flamsandiego.com
ballard-conseil.com
personaliz.com
j-media.fr
omnishirt.fr
bureau-vallee.fr
giftcampaign.fr
egdiffusion.com
textile-direct.fr
sip19.fr
maxilia.fr
stylo-parker.fr
```

### Liste complète des 78 produits

| Réf POC | Libellé | Concurrents |
|---|---|---|
| PFC_100165 | Plaid polaire Huggy personnalisable 150 x 120 cm | 4 |
| PFC_100288 | Bouteille sport Sky 650ml personnalisée | 9 |
| PFC_100289 | Bouteille sport Spring 600ml personnalisée | 4 |
| PFC_100345 | Rétro lunettes de soleil Sun Ray | 4 |
| PFC_100494 | Bouteille isotherme Vasa 500 ml | 4 |
| PFC_100508 | Bouteille de sport Sky 650ml | 4 |
| PFC_100522 | Tasse Pix 330 ml style pop pour marquage par sublimation | 4 |
| PFC_100588 | Bouteille isotherme 590ml Koln | 3 |
| PFC_100656 | Bouteille de sport Bodhi 500 ml en verre | 4 |
| PFC_100670 | Gobelet Lagan de 330 ml en acier inoxydable avec isolation par le vide et couche de cuivre avec couvercle en bambou personnalisable | 4 |
| PFC_100671 | Isotherme bouteille Cove 500 ml | 6 |
| PFC_100736 | Bouteille isotherme Vasa en acier inoxydable recyclé 500 ml | 4 |
| PFC_100790 | Bouteille isotherme sous vide Cove 500 ml | 4 |
| PFC_102104 | Porte-clés à boucle extensible Gerlos | 4 |
| PFC_104097 | Cutter Hoost | 4 |
| PFC_106371 | Stylo bille corps blanc grip coloré Nash encre noire | 4 |
| PFC_106399 | Stylo à bille Nash personnalisable | 4 |
| PFC_106476 | Stylo bille Jotter Parker | 4 |
| PFC_106905 | Carnet de notes A6 Spectrum | 4 |
| PFC_107105 | Stylo bille rétractable en aluminium Moneta | 4 |
| PFC_107135 | Carnet de notes blanc A5 Spectrum | 4 |
| PFC_107395 | Carnet A5 Nova | 4 |
| PFC_107732 | Carnet Cobble A5 spirales carton recyclé papier de pierre personnalisable | 4 |
| PFC_107763 | Carnet A5 Honua | 4 |
| PFC_107823 | Stylo bille Parker Jotter recyclé | 4 |
| PFC_107865 | Stylo bille Parker Jotter recyclé | 4 |
| PFC_109016 | Automatique 3 sections 21.5" Parapluie Alex | 4 |
| PFC_109042 | Golf parapluie 30 pouces poignée EVA | 4 |
| PFC_109053 | Automatique 23 pouces Barry parapluie | 4 |
| PFC_109058 | Parapluie pliable Oho 20" | 4 |
| PFC_109077 | Parapluie pliable 21 pouces ouverture automatique Wali | 4 |
| PFC_109143 | Pliable parapluie en RPET 21" | 4 |
| PFC_111069 | Casquette Trucker 5 panneaux | 4 |
| PFC_112053 | Viera tablier | 4 |
| PFC_112712 | Reeva tablier de cuisine | 4 |
| PFC_118018 | Porte-clés ouvre-bouteille et canette Tao | 4 |
| PFC_119385 | Premium sac à dos Oriole | 4 |
| PFC_119386 | Sac à dos Trend 17L | 4 |
| PFC_119411 | Tote bag Carolina en coton | 4 |
| PFC_119412 | Grand sac shopping non tissé Zeus | 4 |
| PFC_119434 | Sac conférence Orlando personnalisable | 4 |
| PFC_120085 | Sac isotherme Lighthouse 21L | 4 |
| PFC_120113 | Premium sac coton Oregon | 4 |
| PFC_120135 | Tote bag Odessa en coton 220 gr/m² 13L personnalisable | 4 |
| PFC_120181 | Tote bag Madras en coton | 87 |
| PFC_120195 | Sac polochon coton Cochichuate 25L personnalisable | 4 |
| PFC_120332 | Tote bag Peru 180 g/m² 7L | 4 |
| PFC_120461 | Sac à dos RPET Oriole cordon | 4 |
| PFC_120548 | Hoss recyclé GRS sac à dos pour ordinateur portable 15,6" personnalisable | 4 |
| PFC_120659 | Sac à dos Byron 18L en RPET GRS 15,6" avec dessus enroulable | 4 |
| PFC_120695 | Tote bag Madras en coton certifié GRS | 4 |
| PFC_120697 | Sac à dos Rise recyclé certifié GRS pour ordinateur portable de 15,6" | 4 |
| PFC_134245 | Batterie de secours aluminium 4000 mAh personnalisable | 4 |
| PFC_134961 | Câble de chargement 3-en-1 avec porte-clés Metal | 4 |
| PFC_210470 | Lunch box MIYO à deux blocs personnalisable | 4 |
| PFC_210701 | Sac Varai 320 g/m² en toile et jute | 4 |
| PFC_21093 | Mémo-autocollants Sticky-Mate® 75x75mm | 4 |
| PFC_21094 | Mémo-autocollants Sticky-Mate® 100x75mm | 4 |
| PFC_21202 | Bloc-notes Desk-Mate® A4 | 4 |
| PFC_21203 | Bloc-notes Desk-Mate® A5 | 4 |
| PFC_21251 | Carnet Desk-Mate A5 à spirales | 4 |
| PFC_21291 | Carnet de notes à spirales A5 Desk-Mate® avec couverture arrière imprimée | 4 |
| PFC_38028 | Heros en coton - Homme | 4 |
| PFC_38080 | Calgary en Coton - Homme | 4 |
| PFC_38106 | Helios en Coton - Homme | 4 |
| PFC_38662 | Bob Solaris | 4 |
| PFC_38666 | Casquette 5 panneaux Feniks | 4 |
| PFC_38668 | Casquette sandwich 5 panneaux Styx | 3 |
| PFC_38676 | Bonnet avec patch Boreas | 4 |
| PFC_38677 | Casquette Doyle 5 panneaux | 4 |
| PFC_38679 | Casquette sandwich Darton 6 panneaux | 4 |
| PFC_39435 | Bodywarmer duvet Caltha pour homme | 4 |
| PFC_R0425 | Montecarlo maille piquée à manches courtes en Synthétique - Homme | 4 |
| PFC_R6424 | Atomic en coton - Unisexe | 4 |
| PFC_R6432 | Veste softshell Antartida homme | 4 |
| PFC_R6554 | Beagle en coton - Homme | 4 |
| PFC_R6635 | Poloe Estrella manches longues en Coton - Homme | 4 |
| PFC_R6638 | Polo Star en Coton - Homme | 4 |
