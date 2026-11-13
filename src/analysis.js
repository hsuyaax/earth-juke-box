// Frame reading and features (AGENTS.md §10). Writes state; never makes sound.
// All buffers are allocated in setRecord and reused every tick.

export const MAX_FLASHES = 6;

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

const inRange = (val, [lo, hi]) => (lo <= hi ? val >= lo && val <= hi : val >= lo || val <= hi); // hue may wrap

// First class whose colorRange matches, as 1-based index; 0 = nothing detected.
export function classify(classes, h, s, v) {
  for (let k = 0; k < classes.length; k++) {
    const c = classes[k].colorRange;
    if ((!c.h || inRange(h, c.h)) && (!c.s || inRange(s, c.s)) && (!c.v || inRange(v, c.v))) return k + 1;
  }
  return 0;
}

export function createAnalyzer(video) {
  const canvas = document.createElement("canvas");
  const g = canvas.getContext("2d", { willReadFrequently: true });
  const state = { W: 0, H: 0 };
  let rec, reset = true, lastT = 0;

  function setRecord(r) {
    rec = r;
    const [W, H] = r.grid;
    canvas.width = W; canvas.height = H;
    const n = W * H, k = r.classes.length + 1;
    Object.assign(state, {
      W, H,
      v: new Float32Array(n), h: new Float32Array(n), s: new Float32Array(n),
      motion: new Float32Array(n), avg: new Float32Array(n), jump: new Float32Array(n),
      cool: new Uint8Array(n), cls: new Uint8Array(n),
      classFrac: new Float32Array(k), classFracS: new Float32Array(k),
      flashes: Array.from({ length: MAX_FLASHES }, () => ({ x: 0, y: 0, power: 0 })),
      nFlashes: 0, flashRate: 0, mean: 0, meanS: 0, meanMotion: 0, motionS: 0, ready: false,
    });
    reset = true;
  }

  // Keep the strongest MAX_FLASHES flashes until the next beat takes them.
  function pushFlash(x, y, power) {
    const f = state.flashes;
    if (state.nFlashes < MAX_FLASHES) { Object.assign(f[state.nFlashes++], { x, y, power }); return; }
    let w = 0;
    for (let i = 1; i < MAX_FLASHES; i++) if (f[i].power < f[w].power) w = i;
    if (power > f[w].power) Object.assign(f[w], { x, y, power });
  }

  function tick() {
    if (!rec || video.readyState < 2) return;
    if (video.currentTime < lastT - 0.5) reset = true; // loop wrapped
    lastT = video.currentTime;
    const { W, H, v, h, s, motion, avg, jump, cool, cls, classFrac } = state;
    const m = rec.mapArea || { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight };
    g.drawImage(video, m.x, m.y, m.w, m.h, 0, 0, W, H);
    const px = g.getImageData(0, 0, W, H).data;

    classFrac.fill(0);
    let sum = 0, msum = 0, mcount = 0;
    const hasClasses = rec.classes.length > 0;
    for (let i = 0, p = 0; i < W * H; i++, p += 4) {
      hsv(px[p], px[p + 1], px[p + 2]);
      const hh = HSV[0], ss = HSV[1], vv = HSV[2];
      const dv = Math.abs(vv - v[i]);
      motion[i] = reset ? 0 : 0.5 * motion[i] + 0.5 * dv;
      v[i] = vv; h[i] = hh; s[i] = ss;
      const c = (cls[i] = classify(rec.classes, hh, ss, vv));
      classFrac[c]++;
      sum += vv;
      if (!hasClasses || c) { msum += motion[i]; mcount++; }
      jump[i] = reset ? 0 : vv - avg[i];
      avg[i] = reset ? vv : avg[i] + (rec.flash?.avgRate ?? 0.1) * (vv - avg[i]);
    }

    let fired = 0;
    const f = rec.flash;
    if (f && !reset) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (cool[i]) { cool[i]--; continue; }
        const j = jump[i];
        if (j < f.jump || v[i] < f.minV || (f.cls && rec.classes[cls[i] - 1]?.name !== f.cls)) continue;
        let peak = true; // local max in 3x3, so one flash = one hit
        for (let dy = -1; dy <= 1 && peak; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if ((dx || dy) && xx >= 0 && yy >= 0 && xx < W && yy < H && jump[yy * W + xx] > j) { peak = false; break; }
        }
        if (!peak) continue;
        cool[i] = f.cooldown;
        pushFlash((x + 0.5) / W, (y + 0.5) / H, Math.min(1, j / f.full));
        fired++;
      }
    }

    const n = W * H;
    for (let k = 0; k < classFrac.length; k++) {
      classFrac[k] /= n;
      state.classFracS[k] += 0.1 * (classFrac[k] - state.classFracS[k]);
    }
    state.mean = sum / n;
    state.meanMotion = mcount ? msum / mcount : 0;
    if (reset) { state.meanS = state.mean; state.motionS = 0; state.classFracS.set(classFrac); }
    else {
      state.meanS += 0.1 * (state.mean - state.meanS);
      state.motionS += 0.1 * (state.meanMotion - state.motionS);
    }
    state.flashRate += 0.033 * (fired * 15 - state.flashRate); // flashes/s over ~2 s
    state.ready = true;
    reset = false;
  }

  video.addEventListener("seeking", () => { reset = true; state.nFlashes = 0; });
  return { state, setRecord, tick };
}
