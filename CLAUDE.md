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

## Tile Generation

Tiles are pre-generated from a source image (`tile-generator/map.png`) and must be regenerated when the base map changes:

```bash
cd tile-generator
npm install       # only needed once; installs Sharp
node tile-generator.js
```

Output: `../assets/tiles/{row}_{col}.png` — 48 tiles total (8 columns × 6 rows, each 1024×1024px).

Alternatively, `tile-generator/script-tuile.jsx` is an Adobe Photoshop ExtendScript for manual tile export.

## Architecture

**Stack:** Vanilla JavaScript + Pixi.js v7.2.4 (CDN) — no framework, no bundler, no TypeScript.

**Map dimensions:** 8192×6144px total (8 cols × 6 rows of 1024×1024px tiles). Coordinates in `interactionZone.json` are in map pixels.

**Pixi.js container hierarchy:**
```
app.stage
  └── world (Container)         ← panned/zoomed as a unit
        └── tileContainer       ← tile sprites + zone graphics
```

`world.x/y` and `world.scale` drive all panning and zooming. The `targetX/targetY` state is lerp'd into `world.x/y` each tick for smooth movement.

**Tile system (`main.js:64-91`):** Tiles are lazy-loaded each frame by computing which rows/cols are in the current viewport. Loaded tiles are cached in the `tileSprites` object and never unloaded.

**Zoom anchor system (`main.js:32-35`, `126-168`):** An `anchor` point in map-space is maintained so that zoom operations (wheel or buttons) keep that point visually fixed on screen. The anchor updates on `pointerdown`.

**Interactive zones (`main.js:209-306`):** Loaded from `assets/interactionZone.json`. Each zone renders a semi-transparent colored rectangle and optionally an `PIXI.AnimatedSprite`. Zone images must be named `assets/{image}/{image}_{n}.png` (e.g. `assets/zone_sprite/zone_sprite_0.png`).

## Interactive Zone JSON Schema

```json
{
  "x": 3430,           // map pixel X
  "y": 4269,           // map pixel Y
  "width": 200,
  "height": 200,
  "color": "#00ff00",  // rectangle overlay color (opacity hardcoded to 0.3)
  "image": "zone_sprite",       // subfolder name under assets/
  "imageRange": [0, 99],        // inclusive frame range
  "fps": 30,
  "autoplay": true,
  "loop": true,
  "playOnHover": false,
  "clickable": true,
  "repeat": 0           // number of extra plays if loop:false (0 = play once)
}
```
