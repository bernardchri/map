// ============================================================
//  DEV TOOLS — coordonnées, drag & drop zones, panel dev
// ============================================================
(function initDevTools() {
  if (!CONFIG.DEV) return;

  const canvas = document.getElementById('canvas-container');
  if (!canvas) return;

  canvas.style.cursor = 'crosshair';

  // ---- Badge "dev mode" ----
  const badge = document.createElement('div');
  badge.textContent = 'dev mode';
  Object.assign(badge.style, {
    position: 'fixed', top: '10px', left: '10px',
    background: '#000', color: '#0f0',
    fontFamily: 'monospace', fontSize: '12px',
    padding: '4px 10px', borderRadius: '4px',
    zIndex: '9999', pointerEvents: 'none',
    border: '1px solid #0f0',
    letterSpacing: '0.1em', textTransform: 'uppercase',
  });
  document.body.appendChild(badge);

  // ---- Toast éphémère ----
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)', color: '#0f0',
    fontFamily: 'monospace', fontSize: '14px',
    padding: '8px 16px', borderRadius: '6px',
    zIndex: '9999', opacity: '0',
    transition: 'opacity 0.2s', pointerEvents: 'none',
  });
  document.body.appendChild(toast);

  let hideTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.style.opacity = '1';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }

  // ---- Clic droit → copie coordonnées ----
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    const mapX = Math.round((e.clientX - world.x) / world.scale.x);
    const mapY = Math.round((e.clientY - world.y) / world.scale.y);
    const text = `"x": ${mapX}, "y": ${mapY}`;
    navigator.clipboard.writeText(text).then(() => showToast(`${text}  ✓ copié`));
  });

  // ---- Dev panel (DOM) ----
  const panel = document.createElement('div');
  panel.id = 'dev-zone-panel';
  Object.assign(panel.style, {
    position: 'fixed', top: '50px', right: '20px',
    background: '#111', color: '#0f0',
    fontFamily: 'monospace', fontSize: '13px',
    padding: '16px', borderRadius: '8px',
    zIndex: '10000', display: 'none',
    border: '1px solid #0f0', minWidth: '260px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  });
  document.body.appendChild(panel);

  let activeEntry = null; // { graphics, sprite, zone }

  function closePanel() {
    panel.style.display = 'none';
    activeEntry = null;
  }

  function copyZoneJson(zone) {
    const obj = {
      x: Math.round(zone.x),
      y: Math.round(zone.y),
      width: zone.width,
      height: zone.height,
      color: zone.color || '#00ff00',
      image: zone.image || '',
      imageRange: zone.imageRange || [0, 0],
      fps: zone.fps || 30,
      autoplay: !!zone.autoplay,
      loop: !!zone.loop,
      playOnHover: !!zone.playOnHover,
      clickable: !!zone.clickable,
      repeat: zone.repeat || 0,
      visible: zone.visible !== false,
    };
    const text = JSON.stringify(obj, null, 2);
    navigator.clipboard.writeText(text).then(() => showToast(`Zone "${zone.image}" ✓ copié`));
  }

  function buildPanel(entry) {
    const { zone, sprite, graphics } = entry;
    activeEntry = entry;

    const row = (label, input) => {
      const r = document.createElement('div');
      Object.assign(r.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
      const l = document.createElement('span');
      l.textContent = label;
      r.appendChild(l);
      r.appendChild(input);
      return r;
    };

    const makeNumber = (value, onChange) => {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = value;
      Object.assign(input.style, {
        width: '70px', background: '#222', color: '#0f0',
        border: '1px solid #333', borderRadius: '4px',
        padding: '4px 6px', fontFamily: 'monospace', fontSize: '12px',
      });
      input.addEventListener('change', () => onChange(parseFloat(input.value)));
      return input;
    };

    const makeCheckbox = (checked, onChange) => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = checked;
      input.style.accentColor = '#0f0';
      input.addEventListener('change', () => onChange(input.checked));
      return input;
    };

    const makeButton = (text, onClick) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      Object.assign(btn.style, {
        background: '#222', color: '#0f0', border: '1px solid #0f0',
        borderRadius: '4px', padding: '6px 12px', cursor: 'pointer',
        fontFamily: 'monospace', fontSize: '12px', marginRight: '6px',
      });
      btn.addEventListener('click', onClick);
      return btn;
    };

    panel.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.textContent = `▸ ${zone.image || 'zone'}`;
    Object.assign(title.style, { fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' });
    panel.appendChild(title);

    // Position (read-only, updated by drag)
    const posLabel = document.createElement('div');
    posLabel.id = 'dev-pos-label';
    posLabel.textContent = `x: ${Math.round(graphics.x)}  y: ${Math.round(graphics.y)}`;
    Object.assign(posLabel.style, { marginBottom: '10px', color: '#888' });
    panel.appendChild(posLabel);

    // Width
    panel.appendChild(row('width', makeNumber(zone.width, (v) => {
      zone.width = v;
      if (sprite) sprite.width = v;
      redrawBorder(graphics, zone);
    })));

    // Height
    panel.appendChild(row('height', makeNumber(zone.height, (v) => {
      zone.height = v;
      if (sprite) sprite.height = v;
      redrawBorder(graphics, zone);
    })));

    // FPS
    if (sprite) {
      panel.appendChild(row('fps', makeNumber(zone.fps || 30, (v) => {
        zone.fps = v;
        sprite.animationSpeed = v / 60;
      })));
    }

    // Loop
    if (sprite) {
      panel.appendChild(row('loop', makeCheckbox(!!zone.loop, (v) => {
        zone.loop = v;
        sprite.loop = v;
      })));
    }

    // Repeat
    if (sprite) {
      panel.appendChild(row('repeat', makeNumber(zone.repeat || 0, (v) => {
        zone.repeat = v;
      })));
    }

    // Visible
    panel.appendChild(row('visible', makeCheckbox(zone.visible !== false, (v) => {
      zone.visible = v;
      graphics.visible = v;
    })));

    // Buttons
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { marginTop: '12px', borderTop: '1px solid #333', paddingTop: '10px' });

    btnRow.appendChild(makeButton('📋 Copier coords', () => copyZoneJson({ x: graphics.x, y: graphics.y })));

    if (sprite) {
      btnRow.appendChild(makeButton('▶ Play', () => playAnimation(sprite, zone)));
      btnRow.appendChild(makeButton('⏹ Stop', () => { sprite.stop(); sprite.gotoAndStop(0); }));
    }

    const closeBtn = makeButton('✕ Fermer', closePanel);
    closeBtn.style.marginTop = '8px';
    closeBtn.style.display = 'block';
    closeBtn.style.width = '100%';
    btnRow.appendChild(closeBtn);

    panel.appendChild(btnRow);
    panel.style.display = 'block';
  }

  function redrawBorder(graphics, zone) {
    graphics.clear();
    graphics.lineStyle(2, 0xff0000, 1);
    graphics.drawRect(0, 0, zone.width, zone.height);
  }

  // ---- Wait for zones to be loaded, then attach interactions ----
  function waitForZones() {
    if (typeof devZones === 'undefined' || devZones.length === 0) {
      setTimeout(waitForZones, 200);
      return;
    }
    initZoneDev();
  }

  function initZoneDev() {
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };
    let isDraggingZone = false;

    devZones.forEach((entry) => {
      const { graphics } = entry;
      graphics.eventMode = 'static';
      graphics.cursor = 'grab';

      // Hit area for the full rectangle
      graphics.hitArea = new PIXI.Rectangle(0, 0, entry.zone.width, entry.zone.height);

      graphics.on('pointerdown', (e) => {
        e.stopPropagation();
        dragTarget = entry;
        isDraggingZone = true;
        devDraggingZone = true;
        graphics.cursor = 'grabbing';
        const pos = e.data.getLocalPosition(graphics.parent);
        dragOffset.x = pos.x - graphics.x;
        dragOffset.y = pos.y - graphics.y;

        // Also open panel
        buildPanel(entry);
      });
    });

    // Global move/up on the pixi stage
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    app.view.addEventListener('pointermove', (e) => {
      if (!isDraggingZone || !dragTarget) return;

      // Convert screen coords to map coords
      const mapX = (e.clientX - world.x) / world.scale.x;
      const mapY = (e.clientY - world.y) / world.scale.y;
      dragTarget.graphics.x = Math.round(mapX - dragOffset.x);
      dragTarget.graphics.y = Math.round(mapY - dragOffset.y);
      dragTarget.zone.x = dragTarget.graphics.x;
      dragTarget.zone.y = dragTarget.graphics.y;

      // Update position in panel
      const posLabel = document.getElementById('dev-pos-label');
      if (posLabel) posLabel.textContent = `x: ${dragTarget.zone.x}  y: ${dragTarget.zone.y}`;
    });

    app.view.addEventListener('pointerup', () => {
      if (isDraggingZone && dragTarget) {
        dragTarget.graphics.cursor = 'grab';
        copyZoneJson(dragTarget.zone);
      }
      isDraggingZone = false;
      devDraggingZone = false;
      dragTarget = null;
    });
  }

  waitForZones();

  // ---- POI drag & drop ----
  function waitForPois() {
    if (typeof devPois === 'undefined' || devPois.length === 0) {
      setTimeout(waitForPois, 200);
      return;
    }
    initPoiDev();
  }

  function initPoiDev() {
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };
    let isDraggingPoi = false;

    devPois.forEach((entry) => {
      const { container } = entry;
      container.cursor = 'grab';

      container.on('pointerdown', (e) => {
        e.stopPropagation();
        dragTarget = entry;
        isDraggingPoi = true;
        devDraggingZone = true;
        container.cursor = 'grabbing';
        const pos = e.data.getLocalPosition(container.parent);
        dragOffset.x = pos.x - container.x;
        dragOffset.y = pos.y - container.y;
      });
    });

    app.view.addEventListener('pointermove', (e) => {
      if (!isDraggingPoi || !dragTarget) return;
      const mapX = (e.clientX - world.x) / world.scale.x;
      const mapY = (e.clientY - world.y) / world.scale.y;
      dragTarget.container.x = Math.round(mapX - dragOffset.x);
      dragTarget.container.y = Math.round(mapY - dragOffset.y);
      dragTarget.poi.x = dragTarget.container.x;
      dragTarget.poi.y = dragTarget.container.y;
    });

    app.view.addEventListener('pointerup', () => {
      if (isDraggingPoi && dragTarget) {
        dragTarget.container.cursor = 'grab';
        const poi = dragTarget.poi;
        const text = JSON.stringify(poi, null, 2);
        navigator.clipboard.writeText(text).then(() => showToast(`POI "${poi.label}" — x: ${poi.x}, y: ${poi.y}  ✓ copié`));
      }
      isDraggingPoi = false;
      devDraggingZone = false;
      dragTarget = null;
    });
  }

  waitForPois();
})();
