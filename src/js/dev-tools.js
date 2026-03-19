// ============================================================
//  DEV TOOLS — clic droit → copie coordonnées map
// ============================================================
(function initDevTools() {
  if (!CONFIG.DEV) return;

  const canvas = document.getElementById('canvas-container');
  if (!canvas) return;

  canvas.style.cursor = 'crosshair';

  // Badge "dev mode"
  const badge = document.createElement('div');
  badge.textContent = 'dev mode';
  Object.assign(badge.style, {
    position: 'fixed',
    top: '10px',
    left: '10px',
    background: '#000',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '4px',
    zIndex: '9999',
    pointerEvents: 'none',
    border: '1px solid #0f0',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  });
  document.body.appendChild(badge);

  // Toast éphémère
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '8px 16px',
    borderRadius: '6px',
    zIndex: '9999',
    opacity: '0',
    transition: 'opacity 0.2s',
    pointerEvents: 'none',
  });
  document.body.appendChild(toast);

  let hideTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.style.opacity = '1';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
  }

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();

    const mapX = Math.round((e.clientX - world.x) / world.scale.x);
    const mapY = Math.round((e.clientY - world.y) / world.scale.y);
    const text = `"x": ${mapX}, "y": ${mapY}`;

    navigator.clipboard.writeText(text).then(() => {
      showToast(`${text}  ✓ copié`);
    });
  });
})();
