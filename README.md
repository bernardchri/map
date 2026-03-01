# Map Pixie

Visionneuse de carte interactive construite avec Pixi.js.

**Demo :** https://bernardchri.github.io/map

## Fonctionnalités

- Zoom centré sur la souris (molette) ou sur le centre (boutons +/−)
- Pan fluide avec inertie
- Chargement lazy des tuiles selon le viewport
- Zones d'interaction animées configurables via JSON
- POI cliquables avec panel de contenu Markdown
- Minimap interactive (clic/drag pour naviguer)
- Splash screen animé (nuages qui s'écartent pour révéler la carte)
- Responsive — la carte couvre toujours l'écran entier

## Lancer en local

```bash
python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080

## Regénérer les tuiles

Placer l'image source dans `tile-generator/map.jpg` puis :

```bash
cd tile-generator
node tile-generator.js
```

Mettre à jour `MAP_WIDTH_TILES` et `MAP_HEIGHT_TILES` dans `main.js` si les dimensions de la grille changent (affichées dans la console du script).

## Regénérer la minimap

```bash
cd tile-generator
node minimap-generator.js
```

Génère `assets/map-mini.webp` à 320px de large depuis `tile-generator/map.jpg`.

## Ajouter une animation

1. Exporte tes frames en PNG dans `assets/nom_animation/` (nommées `nom_animation_0.png`, `nom_animation_1.png`…)
2. Convertis en WebP :

```bash
cd tile-generator
node frames-to-webp.js ../assets/nom_animation
```

3. Ajoute une entrée dans `assets/interactionZone.json` avec `"image": "nom_animation"`

## Ajouter un POI

1. Crée un fichier `assets/poi/mon-projet.md` avec le contenu (Markdown standard)
2. Ajoute une entrée dans `assets/poi.json` :

```json
{
  "id": "mon-projet",
  "x": 3500,
  "y": 2400,
  "label": "Mon projet",
  "content": "assets/poi/mon-projet.md"
}
```

La taille des POI se règle via `POI_RADIUS` dans `main.js`.
