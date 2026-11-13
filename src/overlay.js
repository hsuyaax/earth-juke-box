// "What the engine sees": the analysis grid, one pixel per cell, scaled up over the map area.
import { COLORS } from "./audio.js";

const canvas = document.getElementById("overlay");
const g = canvas.getContext("2d");
let img, rgb = [];
export let overlayOn = false;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export function setOverlayRecord(rec, vw, vh) {
  const [W, H] = rec.grid;
  canvas.width = W; canvas.height = H;
  img = g.createImageData(W, H);
  rgb = rec.classes.map((c) => hex(COLORS[c.name] || COLORS[c.soundFamily]));
  const m = rec.mapArea || { x: 0, y: 0, w: vw, h: vh };
  Object.assign(canvas.style, {
    left: `${(m.x / vw) * 100}%`, top: `${(m.y / vh) * 100}%`,
    width: `${(m.w / vw) * 100}%`, height: `${(m.h / vh) * 100}%`,
  });
}

export function toggleOverlay(on = !overlayOn) {
  overlayOn = on;
  canvas.hidden = !on;
  return on;
}

// Class cells in their voice color; everything else as grey brightness; motion adds white.
export function drawOverlay(s) {
  if (!overlayOn || !img || !s.ready) return;
  const d = img.data;
  for (let i = 0, p = 0; i < s.W * s.H; i++, p += 4) {
    const c = s.cls[i], m = Math.min(1, s.motion[i] * 20);
    if (c) { const [r, gg, b] = rgb[c - 1]; d[p] = r; d[p + 1] = gg; d[p + 2] = b; d[p + 3] = 200; }
    else { const l = 40 + 215 * s.v[i]; d[p] = d[p + 1] = d[p + 2] = l; d[p + 3] = 90; }
    if (m > 0.2) { d[p] = d[p + 1] = d[p + 2] = 255; d[p + 3] = 120 + 135 * m; }
  }
  g.putImageData(img, 0, 0);
}
