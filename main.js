const TILE_SIZE = 1024;
const MAP_WIDTH_TILES = 8;
const MAP_HEIGHT_TILES = 6;

const MIN_SCALE = 0.1;
const MAX_SCALE = 2;

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

const tileSprites = {};

// --- Navigation state ---
let dragging = false;
let lastPos = null;
let targetX = 0;
let targetY = 0;


// --- Utils ---
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(val, max));
}

function getBounds() {
  const mapW = MAP_WIDTH_TILES * TILE_SIZE * world.scale.x;
  const mapH = MAP_HEIGHT_TILES * TILE_SIZE * world.scale.y;

  // Si la carte est plus petite que l'écran, on la centre
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

// --- Tiles loading ---
function loadVisibleTiles() {
  const viewBounds = {
    left: -world.x / world.scale.x,
    top: -world.y / world.scale.y,
    right: (-world.x + app.screen.width) / world.scale.x,
    bottom: (-world.y + app.screen.height) / world.scale.y,
  };

  const startCol = Math.floor(viewBounds.left / TILE_SIZE);
  const endCol = Math.ceil(viewBounds.right / TILE_SIZE);
  const startRow = Math.floor(viewBounds.top / TILE_SIZE);
  const endRow = Math.ceil(viewBounds.bottom / TILE_SIZE);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const key = `${row}_${col}`;
      if (tileSprites[key]) continue;
      if (row < 0 || col < 0 || row >= MAP_HEIGHT_TILES || col >= MAP_WIDTH_TILES) continue;

      const tilePath = `assets/tiles/${row}_${col}.png`;
      const sprite = PIXI.Sprite.from(tilePath);
      sprite.x = col * TILE_SIZE;
      sprite.y = row * TILE_SIZE;
      tileContainer.addChild(sprite);
      tileSprites[key] = sprite;
    }
  }
}
app.ticker.add(loadVisibleTiles);

// --- Drag & définition du point d'ancrage ---
app.view.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastPos = { x: e.clientX, y: e.clientY };
});

app.view.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastPos.x;
  const dy = e.clientY - lastPos.y;
  targetX += dx;
  targetY += dy;
  lastPos = { x: e.clientX, y: e.clientY };
  clampTarget();
});

['pointerup', 'pointerleave'].forEach(evt =>
  app.view.addEventListener(evt, () => dragging = false)
);

// --- Animation du déplacement ---
app.ticker.add(() => {
  world.x = lerp(world.x, targetX, 0.1);
  world.y = lerp(world.y, targetY, 0.1);
});

// --- Zoom molette centré sur la souris ---
app.view.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = app.view.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Position de la souris dans l'espace carte, calculée depuis targetX/targetY
  const mapX = (mouseX - targetX) / world.scale.x;
  const mapY = (mouseY - targetY) / world.scale.y;

  const zoomFactor = 1 - e.deltaY * 0.0015;
  const newScale = clamp(world.scale.x * zoomFactor, MIN_SCALE, MAX_SCALE);

  world.scale.set(newScale);

  // Recalcule targetX/targetY pour que le point sous la souris reste fixe
  targetX = mouseX - mapX * newScale;
  targetY = mouseY - mapY * newScale;
  clampTarget();

  // Snap immédiat : le zoom ne doit pas passer par le lerp
  world.x = targetX;
  world.y = targetY;
});

// --- Zoom boutons centré sur le milieu de l'écran ---
function setScaleAndClamp(newScale) {
  const clampedScale = clamp(newScale, MIN_SCALE, MAX_SCALE);

  const centerX = app.screen.width / 2;
  const centerY = app.screen.height / 2;

  const mapX = (centerX - targetX) / world.scale.x;
  const mapY = (centerY - targetY) / world.scale.y;

  world.scale.set(clampedScale);

  targetX = centerX - mapX * clampedScale;
  targetY = centerY - mapY * clampedScale;
  clampTarget();

  world.x = targetX;
  world.y = targetY;
}

document.getElementById('zoom-in').addEventListener('click', () => {
  setScaleAndClamp(world.scale.x * 1.1);
});

document.getElementById('zoom-out').addEventListener('click', () => {
  setScaleAndClamp(world.scale.x * 0.9);
});

// --- Centrage et zoom initial ---
function centerAndFitToScreen() {
  const scaleX = app.renderer.width / (MAP_WIDTH_TILES * TILE_SIZE);
  const scaleY = app.renderer.height / (MAP_HEIGHT_TILES * TILE_SIZE);
  const scale = Math.min(scaleX, scaleY);

  world.scale.set(scale);

  const mapWidthScaled = MAP_WIDTH_TILES * TILE_SIZE * scale;
  const mapHeightScaled = MAP_HEIGHT_TILES * TILE_SIZE * scale;

  world.x = (app.renderer.width - mapWidthScaled) / 2;
  world.y = (app.renderer.height - mapHeightScaled) / 2;
  targetX = world.x;
  targetY = world.y;

  // Définit l'ancre au centre de la carte
  anchor.x = (MAP_WIDTH_TILES * TILE_SIZE) / 2;
  anchor.y = (MAP_HEIGHT_TILES * TILE_SIZE) / 2;

  // Affiche le centre de la carte en coordonnées écran
  const centerMap = { x: anchor.x, y: anchor.y };
  const centerScreen = {
    x: world.x + centerMap.x * world.scale.x,
    y: world.y + centerMap.y * world.scale.y
  };
  console.log(`Centre de la carte (écran): (${centerScreen.x.toFixed(2)}, ${centerScreen.y.toFixed(2)})`);
}

centerAndFitToScreen();

window.addEventListener('resize', () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  centerAndFitToScreen();
});


// ... tout le code avant inchangé ...

// --- Chargement des zones d'interaction (PIXI v8) ---
fetch('assets/interactionZone.json')
  .then(res => res.json())
  .then(async zones => {
    // Récupère toutes les URLs d'images à charger
    const allFrames = [];
    zones.forEach(zone => {
      if (zone.image && Array.isArray(zone.imageRange)) {
        for (let i = zone.imageRange[0]; i <= zone.imageRange[1]; i++) {
          allFrames.push(`assets/${zone.image}/${zone.image}_${i}.png`);
        }
      }
    });

    // Charge toutes les images avec PIXI.Assets
    await PIXI.Assets.load(allFrames);

    // Toutes les images sont chargées, on peut créer les zones
    zones.forEach(zone => {
      const color = parseInt(zone.color.replace('#', ''), 16);
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color, 0.3);
      graphics.drawRect(0, 0, zone.width, zone.height);
      graphics.endFill();
      graphics.x = zone.x;
      graphics.y = zone.y;

      // Ajout du sprite animé si demandé
      let animatedSprite = null;
      if (zone.image && Array.isArray(zone.imageRange)) {
        const frames = [];
        for (let i = zone.imageRange[0]; i <= zone.imageRange[1]; i++) {
          frames.push(PIXI.Texture.from(`assets/${zone.image}/${zone.image}_${i}.png`));
        }
        animatedSprite = new PIXI.AnimatedSprite(frames);
        animatedSprite.width = zone.width;
        animatedSprite.height = zone.height;

        const fps = zone.fps && zone.fps > 0 ? zone.fps : 30;
        animatedSprite.animationSpeed = fps / 60;
        animatedSprite.loop = !!zone.loop;
        animatedSprite.visible = true;
        graphics.addChild(animatedSprite);

        // Gestion de la lecture
        let repeatCount = 0;
        function playAnimation() {
          if (zone.loop) {
            animatedSprite.loop = true;
            animatedSprite.play();
          } else if (zone.repeat && zone.repeat > 0) {
            animatedSprite.loop = false;
            repeatCount = 0;
            animatedSprite.gotoAndPlay(0);
            animatedSprite.onComplete = () => {
              repeatCount++;
              if (repeatCount < zone.repeat) {
                animatedSprite.gotoAndPlay(0);
              } else {
                animatedSprite.stop();
                animatedSprite.onComplete = null;
              }
            };
          } else {
            animatedSprite.loop = false;
            animatedSprite.gotoAndPlay(0);
          }
        }

        if (zone.autoplay) {
          playAnimation();
        }

        if (zone.playOnHover) {
          graphics.interactive = true;
          graphics.on('pointerover', () => playAnimation());
          graphics.on('pointerout', () => {
            animatedSprite.stop();
            animatedSprite.gotoAndStop(0);
            animatedSprite.onComplete = null;
          });
        }
      }

      // Interaction
      if (zone.clickable) {
        graphics.interactive = true;
        graphics.buttonMode = true;
        graphics.on('pointerdown', () => {
          alert(`Zone "${zone.image}" cliquée !`);
        });
      }

      tileContainer.addChild(graphics);
    });
  })
  .catch(err => {
    console.error('Erreur chargement des zones d\'interaction:', err);
  });