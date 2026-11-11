# Dress Up

Web app de garde-robe pensée pour l'écologie : ta penderie dans ton téléphone, des tenues selon la météo, moins de lessives, des vêtements qui durent.

- 100 % locale : vêtements et photos restent dans ton navigateur (IndexedDB). Pas de compte, pas de serveur.
- Météo : Open-Meteo (sans clé ni pistage), position de la ville arrondie.
- Reconnaissance des vêtements (type, matière, motif) : modèle CLIP qui tourne sur l'appareil (transformers.js), téléchargé une fois.
- Détourage des photos : modèle RMBG-1.4 sur l'appareil (licence non commerciale).
- Fonctionne hors ligne (service worker).

Ouvrir : https://9wsv9ngdft-cmd.github.io/penderie-/ — raccourci du matin : ajouter `#matin` à l'adresse.

## Organisation du code
- `index.html` : structure de la page
- `css/app.css` : styles
- `js/base.js` : utilitaires, référentiels, stockage local
- `js/meteo-tenues.js` : météo, proposition de tenues, lessive
- `js/vues.js` : écrans et fenêtres
- `js/ia.js` : photo, couleur, reconnaissance et détourage
- `js/actions.js` : actions et événements
- `js/main.js` : routage et démarrage
