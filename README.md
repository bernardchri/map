# Le monde du Studio Bergall

Carte interactive construite avec Pixi.js pour explorer l'univers du Studio Bergall — illustration, motion design, 3D, webdesign et développement.

**Demo :** https://bernardchri.github.io/map

## Fonctionnalités

- Zoom centré sur la souris (molette) ou sur le centre (boutons +/-)
- Pan fluide avec inertie
- Chargement lazy des tuiles selon le viewport
- Zones d'interaction animées configurables via JSON
- POI cliquables avec panel de contenu Markdown
- Minimap interactive (clic/drag pour naviguer)
- Splash screen animé (nuages + zoom d'ouverture)
- Open Graph / Twitter Card pour le partage sur les réseaux sociaux
- Responsive — la carte couvre toujours l'écran entier

## Stack

Vanilla JavaScript + Pixi.js v7.2.4 (CDN) — no framework, no bundler, no TypeScript.

## Lancer en local

```bash
python3 -m http.server 8080
# ou
npx serve .
```

Puis ouvrir http://localhost:8080

## Configuration

Tous les paramètres sont dans `src/js/config.js` (zoom, taille des tuiles, splash, POI, etc.).

## Mode dev

Mettre `DEV: true` dans `src/js/config.js` pour activer :

- Skip du splash screen
- Clic droit → copie coordonnées map
- Bordures rouges sur les zones d'interaction
- Drag & drop des zones + copie JSON au relâchement
- Panel de contrôle au clic (width, height, fps, loop, repeat, visible)

Un pre-commit hook bloque le commit si `DEV: true` est resté activé.

## Regénérer les tuiles

Placer l'image source dans `tile-generator/map.jpg` puis :

```bash
cd tile-generator
npm install              # une seule fois
node tile-generator.js   # tuiles WebP dans assets/tiles/
node minimap-generator.js  # minimap dans assets/map-mini.webp
```

Mettre à jour `MAP_WIDTH_TILES` et `MAP_HEIGHT_TILES` dans `src/js/config.js` si la grille change.

## Ajouter une animation

1. Exporter les frames en PNG dans `assets/nom_animation/` (nommées `nom_animation_0.png`, `nom_animation_1.png`...)
2. Convertir en WebP :

```bash
node tile-generator/frames-to-webp.js assets/nom_animation
```

3. Ajouter une entrée dans `assets/interactionZone.json` avec `"image": "nom_animation"`

## Ajouter un POI

1. Créer un fichier `assets/poi/mon-projet.md` avec du contenu Markdown
2. Ajouter une entrée dans `assets/poi.json` :

```json
{
  "id": "mon-projet",
  "x": 3500,
  "y": 2400,
  "label": "Mon projet",
  "content": "assets/poi/mon-projet.md"
}
```

Attention : les noms de fichiers sont sensibles à la casse sur GitHub Pages.
