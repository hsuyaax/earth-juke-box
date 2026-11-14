// Self-check for the core picture math (no browser needed): HSV, class matching incl. hue wrap,
// and the per-record class ranges against colors sampled from the real clips.
import { hsv, classify, createEngine, SS } from "../src/analysis.js";

const assert = (c, m) => { if (!c) throw new Error("FAIL: " + m); };
const near = (a, b, e = 1) => Math.abs(a - b) <= e;

// hsv: primaries, grey, black
let [h, s, v] = hsv(255, 0, 0, [0, 0, 0]); assert(near(h, 0) && s === 1 && v === 1, "red");
[h, s, v] = hsv(0, 255, 0, [0, 0, 0]); assert(near(h, 120), "green hue");
[h, s, v] = hsv(0, 0, 255, [0, 0, 0]); assert(near(h, 240), "blue hue");
[h, s, v] = hsv(128, 128, 128, [0, 0, 0]); assert(s === 0 && near(v, 0.502, 0.01), "grey");
[h, s, v] = hsv(0, 0, 0, [0, 0, 0]); assert(s === 0 && v === 0, "black");
[h] = hsv(255, 0, 64, [0, 0, 0]); assert(h > 340 && h < 360, "magenta-red wraps near 360");

// classify: first match wins, 0 = nothing, hue ranges that wrap past 360
const classes = [
  { colorRange: { h: [350, 32], s: [0.25, 1], v: [0.1, 1] } }, // wraps: 350..360 and 0..32
  { colorRange: { h: [32, 70], s: [0.15, 1], v: [0.1, 1] } },
  { colorRange: { s: [0, 0.15], v: [0.3, 1] } }, // no hue: bright grey
];
assert(classify(classes, 355, 0.5, 0.5) === 1, "wrap high side");
assert(classify(classes, 10, 0.5, 0.5) === 1, "wrap low side");
assert(classify(classes, 200, 0.5, 0.5) === 0, "outside wrap");
assert(classify(classes, 32, 0.5, 0.5) === 1, "boundary goes to first match");
assert(classify(classes, 50, 0.5, 0.05) === 0, "too dark");
assert(classify(classes, 0, 0.05, 0.6) === 3, "bright grey has no hue requirement");

// Lightning range vs colors measured from the clip (BUILD_PLAN T4). Records import Tone (browser-only), so the range is copied here.
const lightningDot = [{ colorRange: { h: [38, 72], s: [0.35, 1], v: [0.12, 1] } }];
assert(classify(lightningDot, 55, 0.6, 0.4) === 1, "lightning dot (hue ~50-60) matches");
assert(classify(lightningDot, 0, 0.05, 0.25) === 0, "grey land is not lightning");
assert(classify(lightningDot, 240, 0.95, 0.01) === 0, "dark ocean is not lightning");

// Engine on synthetic frames (W=2, H=1 grid; each cell is SS x SS pixels).
const mk = (fill) => { const px = new Uint8ClampedArray(2 * SS * SS * 4); for (let y = 0; y < SS; y++) for (let x = 0; x < 2 * SS; x++) { const p = (y * 2 * SS + x) * 4; const [r, g, b] = fill(x, y); px[p] = r; px[p + 1] = g; px[p + 2] = b; px[p + 3] = 255; } return px; };
const rec = { grid: [2, 1], classes: [] };

// One white pixel in an otherwise black cell: mean stays dark, peak keeps the dot (no aliasing it away).
{
  const e = createEngine(rec);
  e.analyze(mk((x, y) => (x === 1 && y === 1 ? [255, 255, 255] : [0, 0, 0])), 1 / 15, true);
  assert(near(e.state.v[0], 1 / (SS * SS), 0.01) && e.state.peak[0] > 0.99, "box mean dilutes a 1-px dot, peak keeps it");
  assert(e.state.v[1] === 0 && e.state.peak[1] === 0, "neighbouring cell untouched");
}

// Frame-rate independence: two frames at 1/30 s smooth the same as one frame at 1/15 s.
{
  const dark = mk(() => [0, 0, 0]), bright = mk(() => [255, 255, 255]);
  const a = createEngine(rec), b = createEngine(rec);
  a.analyze(dark, 1 / 15, true); b.analyze(dark, 1 / 15, true);
  a.analyze(bright, 1 / 15, false);
  b.analyze(bright, 1 / 30, false); b.analyze(bright, 1 / 30, false);
  assert(near(a.state.meanS, b.state.meanS, 1e-6), `smoothing is frame-rate independent (${a.state.meanS.toFixed(4)} vs ${b.state.meanS.toFixed(4)})`);
}

// Context gate: a class with `requires` is off until the required class has covered enough of the frame.
{
  const gated = { grid: [2, 1], classes: [
    { name: "violet", colorRange: { h: [250, 345], s: [0.15, 1], v: [0.1, 1] } },
    { name: "orange", colorRange: { h: [350, 32], s: [0.25, 1], v: [0.1, 1] }, requires: { cls: "violet", minFrac: 0.4 } },
  ] };
  const orangeOnly = mk(() => [220, 120, 60]), half = mk((x) => (x < SS ? [150, 90, 230] : [220, 120, 60]));
  const e = createEngine(gated);
  e.analyze(orangeOnly, 1 / 15, true); e.analyze(orangeOnly, 1 / 15, false);
  assert(e.state.cls[0] === 0, "orange without violet on screen is not 'less light'");
  for (let i = 0; i < 20; i++) e.analyze(half, 1 / 15, i === 0);
  assert(e.state.cls[0] === 1 && e.state.cls[1] === 2, "with violet on screen, orange counts");
}

console.log("engine ok");
