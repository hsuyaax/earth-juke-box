// Band analysis worker: one per member. Draws each frame at SS x the grid on an OffscreenCanvas and runs the same pure
// engine as the jukebox (createEngine). Keeps the frame read-back and the maths off the main thread, where Tone schedules audio.
import { createEngine, SS } from "../analysis.js";

let engine = null, canvas = null, g = null;

self.onmessage = ({ data }) => {
  if (data.type === "init") {
    const [W, H] = data.rec.grid;
    engine = createEngine(data.rec);
    canvas = new OffscreenCanvas(W * SS, H * SS);
    g = canvas.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    return;
  }
  const t0 = performance.now();
  g.drawImage(data.bitmap, 0, 0, canvas.width, canvas.height);
  data.bitmap.close();
  engine.analyze(g.getImageData(0, 0, canvas.width, canvas.height).data, data.dt, data.reset);
  const s = engine.state;
  // Only what the band's onBeat functions read. Typed arrays are copied (small: at most 9216 cells).
  self.postMessage({
    W: s.W, H: s.H, cls: s.cls, motion: s.motion, v: s.v, classFracS: s.classFracS,
    flashes: s.flashes.slice(0, s.nFlashes).map((f) => [f.x, f.y, f.power]),
    flashRate: s.flashRate, motionS: s.motionS, meanS: s.meanS, ms: performance.now() - t0,
  });
  s.nFlashes = 0; // handed to the page, which keeps them until a beat uses them
};
