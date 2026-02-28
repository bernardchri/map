# Map Pixie

Visionneuse de carte interactive construite avec Pixi.js.

**Demo :** https://bernardchri.github.io/map

## Fonctionnalités

- Zoom centré sur la souris (molette) ou sur le centre (boutons +/−)
- Pan fluide avec inertie
- Chargement lazy des tuiles selon le viewport
- Zones d'interaction animées configurables via JSON
- Minimap interactive (clic/drag pour naviguer)
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
