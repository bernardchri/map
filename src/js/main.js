console.log(
  '%c fait avec ❤️ par @bergall %c https://bergall.fr ',
  'background:#2563eb;color:#fff;font-size:14px;padding:6px 10px;border-radius:4px 0 0 4px;font-weight:bold',
  'background:#fff;color:#2563eb;font-size:12px;padding:7px 10px;border-radius:0 4px 4px 0'
);

// ============================================================
//  CONFIG (depuis config.js)
// ============================================================
const TILE_SIZE        = CONFIG.TILE_SIZE;
const MAP_WIDTH_TILES  = CONFIG.MAP_WIDTH_TILES;
const MAP_HEIGHT_TILES = CONFIG.MAP_HEIGHT_TILES;
const MAX_SCALE        = CONFIG.MAX_SCALE;
const INITIAL_ZOOM     = CONFIG.INITIAL_ZOOM;
const POI_RADIUS       = CONFIG.POI_RADIUS;
const MINIMAP_W        = CONFIG.MINIMAP_W;
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
let devDraggingZone = false; // set by dev-tools when dragging a zone

app.view.addEventListener('pointerdown', (e) => {
  if (devDraggingZone) return;
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
function centerAndFitToScreen(zoom = 1) {
  const scale = getMinScale() * zoom;
  world.scale.set(scale);
  const mapW = MAP_WIDTH_TILES  * TILE_SIZE * scale;
  const mapH = MAP_HEIGHT_TILES * TILE_SIZE * scale;
  world.x = targetX = (app.screen.width  - mapW) / 2;
  world.y = targetY = (app.screen.height - mapH) / 2;
}

centerAndFitToScreen(INITIAL_ZOOM);

window.addEventListener('resize', () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  centerAndFitToScreen(INITIAL_ZOOM);
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
  if (zone.pingpong) {
    for (let i = frames.length - 2; i >= 1; i--) frames.push(frames[i]);
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
  const start = zone.frameOffset || 0;
  const delay = zone.loopDelay || 0;
  let repeatCount = 0;

  const restart = () => {
    if (delay > 0) {
      sprite.gotoAndStop(0);
      setTimeout(() => sprite.gotoAndPlay(0), delay);
    } else {
      sprite.gotoAndPlay(0);
    }
  };

  sprite.loop = false;
  if (zone.loop && delay === 0 && start === 0) {
    sprite.loop = true;
    sprite.play();
  } else if (zone.loop) {
    sprite.onComplete = () => { sprite.loop = true; sprite.gotoAndPlay(0); };
    sprite.gotoAndPlay(start);
  } else if (zone.repeat > 0) {
    sprite.gotoAndPlay(start);
    sprite.onComplete = () => {
      if (++repeatCount < zone.repeat) restart();
      else { sprite.stop(); sprite.onComplete = null; }
    };
  } else {
    sprite.gotoAndPlay(start);
  }
}

const devZones = []; // exposed for dev-tools
const devPois  = []; // exposed for dev-tools

function createZone(zone) {
  const graphics = new PIXI.Graphics();
  if (CONFIG.DEV) {
    graphics.lineStyle(2, 0xff0000, 1);
    graphics.drawRect(0, 0, zone.width, zone.height);
  }
  graphics.x = zone.x;
  graphics.y = zone.y;

  let sprite = null;
  if (zone.image && Array.isArray(zone.imageRange)) {
    sprite = buildAnimatedSprite(zone);
    graphics.addChild(sprite);
    if (zone.autoplay) playAnimation(sprite, zone);
    if (zone.playOnHover) {
      graphics.eventMode = 'static';
      graphics.on('pointerover', () => playAnimation(sprite, zone));
      graphics.on('pointerout',  () => { sprite.stop(); sprite.gotoAndStop(0); sprite.onComplete = null; });
    }
  }

  if (zone.clickable) {
    graphics.eventMode = 'static';
    graphics.cursor = 'pointer';
    graphics.on('pointerdown', () => alert(`Zone "${zone.image}" cliquée !`));
  }

  devZones.push({ graphics, sprite, zone });
  return graphics;
}

async function loadZones() {
  // Clear existing zones
  devZones.forEach(({ graphics }) => tileContainer.removeChild(graphics));
  devZones.length = 0;

  const res = await fetch('assets/interactionZone.json?t=' + Date.now());
  const zones = await res.json();
  const allFrames = zones.flatMap(zone =>
    zone.image && Array.isArray(zone.imageRange)
      ? Array.from({ length: zone.imageRange[1] - zone.imageRange[0] + 1 },
          (_, i) => `assets/${zone.image}/${zone.image}_${zone.imageRange[0] + i}.webp`)
      : []
  );
  await PIXI.Assets.load(allFrames);
  zones.filter(zone => zone.visible !== false).forEach(zone => tileContainer.addChild(createZone(zone)));
}
loadZones().catch(err => console.error('Zones:', err));

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
    const s = lerp(anim.container.scale.x, anim.targetScale, 0.15);
    anim.container.scale.set(s);
    if (anim.labelGroup) anim.labelGroup.scale.set(1 / s);
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
  container.eventMode = 'static';
  container.cursor  = 'pointer';
  container.hitArea = new PIXI.Circle(0, 0, POI_RADIUS * 2.5);

  const pulse = new PIXI.Graphics();
  pulse.lineStyle(4, 0xffffff, 1);
  pulse.drawCircle(0, 0, POI_RADIUS);
  container.addChild(pulse);
  const anim = { pulse, phase: Math.random(), container, targetScale: 1 };
  poiAnimations.push(anim);

  const dot = new PIXI.Graphics();
  dot.lineStyle(8, 0xffffff, 1);
  dot.beginFill(0x000000);
  dot.drawCircle(0, 0, POI_RADIUS);
  dot.endFill();
  container.addChild(dot);

  // Label
  const label = new PIXI.Text(poi.label, {
    fontFamily: 'Inter, sans-serif',
    fontSize: 32,
    fill: 0x000000,
  });
  const labelOffset = 32;   // écart entre le cercle et le label
  const padX = 24;
  const padY = 8;

  label.anchor.set(0, 0.5);
  label.x = POI_RADIUS + labelOffset;

  const bg = new PIXI.Graphics();
  bg.beginFill(0xffffff);
  bg.drawRoundedRect(
    label.x - padX,
    -label.height / 2 - padY,
    label.width + padX * 2,
    label.height + padY * 2,
    16
  );
  bg.endFill();
  const labelGroup = new PIXI.Container();
  labelGroup.eventMode = 'static';
  labelGroup.cursor = 'pointer';
  labelGroup.on('pointerdown', () => { poiClicked = true; openPoiPanel(poi); });
  labelGroup.addChild(bg);
  labelGroup.addChild(label);
  container.addChild(labelGroup);
  anim.labelGroup = labelGroup;

  container.on('pointerover',  () => { anim.targetScale = 1.5; container.parent.setChildIndex(container, container.parent.children.length - 1); });
  container.on('pointerout',   () => anim.targetScale = 1);
  container.on('pointerdown',  () => { poiClicked = true; openPoiPanel(poi); });
  devPois.push({ container, poi });
  return container;
}

async function loadPois() {
  // Clear existing POIs
  poiContainer.removeChildren();
  poiAnimations.length = 0;
  devPois.length = 0;

  const res = await fetch('assets/poi.json?t=' + Date.now());
  const pois = await res.json();
  pois.forEach(poi => poiContainer.addChild(createPoiSprite(poi)));
}
loadPois().catch(err => console.error('POI:', err));
