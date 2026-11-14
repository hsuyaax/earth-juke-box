// Regression check: real clips through the real engine (same code as the browser). Needs ffmpeg on PATH.
// Locks in the calibrated behaviour so a change to the engine or thresholds that breaks it fails loudly.
import { runClip } from "../tools/engine_run.mjs";

const assert = (c, m) => { if (!c) throw new Error("FAIL: " + m); console.log("ok  " + m); };

// Lightning: quiet start vs busy middle, and the 6-hits-per-beat cap is not saturated.
{
  const per10 = [], fired = [];
  await runClip("lightning", { onFrame: (s, t) => { fired.push(s.fired); const k = Math.floor(t / 10); per10[k] = (per10[k] || 0) + s.fired; } });
  const busy = Math.max(...per10), quiet = per10[0];
  let capped = 0, beats = 0;
  for (let i = 0; i + 5 <= fired.length; i += 5) { beats++; if (fired.slice(i, i + 5).reduce((a, b) => a + b, 0) >= 6) capped++; }
  assert(busy > 4 * quiet, `lightning: busiest 10 s (${busy}) is >4x the quiet start (${quiet})`);
  assert(busy / 10 > 8 && busy / 10 < 25, `lightning: busy rate ${busy / 10}/s within 8-25/s (rumble scaled to 15/s)`);
  assert(capped / beats < 0.3, `lightning: ${Math.round((100 * capped) / beats)}% of beats at the 6-hit cap (< 30%)`);
}

// Night lights: "less light" only on the change map; violet only on the change map.
{
  const series = [], change = [];
  await runClip("nightlights", { fps: 5, onFrame: (s, t) => {
    if (t < 7 || (t >= 22 && t < 34)) series.push([...s.classFrac]);
    if ((t >= 10 && t < 19) || t >= 37) change.push([...s.classFrac]);
  } });
  const mean = (rows, k) => rows.reduce((a, f) => a + f[k], 0) / rows.length;
  assert(mean(series, 2) < 0.001, `night lights: orange during yearly series ${mean(series, 2).toFixed(4)} (< 0.001)`);
  assert(mean(series, 1) < 0.002, `night lights: violet during yearly series ${mean(series, 1).toFixed(4)} (< 0.002)`);
  assert(mean(change, 1) > 0.01 && mean(change, 2) > 0.01, `night lights: change map has violet ${mean(change, 1).toFixed(4)} and orange ${mean(change, 2).toFixed(4)}`);
}

// Currents: tropics warm, high latitudes cold, land excluded.
{
  let warmMid = 0, warmEdge = 0, frames = 0, landCls = 0;
  await runClip("currents", { duration: 10, fps: 5, onFrame: (s) => {
    frames++;
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
      const i = y * s.W + x, lat = Math.abs(y / s.H - 0.5);
      if (s.cls[i] === 1) (lat < 0.15 ? warmMid++ : lat > 0.3 ? warmEdge++ : 0);
      if (s.s[i] < 0.15 && s.cls[i]) landCls++;
    }
  } });
  assert(warmMid > 10 * Math.max(1, warmEdge), `currents: warm water in tropics (${warmMid}) vs polar bands (${warmEdge})`);
  assert(landCls === 0, "currents: grey land never classified as water");
}
console.log("engine regression ok");
