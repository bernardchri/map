// ============================================================
//  CONFIG
// ============================================================
const TILE_SIZE        = 512;
const MAP_WIDTH_TILES  = 14;
const MAP_HEIGHT_TILES = 10;
const MAX_SCALE        = 2;
const POI_RADIUS       = 24;
const MINIMAP_W        = 160;
const MINIMAP_H        = Math.round(MINIMAP_W / (MAP_WIDTH_TILES / MAP_HEIGHT_TILES));

// ============================================================
//  PIXI SETUP
// ============================================================
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1e1e1e,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});
document.getElementById('canvas-container').appendChild(app.view);

const world = new PIXI.Container();
app.stage.addChild(world);

const tileContainer = new PIXI.Container();
world.addChild(tileContainer);

const poiContainer = new PIXI.Container();
world.addChild(poiContainer);

// ============================================================
//  UTILS
// ============================================================
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

function getMinScale() {
  return Math.max(
    app.screen.width  / (MAP_WIDTH_TILES  * TILE_SIZE),
    app.screen.height / (MAP_HEIGHT_TILES * TILE_SIZE)
  );
}

function getBounds() {
  const mapW = MAP_WIDTH_TILES  * TILE_SIZE * world.scale.x;
  const mapH = MAP_HEIGHT_TILES * TILE_SIZE * world.scale.y;
  const minX = mapW <= app.screen.width  ? (app.screen.width  - mapW) / 2 : -(mapW - app.screen.width);
  const maxX = mapW <= app.screen.width  ? (app.screen.width  - mapW) / 2 : 0;
  const minY = mapH <= app.screen.height ? (app.screen.height - mapH) / 2 : -(mapH - app.screen.height);
  const maxY = mapH <= app.screen.height ? (app.screen.height - mapH) / 2 : 0;
  return { minX, maxX, minY, maxY };
}

function clampTarget() {
  const { minX, minY, maxX, maxY } = getBounds();
  targetX = clamp(targetX, minX, maxX);
  targetY = clamp(targetY, minY, maxY);
}

// ============================================================
//  NAVIGATION STATE
// ============================================================
let dragging   = false;
let lastPos    = null;
let targetX    = 0;
let targetY    = 0;
let poiClicked = false;

// ============================================================
//  TILES
// ============================================================
const tileSprites = {};

function loadVisibleTiles() {
  const left   = -world.x / world.scale.x;
  const top    = -world.y / world.scale.y;
  const right  = (-world.x + app.screen.width)  / world.scale.x;
  const bottom = (-world.y + app.screen.height) / world.scale.y;

  const c0 = Math.floor(left   / TILE_SIZE);
  const c1 = Math.ceil (right  / TILE_SIZE);
  const r0 = Math.floor(top    / TILE_SIZE);
  const r1 = Math.ceil (bottom / TILE_SIZE);

  for (let row = r0; row < r1; row++) {
    for (let col = c0; col < c1; col++) {
      if (row < 0 || col < 0 || row >= MAP_HEIGHT_TILES || col >= MAP_WIDTH_TILES) continue;
      const key = `${row}_${col}`;
      if (tileSprites[key]) continue;
      const sprite = PIXI.Sprite.from(`assets/tiles/${row}_${col}.webp`);
      sprite.x = col * TILE_SIZE;
      sprite.y = row * TILE_SIZE;
      tileContainer.addChild(sprite);
      tileSprites[key] = sprite;
    }
  }
}
app.ticker.add(loadVisibleTiles);

// ============================================================
//  PAN
// ============================================================
app.view.addEventListener('pointerdown', (e) => {
  if (poiClicked) { poiClicked = false; return; }
  closePoiPanel();
  dragging = true;
  lastPos  = { x: e.clientX, y: e.clientY };
});

app.view.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  targetX += e.clientX - lastPos.x;
  targetY += e.clientY - lastPos.y;
  lastPos  = { x: e.clientX, y: e.clientY };
  clampTarget();
});

['pointerup', 'pointerleave'].forEach(evt =>
  app.view.addEventListener(evt, () => dragging = false)
);

app.ticker.add(() => {
  world.x = lerp(world.x, targetX, 0.1);
  world.y = lerp(world.y, targetY, 0.1);
});

// ============================================================
//  ZOOM
// ============================================================
function applyZoom(newScale, anchorX, anchorY) {
  const scale = clamp(newScale, getMinScale(), MAX_SCALE);
  const mapX  = (anchorX - targetX) / world.scale.x;
  const mapY  = (anchorY - targetY) / world.scale.y;
  world.scale.set(scale);
  targetX = anchorX - mapX * scale;
  targetY = anchorY - mapY * scale;
  clampTarget();
  world.x = targetX;
  world.y = targetY;
}

app.view.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = app.view.getBoundingClientRect();
  applyZoom(
    world.scale.x * (1 - e.deltaY * 0.0015),
    e.clientX - rect.left,
    e.clientY - rect.top
  );
});

document.getElementById('zoom-in').addEventListener('click', () =>
  applyZoom(world.scale.x * 1.1, app.screen.width / 2, app.screen.height / 2)
);
document.getElementById('zoom-out').addEventListener('click', () =>
  applyZoom(world.scale.x * 0.9, app.screen.width / 2, app.screen.height / 2)
);

// ============================================================
//  INITIAL VIEW + RESIZE
// ============================================================
function centerAndFitToScreen() {
  const scale = getMinScale();
  world.scale.set(scale);
  const mapW = MAP_WIDTH_TILES  * TILE_SIZE * scale;
  const mapH = MAP_HEIGHT_TILES * TILE_SIZE * scale;
  world.x = targetX = (app.renderer.width  - mapW) / 2;
  world.y = targetY = (app.renderer.height - mapH) / 2;
}

centerAndFitToScreen();

window.addEventListener('resize', () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  centerAndFitToScreen();
});

// ============================================================
//  MINIMAP
// ============================================================
const minimapCanvas = document.getElementById('minimap');
const minimapCtx    = minimapCanvas.getContext('2d');
minimapCanvas.width  = MINIMAP_W;
minimapCanvas.height = MINIMAP_H;

const minimapImage = new Image();
minimapImage.src = 'assets/map-mini.webp';

function drawMinimap() {
  minimapCtx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

  if (minimapImage.complete && minimapImage.naturalWidth > 0) {
    minimapCtx.drawImage(minimapImage, 0, 0, MINIMAP_W, MINIMAP_H);
  } else {
    minimapCtx.fillStyle = '#333';
    minimapCtx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);
  }

  const mapTotalW = MAP_WIDTH_TILES  * TILE_SIZE;
  const mapTotalH = MAP_HEIGHT_TILES * TILE_SIZE;
  const sx = MINIMAP_W / mapTotalW;
  const sy = MINIMAP_H / mapTotalH;

  const vLeft   = clamp(-world.x / world.scale.x,                          0, mapTotalW);
  const vTop    = clamp(-world.y / world.scale.y,                          0, mapTotalH);
  const vRight  = clamp((-world.x + app.screen.width)  / world.scale.x,   0, mapTotalW);
  const vBottom = clamp((-world.y + app.screen.height) / world.scale.y,   0, mapTotalH);

  minimapCtx.fillStyle   = 'rgba(255,255,255,0.15)';
  minimapCtx.strokeStyle = 'rgba(255,255,255,0.9)';
  minimapCtx.lineWidth   = 1.5;
  minimapCtx.fillRect  (vLeft * sx, vTop * sy, (vRight - vLeft) * sx, (vBottom - vTop) * sy);
  minimapCtx.strokeRect(vLeft * sx, vTop * sy, (vRight - vLeft) * sx, (vBottom - vTop) * sy);
}
app.ticker.add(drawMinimap);

let minimapDragging = false;

function navigateFromMinimap(e) {
  const rect = minimapCanvas.getBoundingClientRect();
  const mapX = ((e.clientX - rect.left) / MINIMAP_W) * (MAP_WIDTH_TILES  * TILE_SIZE);
  const mapY = ((e.clientY - rect.top)  / MINIMAP_H) * (MAP_HEIGHT_TILES * TILE_SIZE);
  targetX = app.screen.width  / 2 - mapX * world.scale.x;
  targetY = app.screen.height / 2 - mapY * world.scale.y;
  clampTarget();
}

minimapCanvas.addEventListener('pointerdown', (e) => { minimapDragging = true; navigateFromMinimap(e); e.stopPropagation(); });
minimapCanvas.addEventListener('pointermove', (e) => { if (minimapDragging) { navigateFromMinimap(e); e.stopPropagation(); } });
['pointerup', 'pointerleave'].forEach(evt =>
  minimapCanvas.addEventListener(evt, () => minimapDragging = false)
);

// ============================================================
//  ZONES D'INTERACTION
// ============================================================
function buildAnimatedSprite(zone) {
  const frames = [];
  for (let i = zone.imageRange[0]; i <= zone.imageRange[1]; i++) {
    frames.push(PIXI.Texture.from(`assets/${zone.image}/${zone.image}_${i}.webp`));
  }
  const sprite = new PIXI.AnimatedSprite(frames);
  sprite.width  = zone.width;
  sprite.height = zone.height;
  sprite.animationSpeed = (zone.fps > 0 ? zone.fps : 30) / 60;
  sprite.loop    = !!zone.loop;
  sprite.visible = true;
  return sprite;
}

function playAnimation(sprite, zone) {
  let repeatCount = 0;
  if (zone.loop) {
    sprite.loop = true;
    sprite.play();
  } else if (zone.repeat > 0) {
    sprite.loop = false;
    sprite.gotoAndPlay(0);
    sprite.onComplete = () => {
      if (++repeatCount < zone.repeat) sprite.gotoAndPlay(0);
      else { sprite.stop(); sprite.onComplete = null; }
    };
  } else {
    sprite.loop = false;
    sprite.gotoAndPlay(0);
  }
}

function createZone(zone) {
  const color    = parseInt(zone.color.replace('#', ''), 16);
  const graphics = new PIXI.Graphics();
  graphics.beginFill(color, 0.3);
  graphics.drawRect(0, 0, zone.width, zone.height);
  graphics.endFill();
  graphics.x = zone.x;
  graphics.y = zone.y;

  if (zone.image && Array.isArray(zone.imageRange)) {
    const sprite = buildAnimatedSprite(zone);
    graphics.addChild(sprite);
    if (zone.autoplay) playAnimation(sprite, zone);
    if (zone.playOnHover) {
      graphics.interactive = true;
      graphics.on('pointerover', () => playAnimation(sprite, zone));
      graphics.on('pointerout',  () => { sprite.stop(); sprite.gotoAndStop(0); sprite.onComplete = null; });
    }
  }

  if (zone.clickable) {
    graphics.interactive = true;
    graphics.buttonMode  = true;
    graphics.on('pointerdown', () => alert(`Zone "${zone.image}" cliquée !`));
  }

  return graphics;
}

fetch('assets/interactionZone.json')
  .then(res => res.json())
  .then(async zones => {
    const allFrames = zones.flatMap(zone =>
      zone.image && Array.isArray(zone.imageRange)
        ? Array.from({ length: zone.imageRange[1] - zone.imageRange[0] + 1 },
            (_, i) => `assets/${zone.image}/${zone.image}_${zone.imageRange[0] + i}.webp`)
        : []
    );
    await PIXI.Assets.load(allFrames);
    zones.forEach(zone => tileContainer.addChild(createZone(zone)));
  })
  .catch(err => console.error('Zones:', err));

// ============================================================
//  POI
// ============================================================
const poiPanel      = document.getElementById('poi-panel');
const poiContent    = document.getElementById('poi-content');
const poiAnimations = [];

app.ticker.add(() => {
  poiAnimations.forEach(anim => {
    anim.phase = (anim.phase + 0.008) % 1;
    anim.pulse.scale.set(1 + anim.phase * 1.2);
    anim.pulse.alpha = 1 - anim.phase;
  });
});

function openPoiPanel(poi) {
  fetch(poi.content)
    .then(res => res.text())
    .then(md  => { poiContent.innerHTML = marked.parse(md); poiPanel.classList.add('open'); })
    .catch(()  => { poiContent.innerHTML = `<h1>${poi.label}</h1><p>Contenu introuvable.</p>`; poiPanel.classList.add('open'); });
}

function closePoiPanel() {
  poiPanel.classList.remove('open');
}

document.getElementById('poi-close').addEventListener('click', closePoiPanel);

function createPoiSprite(poi) {
  const container   = new PIXI.Container();
  container.x       = poi.x;
  container.y       = poi.y;
  container.interactive = true;
  container.cursor  = 'pointer';
  container.hitArea = new PIXI.Circle(0, 0, POI_RADIUS * 2.5);

  const pulse = new PIXI.Graphics();
  pulse.lineStyle(4, 0xffffff, 1);
  pulse.drawCircle(0, 0, POI_RADIUS);
  container.addChild(pulse);
  poiAnimations.push({ pulse, phase: Math.random() });

  const dot = new PIXI.Graphics();
  dot.lineStyle(8, 0xffffff, 1);
  dot.beginFill(0x000000);
  dot.drawCircle(0, 0, POI_RADIUS);
  dot.endFill();
  container.addChild(dot);

  container.on('pointerdown', () => { poiClicked = true; openPoiPanel(poi); });
  return container;
}

fetch('assets/poi.json')
  .then(res => res.json())
  .then(pois => pois.forEach(poi => poiContainer.addChild(createPoiSprite(poi))))
  .catch(err  => console.error('POI:', err));
