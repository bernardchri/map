# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

The app uses `fetch()` to load JSON assets, so it must be served via HTTP (not opened directly as a file):

```bash
# From the project root
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` in a browser. No build step required — Pixi.js is loaded from CDN.

## Configuration

All settings are centralized in `src/js/config.js` :

- `DEV` — active le mode dev (bordures rouges sur les zones, drag & drop, panel de contrôle, skip splash)
- `TILE_SIZE`, `MAP_WIDTH_TILES`, `MAP_HEIGHT_TILES` — dimensions de la grille de tuiles
- `MAX_SCALE`, `INITIAL_ZOOM` — limites et zoom initial
- `POI_RADIUS` — taille des points d'intérêt
- `MINIMAP_W` — largeur de la minimap
- `CLOUD_COUNT`, `SPLASH_ZOOM`, `SPLASH_ZOOM_DURATION`, etc. — paramètres du splash screen

## Tile & Minimap & OG Image Generation

Source image: `tile-generator/map.jpg`

```bash
cd tile-generator
npm install              # only needed once; installs Sharp
node tile-generator.js   # génère assets/tiles/{row}_{col}.webp
node minimap-generator.js  # génère assets/map-mini.webp (320px)
```

OG image (pour partage réseaux sociaux) :
```bash
cd tile-generator
node -e "require('sharp')('map.jpg').resize(1200).jpeg({quality:85}).toFile('../assets/og-image.jpg')"
```

After regenerating tiles, update `MAP_WIDTH_TILES` and `MAP_HEIGHT_TILES` in `src/js/config.js` to match the new grid (printed in the console by the script).

Current grid: **14 columns × 10 rows**, 512×512px tiles (source: 7168×5120px).

## Architecture

**Stack:** Vanilla JavaScript + Pixi.js v7.2.4 (CDN) — no framework, no bundler, no TypeScript.

**Files:**
- `src/js/config.js` — configuration centralisée
- `src/js/main.js` — app Pixi, tiles, pan/zoom, zones d'interaction, POI
- `src/js/splash.js` — splash screen (sauté si `DEV: true`)
- `src/js/dev-tools.js` — outils dev (coordonnées, drag & drop zones, panel de contrôle)
- `src/css/style.css` — styles DOM (splash, POI panel, minimap, UI)

**Map dimensions:** 7168×5120px total (14 cols × 10 rows of 512×512px tiles). Coordinates in `interactionZone.json` and `poi.json` are in map pixels.

**Pixi.js container hierarchy:**
```
app.stage
  └── world (Container)         ← panned/zoomed as a unit
        ├── tileContainer       ← tile sprites + zone graphics
        └── poiContainer        ← POI (toujours au-dessus des tuiles)
```

`world.x/y` and `world.scale` drive all panning and zooming. The `targetX/targetY` state is lerp'd into `world.x/y` each tick for smooth pan. Zoom snaps `world.x/y` immediately (no lerp) to avoid jitter.

**Zoom:** minimum scale is dynamic (`getMinScale()`) so the map always covers the full screen. Zoom is anchored to the cursor position. `applyZoom(newScale, anchorX, anchorY)` unifie zoom molette et boutons.

**Tile system (`main.js`):** Tiles are lazy-loaded each frame based on the current viewport. Loaded tiles are cached in `tileSprites` and never unloaded. Tile format: WebP.

**Minimap (`main.js`):** HTML5 Canvas element (`#minimap`) drawing `assets/map-mini.webp` with a live viewport rectangle. Click or drag on the minimap to navigate.

**Interactive zones:** Loaded from `assets/interactionZone.json`. En production, les zones sont invisibles (seul le sprite est affiché). En DEV, elles ont une bordure rouge et sont draggables. Frame images are WebP, named `assets/{image}/{image}_{n}.webp`.

**POI:** définis dans `assets/poi.json`. Chaque POI affiche un cercle noir/blanc avec un anneau pulse animé. Au clic, un panel slide-in charge et rend le fichier `.md` associé via marked.js.

**Splash screen (`splash.js`):** Overlay DOM avec texte "studio bergall" + nuages blancs générés dynamiquement. Sauté automatiquement quand `DEV: true`. Config dans `src/js/config.js`.

## Dev Mode (`DEV: true` dans config.js)

- Splash screen sauté
- Clic droit sur la carte → copie les coordonnées map dans le presse-papier
- Bordures rouges sur les zones d'interaction
- Drag & drop des zones → copie l'objet JSON complet au relâchement
- Clic sur une zone → panel dev avec contrôles : width, height, fps, loop, repeat, visible, play/stop
- Badge "dev mode" affiché en haut à gauche
- **Pre-commit hook** : bloque le commit si `DEV: true` est resté dans config.js

## Pixi.js API Notes

Pixi v7.2+ : utiliser `eventMode = 'static'` au lieu de `interactive = true`, et `cursor = 'pointer'` au lieu de `buttonMode = true`.

## POI JSON Schema

```json
{
  "id": "mon-projet",
  "x": 3500,
  "y": 2400,
  "label": "Mon projet",
  "content": "assets/poi/mon-projet.md"
}
```

Le fichier `.md` peut contenir du Markdown standard (titres, listes, images, liens, iframes). Les images référencées doivent être dans `assets/poi/`.

**Attention à la casse des noms de fichiers** — GitHub Pages (Linux) est sensible à la casse, contrairement à macOS.

## Interactive Zone JSON Schema

```json
{
  "x": 3430,
  "y": 4269,
  "width": 200,
  "height": 200,
  "image": "zone_sprite",
  "imageRange": [0, 99],
  "fps": 30,
  "autoplay": true,
  "loop": true,
  "playOnHover": false,
  "clickable": true,
  "repeat": 0,
  "visible": true
}
```

**Adding an animation:** export PNG frames into `assets/{name}/`, run `node tile-generator/frames-to-webp.js ../assets/{name}` to batch-convert to WebP (deletes PNGs), then add a zone entry in `interactionZone.json`.

## TODO
[[TODO.md]]