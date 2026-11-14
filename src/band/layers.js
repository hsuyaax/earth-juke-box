// "See the sound" for the band: one ripple layer per member, each in that member's color.
// The jukebox's ripples.js is a single-canvas module, so the band has its own small multi-layer version.
// One animation loop for all layers; it draws only while something is changing.
const LIFE = 600;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const layers = [];
let running = false;

function loop(now) {
  let busy = false;
  for (const L of layers) {
    if (!L.dirty && !L.rings.length) continue;
    L.dirty = false;
    const { g, canvas } = L, unit = canvas.width / 60;
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (L.playhead !== null) {
      g.fillStyle = "rgba(244,239,230,0.35)";
      g.fillRect(L.playhead * canvas.width, 0, Math.max(1, devicePixelRatio), canvas.height);
    }
    L.rings = L.rings.filter((r) => now - r.born < LIFE);
    for (const r of L.rings) {
      const t = (now - r.born) / LIFE, cx = r.x * canvas.width, cy = r.y * canvas.height;
      g.globalAlpha = (1 - t) * (0.5 + 0.5 * r.vel);
      g.beginPath();
      if (reduced.matches) { g.fillStyle = L.color; g.arc(cx, cy, unit * 0.5, 0, Math.PI * 2); g.fill(); }
      else { g.strokeStyle = L.color; g.lineWidth = Math.max(2, unit * 0.18); g.arc(cx, cy, unit * (0.3 + 1.7 * t), 0, Math.PI * 2); g.stroke(); }
    }
    g.globalAlpha = 1;
    if (L.rings.length) busy = true;
  }
  if (busy) requestAnimationFrame(loop); else running = false;
}
const wake = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

export function createLayer(canvas, color) {
  const L = { canvas, g: canvas.getContext("2d"), color, rings: [], playhead: null, dirty: true };
  new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * devicePixelRatio); canvas.height = Math.round(r.height * devicePixelRatio);
    L.dirty = true; wake();
  }).observe(canvas);
  layers.push(L);
  return {
    ripple(x, y, vel = 1) { if (L.rings.length > 40) L.rings.shift(); L.rings.push({ x, y, vel, born: performance.now() }); wake(); },
    playhead(x) { if (x !== L.playhead) { L.playhead = x; L.dirty = true; wake(); } },
    clear() { L.rings = []; L.playhead = null; L.dirty = true; wake(); },
  };
}
