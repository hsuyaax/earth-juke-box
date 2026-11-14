// Self-check for the core picture math (no browser needed): HSV, class matching incl. hue wrap,
// and the per-record class ranges against colors sampled from the real clips.
import { hsv, classify } from "../src/analysis.js";

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

console.log("engine ok");
