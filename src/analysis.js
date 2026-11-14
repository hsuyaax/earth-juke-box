// Frame reading and features (AGENTS.md §10). Writes state; never makes sound.
//
// Split in two so the same math runs in the browser and in Node (tests, calibration):
//   createEngine(rec)  pure: RGBA buffer + dt in, features out. No DOM, no allocation per frame.
//   createAnalyzer(video)  browser wrapper: grabs the map area of each decoded video frame.
//
// Downscale: the browser draws the map area at SS x the grid (smoothing "high"), then the engine box-averages
// each SS x SS block itself. A cell's color is the exact mean of its block (same in every browser), and
// `peak` keeps the brightest pixel so a one-pixel lightning dot is never averaged or aliased away.
//
// Time: all smoothing is time-based (alpha = 1 - exp(-dt / tau)), so results do not depend on frame or timer rate.
// Constants are expressed at the 15 Hz rate they were calibrated at.

export const MAX_FLASHES = 6;
export const SS = 4; // supersampling factor per grid cell
const CAL_DT = 1 / 15; // calibration tick
const tauOf = (alphaAtCal) => -CAL_DT / Math.log(1 - alphaAtCal); // convert a per-tick alpha to a time constant
const TAU = { slow: tauOf(0.1), motion: tauOf(0.5), rate: tauOf(0.033) }; // ≈ 0.63 s, 0.096 s, 2.0 s
const alpha = (dt, tau) => 1 - Math.exp(-dt / tau);

// HSV for one pixel into out: h 0..360, s 0..1, v 0..1. Reuses one buffer (no allocation per pixel).
const HSV = new Float32Array(3);
export function hsv(r, g, b, out = HSV) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  out[0] = h; out[1] = max ? d / max : 0; out[2] = max / 255;
  return out;
}

// Rec. 709 luma of 8-bit RGB, 0..1 (perceived brightness; used for flashes).
export const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const inRange = (val, [lo, hi]) => (lo <= hi ? val >= lo && val <= hi : val >= lo || val <= hi); // hue may wrap

// First class whose colorRange matches, as 1-based index; 0 = nothing detected.
// `off` (optional) is a per-class flag array: classes switched off by context are skipped.
export function classify(classes, h, s, v, off) {
  for (let k = 0; k < classes.length; k++) {
    if (off && off[k]) continue;
    const c = classes[k].colorRange;
    if ((!c.h || inRange(h, c.h)) && (!c.s || inRange(s, c.s)) && (!c.v || inRange(v, c.v))) return k + 1;
  }
  return 0;
}

// Pure engine for one record. analyze(px, dt, reset): px = RGBA of (W*SS) x (H*SS); dt = seconds since previous frame.
// Writes into `target` (cleared first) so callers can hold one stable state object across records.
export function createEngine(rec, target = {}) {
  const [W, H] = rec.grid, n = W * H, k = rec.classes.length + 1;
  const flashCls = rec.flash?.cls ? rec.classes.findIndex((c) => c.name === rec.flash.cls) + 1 : 0;
  // Context gates: a class with `requires: { cls, minFrac }` only counts while that other class covers at least
  // minFrac of the frame (smoothed). Example: night lights' orange means "less light" only on the change map.
  const gates = rec.classes.map((c) => c.requires ? { req: rec.classes.findIndex((o) => o.name === c.requires.cls) + 1, min: c.requires.minFrac } : null);
  const off = Uint8Array.from(gates, (g) => (g ? 1 : 0)); // gated classes start off until their context is seen
  for (const key of Object.keys(target)) delete target[key];
  const state = Object.assign(target, {
    W, H,
    v: new Float32Array(n), h: new Float32Array(n), s: new Float32Array(n), // HSV of the cell's mean color
    peak: new Float32Array(n), // brightest pixel luma in the cell
    motion: new Float32Array(n), avg: new Float32Array(n), jump: new Float32Array(n),
    cool: new Float32Array(n), cls: new Uint8Array(n), // cool = seconds left
    classFrac: new Float32Array(k), classFracS: new Float32Array(k),
    hueHist: new Float32Array(12), hueHistS: new Float32Array(12), bx: 0.5, by: 0.5,
    flashes: Array.from({ length: MAX_FLASHES }, () => ({ x: 0, y: 0, power: 0 })),
    nFlashes: 0, fired: 0, flashRate: 0, mean: 0, meanS: 0, meanMotion: 0, motionS: 0, ready: false,
  });

  function pushFlash(x, y, power) {
    const f = state.flashes;
    if (state.nFlashes < MAX_FLASHES) { const o = f[state.nFlashes++]; o.x = x; o.y = y; o.power = power; return; }
    let w = 0;
    for (let i = 1; i < MAX_FLASHES; i++) if (f[i].power < f[w].power) w = i;
    if (power > f[w].power) { f[w].x = x; f[w].y = y; f[w].power = power; }
  }

  function analyze(px, dt, reset) {
    dt = Math.min(Math.max(dt, 1 / 120), 0.5); // guard against stalls and duplicate timestamps
    const { v, h, s, peak, motion, avg, jump, cool, cls, classFrac, hueHist } = state;
    const aSlow = alpha(dt, TAU.slow), aMotion = alpha(dt, TAU.motion);
    const motionScale = CAL_DT / dt; // motion is a rate, expressed per calibration tick
    const avgA = rec.flash?.avgRate ? alpha(dt, tauOf(rec.flash.avgRate)) : aSlow;
    const rowStride = W * SS * 4, inv = 1 / (SS * SS);
    classFrac.fill(0); hueHist.fill(0);
    let sum = 0, msum = 0, mcount = 0, bxs = 0, bys = 0;
    const hasClasses = rec.classes.length > 0;

    for (let cy = 0, i = 0; cy < H; cy++) for (let cx = 0; cx < W; cx++, i++) {
      // exact box average of the SS x SS block, plus its brightest pixel
      let r = 0, g = 0, b = 0, pk = 0;
      for (let yy = 0; yy < SS; yy++) {
        let p = (cy * SS + yy) * rowStride + cx * SS * 4;
        for (let xx = 0; xx < SS; xx++, p += 4) {
          r += px[p]; g += px[p + 1]; b += px[p + 2];
          const l = 0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2];
          if (l > pk) pk = l;
        }
      }
      hsv(r * inv, g * inv, b * inv);
      const hh = HSV[0], ss = HSV[1], vv = HSV[2], pl = pk / 255;
      motion[i] = reset ? 0 : motion[i] + aMotion * (Math.abs(vv - v[i]) * motionScale - motion[i]);
      v[i] = vv; h[i] = hh; s[i] = ss;
      const c = (cls[i] = classify(rec.classes, hh, ss, vv, off));
      classFrac[c]++;
      sum += vv;
      hueHist[Math.floor(hh / 30) % 12] += ss * vv;
      bxs += vv * cx; bys += vv * cy;
      if (!hasClasses || c) { msum += motion[i]; mcount++; }
      // flashes ride on the brightest pixel, so a small new dot registers at full strength
      jump[i] = reset ? 0 : pl - avg[i];
      avg[i] = reset ? pl : avg[i] + avgA * (pl - avg[i]);
      peak[i] = pl;
    }

    let fired = 0;
    const f = rec.flash;
    if (f && !reset) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (cool[i] > 0) { cool[i] -= dt; continue; }
        const j = jump[i];
        if (j < f.jump || peak[i] < f.minV || (flashCls && cls[i] !== flashCls)) continue;
        let isPeak = true; // local max in 3x3, so one flash = one hit
        for (let dy = -1; dy <= 1 && isPeak; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if ((dx || dy) && xx >= 0 && yy >= 0 && xx < W && yy < H && jump[yy * W + xx] > j) { isPeak = false; break; }
        }
        if (!isPeak) continue;
        cool[i] = f.cooldown * CAL_DT; // cooldown was calibrated in ticks
        pushFlash((x + 0.5) / W, (y + 0.5) / H, Math.min(1, j / f.full));
        fired++;
      }
    }

    for (let c = 0; c < k; c++) {
      classFrac[c] /= n;
      state.classFracS[c] = reset ? classFrac[c] : state.classFracS[c] + aSlow * (classFrac[c] - state.classFracS[c]);
    }
    for (let b = 0; b < 12; b++) state.hueHistS[b] = reset ? hueHist[b] / n : state.hueHistS[b] + aSlow * (hueHist[b] / n - state.hueHistS[b]);
    for (let g = 0; g < gates.length; g++) if (gates[g]) off[g] = state.classFracS[gates[g].req] < gates[g].min ? 1 : 0;
    state.mean = sum / n;
    if (sum > 0) { state.bx = (bxs / sum + 0.5) / W; state.by = (bys / sum + 0.5) / H; }
    state.meanMotion = mcount ? msum / mcount : 0;
    state.meanS = reset ? state.mean : state.meanS + aSlow * (state.mean - state.meanS);
    state.motionS = reset ? 0 : state.motionS + aSlow * (state.meanMotion - state.motionS);
    state.fired = fired;
    state.flashRate += alpha(dt, TAU.rate) * (fired / dt - state.flashRate); // flashes per second, ~2 s window
    state.ready = true;
  }

  return { state, analyze };
}

// Browser wrapper: analyse each new decoded frame (requestVideoFrameCallback), at most ~15 times a second.
// Results stay cached while paused, so the probe keeps working (AGENTS.md §9).
export function createAnalyzer(video) {
  const canvas = document.createElement("canvas");
  const g = canvas.getContext("2d", { willReadFrequently: true });
  const state = {};
  let engine = null, rec = null, reset = true, lastMedia = -1, lastWall = 0;
  const listeners = [];

  function setRecord(r) {
    rec = r;
    engine = createEngine(r, state); // same object every record: readers keep one reference
    canvas.width = r.grid[0] * SS; canvas.height = r.grid[1] * SS;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    reset = true; lastMedia = -1;
  }

  // dt comes from media time (frame-accurate) when available, wall time otherwise (live streams).
  function frame(mediaTime) {
    if (!engine || video.readyState < 2) return;
    const now = performance.now() / 1000;
    const t = mediaTime ?? video.currentTime;
    if (lastMedia >= 0 && t < lastMedia - 0.5) reset = true; // loop wrapped
    let dt = lastMedia >= 0 && t > lastMedia ? t - lastMedia : now - lastWall;
    if (!reset && dt < 1 / 16) return; // cap at ~15 analyses per second
    if (video.srcObject) dt = now - lastWall; // live stream: media time is not meaningful
    lastMedia = t; lastWall = now;
    const m = rec.mapArea || { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight };
    g.drawImage(video, m.x, m.y, m.w, m.h, 0, 0, canvas.width, canvas.height);
    engine.analyze(g.getImageData(0, 0, canvas.width, canvas.height).data, reset ? CAL_DT : dt, reset);
    reset = false;
    listeners.forEach((fn) => fn());
  }

  // Drive by real decoded frames where supported; fall back to a timer that skips unchanged frames.
  if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
    const loop = (_now, meta) => { frame(meta.mediaTime); video.requestVideoFrameCallback(loop); };
    video.requestVideoFrameCallback(loop);
  } else {
    let lastT = -1;
    setInterval(() => {
      if (document.hidden) return;
      if (video.currentTime !== lastT || video.srcObject) { lastT = video.currentTime; frame(video.currentTime); }
    }, 66);
  }

  video.addEventListener("seeking", () => { reset = true; state.nFlashes = 0; });
  // A new source (record switch) needs a fresh frame callback chain in some browsers; re-arm on load.
  video.addEventListener("loadeddata", () => { reset = true; });
  return { state, setRecord, onFrame: (fn) => listeners.push(fn), tick: () => frame(video.currentTime) };
}
