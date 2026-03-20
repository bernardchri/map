// ============================================================
//  DEV TOOLS — coordonnées, drag & drop zones/POI, panels, export, hot reload
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

  // ---- Shared UI helpers ----
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

  const makeText = (value, onChange) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    Object.assign(input.style, {
      width: '140px', background: '#222', color: '#0f0',
      border: '1px solid #333', borderRadius: '4px',
      padding: '4px 6px', fontFamily: 'monospace', fontSize: '12px',
    });
    input.addEventListener('change', () => onChange(input.value));
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

  function closePanel() { panel.style.display = 'none'; }

  // ---- Zone panel ----
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
      pingpong: !!zone.pingpong,
      playOnHover: !!zone.playOnHover,
      clickable: !!zone.clickable,
      repeat: zone.repeat || 0,
      frameOffset: zone.frameOffset || 0,
      loopDelay: zone.loopDelay || 0,
      visible: zone.visible !== false,
    };
    const text = JSON.stringify(obj, null, 2);
    navigator.clipboard.writeText(text).then(() => showToast(`Zone "${zone.image}" ✓ copié`));
  }

  function buildZonePanel(entry) {
    const { zone, sprite, graphics } = entry;

    panel.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.textContent = `▸ Zone: ${zone.image || 'zone'}`;
    Object.assign(title.style, { fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' });
    panel.appendChild(title);

    // Position
    const posLabel = document.createElement('div');
    posLabel.id = 'dev-pos-label';
    posLabel.textContent = `x: ${Math.round(graphics.x)}  y: ${Math.round(graphics.y)}`;
    Object.assign(posLabel.style, { marginBottom: '10px', color: '#888' });
    panel.appendChild(posLabel);

    panel.appendChild(row('width', makeNumber(zone.width, (v) => {
      zone.width = v;
      if (sprite) sprite.width = v;
      redrawBorder(graphics, zone);
    })));

    panel.appendChild(row('height', makeNumber(zone.height, (v) => {
      zone.height = v;
      if (sprite) sprite.height = v;
      redrawBorder(graphics, zone);
    })));

    if (sprite) {
      panel.appendChild(row('fps', makeNumber(zone.fps || 30, (v) => {
        zone.fps = v;
        sprite.animationSpeed = v / 60;
      })));
      panel.appendChild(row('loop', makeCheckbox(!!zone.loop, (v) => { zone.loop = v; sprite.loop = v; })));
      panel.appendChild(row('pingpong', makeCheckbox(!!zone.pingpong, (v) => { zone.pingpong = v; })));
      panel.appendChild(row('repeat', makeNumber(zone.repeat || 0, (v) => { zone.repeat = v; })));
      panel.appendChild(row('frameOffset', makeNumber(zone.frameOffset || 0, (v) => { zone.frameOffset = v; })));
      panel.appendChild(row('loopDelay', makeNumber(zone.loopDelay || 0, (v) => { zone.loopDelay = v; })));
    }

    panel.appendChild(row('visible', makeCheckbox(zone.visible !== false, (v) => {
      zone.visible = v;
      graphics.visible = v;
    })));

    // Buttons
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { marginTop: '12px', borderTop: '1px solid #333', paddingTop: '10px' });

    btnRow.appendChild(makeButton('Copy JSON', () => copyZoneJson(zone)));

    if (sprite) {
      btnRow.appendChild(makeButton('Play', () => playAnimation(sprite, zone)));
      btnRow.appendChild(makeButton('Stop', () => { sprite.stop(); sprite.gotoAndStop(0); }));
    }

    const closeBtn = makeButton('Fermer', closePanel);
    closeBtn.style.marginTop = '8px';
    closeBtn.style.display = 'block';
    closeBtn.style.width = '100%';
    btnRow.appendChild(closeBtn);

    panel.appendChild(btnRow);
    panel.style.display = 'block';
  }

  // ---- POI panel ----
  function buildPoiPanel(entry) {
    const { poi, container } = entry;

    panel.innerHTML = '';

    const title = document.createElement('div');
    title.textContent = `▸ POI: ${poi.label}`;
    Object.assign(title.style, { fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' });
    panel.appendChild(title);

    const posLabel = document.createElement('div');
    posLabel.id = 'dev-pos-label';
    posLabel.textContent = `x: ${Math.round(container.x)}  y: ${Math.round(container.y)}`;
    Object.assign(posLabel.style, { marginBottom: '10px', color: '#888' });
    panel.appendChild(posLabel);

    panel.appendChild(row('id', makeText(poi.id, (v) => { poi.id = v; })));
    panel.appendChild(row('label', makeText(poi.label, (v) => { poi.label = v; })));
    panel.appendChild(row('content', makeText(poi.content, (v) => { poi.content = v; })));

    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { marginTop: '12px', borderTop: '1px solid #333', paddingTop: '10px' });

    btnRow.appendChild(makeButton('Copy JSON', () => {
      const text = JSON.stringify(poi, null, 2);
      navigator.clipboard.writeText(text).then(() => showToast(`POI "${poi.label}" ✓ copié`));
    }));

    const closeBtn = makeButton('Fermer', closePanel);
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

  // ---- Export complet JSON ----
  function exportAllZones() {
    const data = devZones.map(({ zone }) => ({ ...zone }));
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text).then(() => showToast(`interactionZone.json (${data.length} zones) ✓ copié`));
  }

  function exportAllPois() {
    const data = devPois.map(({ poi }) => ({ ...poi }));
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text).then(() => showToast(`poi.json (${data.length} POIs) ✓ copié`));
  }

  // ---- Hot reload ----
  async function hotReload() {
    closePanel();
    await Promise.all([loadZones(), loadPois()]);
    showToast('Hot reload OK');
    // Re-attach dev interactions after reload
    setTimeout(() => { initZoneDev(); initPoiDev(); }, 300);
  }

  // ---- Toolbar (export + reload) ----
  const toolbar = document.createElement('div');
  Object.assign(toolbar.style, {
    position: 'fixed', bottom: '20px', right: '20px',
    display: 'flex', gap: '6px', zIndex: '10000',
  });

  toolbar.appendChild(makeButton('Export Zones', exportAllZones));
  toolbar.appendChild(makeButton('Export POIs', exportAllPois));

  const reloadBtn = makeButton('Reload JSON (R)', hotReload);
  toolbar.appendChild(reloadBtn);

  document.body.appendChild(toolbar);

  // Raccourci clavier R pour hot reload
  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT') {
      hotReload();
    }
  });

  // ---- Zone drag & drop ----
  let zoneDragTarget = null;
  let zoneDragOffset = { x: 0, y: 0 };
  let isDraggingZone = false;

  function initZoneDev() {
    devZones.forEach((entry) => {
      const { graphics } = entry;
      graphics.eventMode = 'static';
      graphics.cursor = 'grab';
      graphics.hitArea = new PIXI.Rectangle(0, 0, entry.zone.width, entry.zone.height);

      graphics.removeAllListeners('pointerdown');
      graphics.on('pointerdown', (e) => {
        e.stopPropagation();
        zoneDragTarget = entry;
        isDraggingZone = true;
        devDraggingZone = true;
        graphics.cursor = 'grabbing';
        const pos = e.data.getLocalPosition(graphics.parent);
        zoneDragOffset.x = pos.x - graphics.x;
        zoneDragOffset.y = pos.y - graphics.y;
        buildZonePanel(entry);
      });
    });
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  app.view.addEventListener('pointermove', (e) => {
    if (!isDraggingZone || !zoneDragTarget) return;
    const mapX = (e.clientX - world.x) / world.scale.x;
    const mapY = (e.clientY - world.y) / world.scale.y;
    zoneDragTarget.graphics.x = Math.round(mapX - zoneDragOffset.x);
    zoneDragTarget.graphics.y = Math.round(mapY - zoneDragOffset.y);
    zoneDragTarget.zone.x = zoneDragTarget.graphics.x;
    zoneDragTarget.zone.y = zoneDragTarget.graphics.y;
    const posLabel = document.getElementById('dev-pos-label');
    if (posLabel) posLabel.textContent = `x: ${zoneDragTarget.zone.x}  y: ${zoneDragTarget.zone.y}`;
  });

  app.view.addEventListener('pointerup', () => {
    if (isDraggingZone && zoneDragTarget) {
      zoneDragTarget.graphics.cursor = 'grab';
      copyZoneJson(zoneDragTarget.zone);
    }
    isDraggingZone = false;
    devDraggingZone = false;
    zoneDragTarget = null;
  });

  // ---- POI drag & drop ----
  let poiDragTarget = null;
  let poiDragOffset = { x: 0, y: 0 };
  let isDraggingPoi = false;

  function initPoiDev() {
    devPois.forEach((entry) => {
      const { container } = entry;
      container.cursor = 'grab';

      container.removeAllListeners('pointerdown');
      container.on('pointerdown', (e) => {
        e.stopPropagation();
        poiDragTarget = entry;
        isDraggingPoi = true;
        devDraggingZone = true;
        container.cursor = 'grabbing';
        const pos = e.data.getLocalPosition(container.parent);
        poiDragOffset.x = pos.x - container.x;
        poiDragOffset.y = pos.y - container.y;
        buildPoiPanel(entry);
      });
    });
  }

  app.view.addEventListener('pointermove', (e) => {
    if (!isDraggingPoi || !poiDragTarget) return;
    const mapX = (e.clientX - world.x) / world.scale.x;
    const mapY = (e.clientY - world.y) / world.scale.y;
    poiDragTarget.container.x = Math.round(mapX - poiDragOffset.x);
    poiDragTarget.container.y = Math.round(mapY - poiDragOffset.y);
    poiDragTarget.poi.x = poiDragTarget.container.x;
    poiDragTarget.poi.y = poiDragTarget.container.y;
    const posLabel = document.getElementById('dev-pos-label');
    if (posLabel) posLabel.textContent = `x: ${poiDragTarget.poi.x}  y: ${poiDragTarget.poi.y}`;
  });

  app.view.addEventListener('pointerup', () => {
    if (isDraggingPoi && poiDragTarget) {
      poiDragTarget.container.cursor = 'grab';
      const poi = poiDragTarget.poi;
      const text = JSON.stringify(poi, null, 2);
      navigator.clipboard.writeText(text).then(() => showToast(`POI "${poi.label}" — x: ${poi.x}, y: ${poi.y}  ✓ copié`));
    }
    isDraggingPoi = false;
    devDraggingZone = false;
    poiDragTarget = null;
  });

  // ---- Wait & init ----
  function waitForZones() {
    if (typeof devZones === 'undefined' || devZones.length === 0) {
      setTimeout(waitForZones, 200);
      return;
    }
    initZoneDev();
  }

  function waitForPois() {
    if (typeof devPois === 'undefined' || devPois.length === 0) {
      setTimeout(waitForPois, 200);
      return;
    }
    initPoiDev();
  }

  waitForZones();
  waitForPois();
})();
