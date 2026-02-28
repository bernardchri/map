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

## Tile & Minimap Generation

Source image: `tile-generator/map.jpg`

```bash
cd tile-generator
npm install              # only needed once; installs Sharp
node tile-generator.js   # génère assets/tiles/{row}_{col}.webp
node minimap-generator.js  # génère assets/map-mini.webp (320px)
```

After regenerating tiles, update `MAP_WIDTH_TILES` and `MAP_HEIGHT_TILES` in `main.js` to match the new grid (printed in the console by the script).

Current grid: **14 columns × 10 rows**, 512×512px tiles (source: 7168×5120px).

## Architecture

**Stack:** Vanilla JavaScript + Pixi.js v7.2.4 (CDN) — no framework, no bundler, no TypeScript.

**Map dimensions:** 7168×5120px total (14 cols × 10 rows of 512×512px tiles). Coordinates in `interactionZone.json` are in map pixels.

**Pixi.js container hierarchy:**
```
app.stage
  └── world (Container)         ← panned/zoomed as a unit
        └── tileContainer       ← tile sprites + zone graphics
```

`world.x/y` and `world.scale` drive all panning and zooming. The `targetX/targetY` state is lerp'd into `world.x/y` each tick for smooth pan. Zoom snaps `world.x/y` immediately (no lerp) to avoid jitter.

**Zoom:** minimum scale is dynamic (`getMinScale()`) so the map always covers the full screen. Zoom is anchored to the cursor position using `targetX/targetY` (not the lerped `world.x/y`).

**Tile system (`main.js`):** Tiles are lazy-loaded each frame based on the current viewport. Loaded tiles are cached in `tileSprites` and never unloaded. Tile format: WebP.

**Minimap (`main.js`):** HTML5 Canvas element (`#minimap`) drawing `assets/map-mini.webp` with a live viewport rectangle. Click or drag on the minimap to navigate.

**Interactive zones:** Loaded from `assets/interactionZone.json`. Each zone renders a semi-transparent colored rectangle and optionally a `PIXI.AnimatedSprite`. Frame images are WebP, named `assets/{image}/{image}_{n}.webp`.

**Adding an animation:** export PNG frames into `assets/{name}/`, run `node tile-generator/frames-to-webp.js ../assets/{name}` to batch-convert to WebP (deletes PNGs), then add a zone entry in `interactionZone.json`.

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
