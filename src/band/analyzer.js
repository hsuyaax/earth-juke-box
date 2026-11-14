// One analyzer per band member: its own video and its own pure engine (createEngine).
// Preferred path: the frame is handed to a Web Worker as an ImageBitmap; the worker draws it at SS x the grid and runs the
// engine, so the main thread (where Tone schedules audio) only pays for createImageBitmap. If the worker is still busy
// with the previous frame, this frame is skipped: a slow device sheds analyses instead of blocking the music.
// Fallback (no OffscreenCanvas): the same path as the jukebox wrapper, on the main thread.
// Both paths keep a rate cap that the page can lower, and count frame callbacks per second.
import { createEngine, SS, MAX_FLASHES } from "../analysis.js";

const CAL_DT = 1 / 15;
const canWork = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function";

export function createBandAnalyzer(video, rec) {
  const [W, H] = rec.grid, n = W * H;
  let reset = true, lastMedia = -1, lastWall = 0, minInterval = 1 / 15, busy = false;
  let callbacks = 0, analyses = 0, mainMs = 0, workerMs = 0, skipped = 0;
  let analyzeFrame, state;

  if (canWork) {
    // Mirror of the fields the band reads, filled from the worker's replies.
    state = { W, H, cls: new Uint8Array(n), motion: new Float32Array(n), v: new Float32Array(n), classFracS: new Float32Array(rec.classes.length + 1),
      flashes: Array.from({ length: MAX_FLASHES }, () => ({ x: 0, y: 0, power: 0 })), nFlashes: 0, flashRate: 0, motionS: 0, meanS: 0, bx: 0.5, by: 0.5, ready: false };
    const pushFlash = (x, y, power) => { // same rule as the engine: keep the strongest MAX_FLASHES until a beat takes them
      const f = state.flashes;
      if (state.nFlashes < MAX_FLASHES) { const o = f[state.nFlashes++]; o.x = x; o.y = y; o.power = power; return; }
      let w = 0; for (let i = 1; i < MAX_FLASHES; i++) if (f[i].power < f[w].power) w = i;
      if (power > f[w].power) { f[w].x = x; f[w].y = y; f[w].power = power; }
    };
    const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    worker.postMessage({ type: "init", rec: { grid: rec.grid, classes: rec.classes, flash: rec.flash } });
    worker.onmessage = ({ data: d }) => {
      state.cls.set(d.cls); state.motion.set(d.motion); state.v.set(d.v); state.classFracS.set(d.classFracS);
      for (const [x, y, p] of d.flashes) pushFlash(x, y, p);
      state.flashRate = d.flashRate; state.motionS = d.motionS; state.meanS = d.meanS; state.bx = d.bx; state.by = d.by; state.ready = true;
      workerMs += d.ms; analyses++; busy = false;
    };
    worker.onerror = () => { busy = false; };
    analyzeFrame = (dt, wasReset) => {
      busy = true;
      // Let the browser scale on the GPU to the analysis size; a browser that ignores the options sends the full frame and the worker scales it.
      createImageBitmap(video, { resizeWidth: W * SS, resizeHeight: H * SS, resizeQuality: "high" }).then((bitmap) => worker.postMessage({ bitmap, dt, reset: wasReset }, [bitmap]), () => { busy = false; });
    };
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = W * SS; canvas.height = H * SS;
    const g = canvas.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    const engine = createEngine(rec);
    state = engine.state;
    analyzeFrame = (dt, wasReset) => {
      g.drawImage(video, 0, 0, canvas.width, canvas.height); // band clips are already the map area
      engine.analyze(g.getImageData(0, 0, canvas.width, canvas.height).data, dt, wasReset);
      analyses++;
    };
  }

  function frame(mediaTime) {
    callbacks++;
    if (video.readyState < 2) return;
    const now = performance.now() / 1000, t = mediaTime ?? video.currentTime;
    if (lastMedia >= 0 && t < lastMedia - 0.5) reset = true; // loop wrapped
    const dt = lastMedia >= 0 && t > lastMedia ? t - lastMedia : now - lastWall;
    if (!reset && dt < minInterval * 0.9) return;
    if (busy) { skipped++; return; } // previous frame still in the worker
    lastMedia = t; lastWall = now;
    const t0 = performance.now();
    analyzeFrame(reset ? CAL_DT : Math.min(dt, 0.5), reset);
    mainMs += performance.now() - t0;
    reset = false;
  }

  if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
    const loop = (_now, meta) => { frame(meta.mediaTime); video.requestVideoFrameCallback(loop); };
    video.requestVideoFrameCallback(loop);
  } else {
    let lastT = -1;
    setInterval(() => { if (!document.hidden && video.currentTime !== lastT) { lastT = video.currentTime; frame(video.currentTime); } }, 66);
  }
  video.addEventListener("seeking", () => { reset = true; state.nFlashes = 0; });

  return {
    state, inWorker: canWork,
    tick: () => frame(video.currentTime),
    setMaxRate(hz) { minInterval = 1 / hz; },
    stats() { const r = { callbacks, analyses, skipped, mainMs, workerMs }; callbacks = analyses = skipped = 0; mainMs = workerMs = 0; return r; },
  };
}
