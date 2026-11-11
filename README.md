# Dress Up

Web app de garde-robe pensée pour l'écologie : ta penderie dans ton téléphone, des tenues selon la météo, moins de lessives, des vêtements qui durent.

- 100 % locale : vêtements et photos restent dans ton navigateur (IndexedDB). Pas de compte, pas de serveur.
- Météo : Open-Meteo (sans clé ni pistage), position de la ville arrondie.
- Reconnaissance des vêtements (type, matière, motif) : modèle CLIP qui tourne sur l'appareil (transformers.js), téléchargé une fois.
- Détourage des photos : modèle RMBG-1.4 sur l'appareil (licence non commerciale).
- Fonctionne hors ligne (service worker).

Ouvrir : https://9wsv9ngdft-cmd.github.io/penderie-/ — raccourci du matin : ajouter `#matin` à l'adresse.

## Organisation du code
Les fichiers JS sont chargés dans cet ordre par `index.html` (pas de module : tout est global). Le service worker `sw.js` garde la même liste pour le hors ligne : à chaque envoi, augmenter son numéro de cache et tenir la liste à jour.

- `index.html` : structure de la page, règle de sécurité (CSP)
- `css/app.css` : styles, design « Portant »
- `fonts/` : polices Inter et Unbounded, avec leurs licences
- `js/base.js` : utilitaires, catégories et couleurs, stockage local (IndexedDB), adresses des photos, vignettes
- `js/lessive.js` : format des prix, panier à linge, machine pleine
- `js/cout.js` : coût par port, ports estimés avant l'app, durée de vie
- `js/saisons.js` : saisons, vêtements rangés
- `js/meteo-tenues.js` : météo, tenues du jour, porter / annuler
- `js/vues.js` : écrans (Ce matin, Penderie, Ajouter, Bilan, Réglages), fenêtres, fiche « passeport », accessibilité
- `js/ia.js` : photo, couleur, reconnaissance (CLIP) et détourage sur l’appareil ; file d’analyse, détourage en arrière-plan après l’enregistrement
- `js/actions.js` : actions des boutons, formulaire, sauvegarde, restauration contrôlée, rappels
- `js/achats.js` : occasions, tenues favorites, envies, défis
- `js/empreinte.js` : empreinte carbone (valeurs ADEME / Impact CO2) et équivalences
- `js/accueil.js` : accueil au premier lancement
- `js/circulaire.js` : seconde vie, entretien
- `js/valise.js` : valise selon la météo
- `js/dessous.js` : dessous, inventaire express, photo du jour
- `js/planning.js` : Ma semaine
- `js/reparation.js` : session réparation
- `js/badges.js` : badges
- `js/assistant.js` : assistant shopper local
- `js/scanner.js` : appareil photo (une ou plusieurs photos, rien n’est analysé caméra ouverte), liste à vérifier
- `js/style.js` : humeur, styles, harmonie des couleurs, photo miroir, lookbook
- `js/main.js` : affichage, routage, démarrage

## Licences
- Polices : Inter (Rasmus Andersson) et Unbounded (NaN), licence SIL Open Font License 1.1, textes dans `fonts/`. Réduites au latin et aux graisses utilisées (`fonts/inter.woff` 400–700, `fonts/unbounded.woff` 500–700).
- Détourage : modèle RMBG-1.4 de BRIA, **licence non commerciale**. À remplacer avant toute diffusion payante.
- Reconnaissance : CLIP (OpenAI), via transformers.js (Apache-2.0), version figée dans `js/ia.js`.
