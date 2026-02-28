# Map Pixie

Visionneuse de carte interactive construite avec Pixi.js.

**Demo :** https://bernardchri.github.io/map

## Fonctionnalités

- Zoom centré sur la souris (molette) ou sur le centre (boutons +/−)
- Pan fluide avec inertie
- Chargement lazy des tuiles selon le viewport
- Zones d'interaction animées configurables via JSON
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
