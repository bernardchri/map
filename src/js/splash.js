// ============================================================
//  SPLASH SCREEN
// ============================================================
(function initSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  // CONFIG
  const CLOUD_COUNT = 50;
  const INITIAL_ZOOM = 4;        // zoom initial sur la carte (1 = pas de zoom)
  const ZOOM_DURATION = 3.3;        // durée du dézoom en secondes

  const rand = (min, max) => Math.random() * (max - min) + min;

  // Generate clouds with random sizes, positions, and drift directions
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'cloud';

    // Random size — mix of small, medium, large
    const size = rand(20, 70);            // vw units
    const aspect = rand(0.5, 1.2);        // height/width ratio
    const w = size;
    const h = size * aspect;

    // Random position covering the whole screen (with overflow)
    const cx = rand(-20, 100);            // % from left
    const cy = rand(-20, 100);            // % from top

    // Blur spread proportional to size
    const blur = Math.round(size * 1.2);
    const spread = Math.round(size * 0.6);

    el.style.cssText = `
      width: ${w}vw;
      height: ${h}vh;
      left: ${cx}%;
      top: ${cy}%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 ${blur}px ${spread}px white;
    `;

    // Compute drift direction: away from center
    const dx = cx - 50;
    const dy = cy - 50;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // Normalize and scale — farther drift for edge clouds
    const driftX = (dx / dist) * rand(80, 140);
    const driftY = (dy / dist) * rand(80, 140);

    // Random duration and delay for organic feel
    const duration = rand(1.2, 2.0);
    const delay = rand(0, 0.3);

    // Create unique keyframes for this cloud
    const animName = `drift-${i}`;
    const keyframes = `@keyframes ${animName} {
      to { transform: translate(calc(-50% + ${driftX}vw), calc(-50% + ${driftY}vh)); opacity: 0; }
    }`;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    el.dataset.anim = `${animName} ${duration.toFixed(2)}s ease-in ${delay.toFixed(2)}s forwards`;
    splash.appendChild(el);
  }

  // Map zoom — CSS transform on the canvas container
  const canvas = document.getElementById('canvas-container');
  if (canvas) {
    canvas.style.transition = 'none';
    canvas.style.transform = `scale(${INITIAL_ZOOM})`;
  }

  // 2.0s — fade out text
  setTimeout(() => {
    const text = document.getElementById('splash-text');
    if (text) text.classList.add('fade');
  }, 2000);

  // 2.2s — start zoom out to normal (just before clouds part)
  setTimeout(() => {
    if (canvas) {
      canvas.style.transition = `transform ${ZOOM_DURATION}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
      canvas.style.transform = 'scale(1)';
    }
  }, 2200);

  // 2.5s — clouds part
  setTimeout(() => {
    splash.classList.add('parting');
    splash.querySelectorAll('.cloud').forEach(c => {
      c.style.animation = c.dataset.anim;
    });
  }, 2500);

  // 5.5s — remove overlay + clean up canvas transform
  setTimeout(() => {
    splash.remove();
    if (canvas) {
      canvas.style.transition = '';
      canvas.style.transform = '';
    }
  }, 5500);
})();
