// ============================================================
//  CONFIG — paramètres globaux (carte, splash, POI…)
// ============================================================
const CONFIG = {

  // ---- Dev ----
  DEV: false,              // true = outils dev (clic droit → copie coordonnées)

  // ---- Carte / Tuiles ----
  TILE_SIZE:        512,
  MAP_WIDTH_TILES:  14,
  MAP_HEIGHT_TILES: 10,
  MAX_SCALE:        2,
  INITIAL_ZOOM:     1.6,   // multiplicateur du zoom initial (1 = fit-to-screen)

  // ---- POI ----
  POI_RADIUS:       32,

  // ---- Minimap ----
  MINIMAP_W:        160,

  // ---- Splash screen ----
  CLOUD_COUNT:        50,
  SPLASH_ZOOM:        4,      // zoom CSS initial (1 = pas de zoom)
  SPLASH_ZOOM_DURATION: 3.3,  // durée du dézoom (secondes)
  TEXT_FADE_DELAY:    750,     // ms avant fade du texte
  CLOUDS_PART_DELAY:  1000,   // ms avant ouverture des nuages
};
