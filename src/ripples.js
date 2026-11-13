// "See the sound": one ring per note at its source (AGENTS.md D6).
const canvas = document.getElementById("ripples");
const g = canvas.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const LIFE = 600;
let ripples = [];
let view = { x: 0, y: 0, w: 1, h: 1, vw: 1, vh: 1 }; // map area in video px + video size
let playhead = null; // 0..1 map x, or null
let probe = null; // { x0, y0, x1, y1 } in map coords, or null

export function setView(mapArea, vw, vh) { view = { ...mapArea, vw, vh }; ripples = []; playhead = null; }
export function setPlayhead(x) { playhead = x; }
export function setProbe(box) { probe = box; }
export function clearRipples() { ripples = []; playhead = null; }

// Map coords (0..1 inside the map area) -> canvas px.
export function toCanvas(x, y) {
  return [
    ((view.x + x * view.w) / view.vw) * canvas.width,
    ((view.y + y * view.h) / view.vh) * canvas.height,
  ];
}

export function addRipple(x, y, color, vel = 1) {
  if (ripples.length > 60) ripples.shift();
  ripples.push({ x, y, color, vel, born: performance.now() });
}

new ResizeObserver(() => {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * devicePixelRatio);
  canvas.height = Math.round(r.height * devicePixelRatio);
}).observe(canvas);

function frame(now) {
  g.clearRect(0, 0, canvas.width, canvas.height);
  const unit = canvas.width / 60;
  if (playhead !== null) {
    const [px] = toCanvas(playhead, 0);
    const [, top] = toCanvas(0, 0);
    const [, bot] = toCanvas(0, 1);
    g.fillStyle = "rgba(244,239,230,0.35)";
    g.fillRect(px, top, Math.max(1, devicePixelRatio), bot - top);
  }
  if (probe) {
    const [ax, ay] = toCanvas(probe.x0, probe.y0), [bx, by] = toCanvas(probe.x1, probe.y1);
    g.strokeStyle = "#FFC25C";
    g.lineWidth = Math.max(2, devicePixelRatio * 2);
    g.strokeRect(ax, ay, bx - ax, by - ay);
  }
  ripples = ripples.filter((r) => now - r.born < LIFE);
  for (const r of ripples) {
    const t = (now - r.born) / LIFE;
    const [cx, cy] = toCanvas(r.x, r.y);
    g.globalAlpha = (1 - t) * (0.5 + 0.5 * r.vel);
    if (reduced.matches) {
      g.fillStyle = r.color;
      g.beginPath();
      g.arc(cx, cy, unit * 0.5, 0, Math.PI * 2);
      g.fill();
    } else {
      g.strokeStyle = r.color;
      g.lineWidth = Math.max(2, unit * 0.18);
      g.beginPath();
      g.arc(cx, cy, unit * (0.3 + 1.7 * t), 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
