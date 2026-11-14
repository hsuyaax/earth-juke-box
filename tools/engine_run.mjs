// Run a real clip through the real engine (src/analysis.js) and print calibration statistics.
// Usage: node tools/engine_run.mjs <record id> [start s] [duration s] [fps]
// Same code path as the browser: ffmpeg decodes the map area at (W*SS)x(H*SS) with an area filter
// (the browser draws at that size with high-quality smoothing), then createEngine box-averages each block.
import { spawn } from "node:child_process";
import { createEngine, SS } from "../src/analysis.js";

export async function runClip(id, { start = 0, duration = 0, fps = 15, onFrame, override } = {}) {
  const base = (await import(`../src/records/${id}.data.js`)).default;
  const rec = override ? { ...base, ...override(base) } : base; // for threshold sweeps
  const [W, H] = rec.grid, fw = W * SS, fh = H * SS, frameBytes = fw * fh * 4;
  const crop = rec.mapArea ? `crop=${rec.mapArea.w}:${rec.mapArea.h}:${rec.mapArea.x}:${rec.mapArea.y},` : "";
  const args = ["-v", "error", ...(start ? ["-ss", String(start)] : []), "-i", new URL(`../public/${rec.clip}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
    ...(duration ? ["-t", String(duration)] : []), "-vf", `${crop}fps=${fps},scale=${fw}:${fh}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgba", "-"];
  const ff = spawn("ffmpeg", args);
  const engine = createEngine(rec);
  const buf = Buffer.alloc(frameBytes);
  let have = 0, n = 0;
  for await (const chunk of ff.stdout) {
    let off = 0;
    while (off < chunk.length) {
      const take = Math.min(frameBytes - have, chunk.length - off);
      chunk.copy(buf, have, off, off + take);
      have += take; off += take;
      if (have === frameBytes) {
        engine.analyze(buf, 1 / fps, n === 0);
        onFrame?.(engine.state, n / fps + start, rec);
        engine.state.nFlashes = 0; // the beat would consume these
        have = 0; n++;
      }
    }
  }
  return { rec, frames: n };
}

const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(p * (s.length - 1))]; };

if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  const [id = "lightning", start = "0", duration = "0", fps = "15"] = process.argv.slice(2);
  const fired = [], motion = [], frac = [], peakJumps = [], per10 = [];
  const { rec, frames } = await runClip(id, {
    start: +start, duration: +duration, fps: +fps,
    onFrame: (s, t, rec) => {
      fired.push(s.fired); motion.push(s.meanMotion); frac.push([...s.classFrac]);
      const bucket = Math.floor(t / 10); per10[bucket] = (per10[bucket] || 0) + s.fired;
      if (rec.flash) for (let i = 0; i < s.jump.length; i++) if (s.cls[i] && s.jump[i] > 0.02) peakJumps.push(s.jump[i]);
    },
  });
  const f3 = (x) => x.toFixed(4);
  console.log(`${id}: ${frames} frames at ${fps} fps, grid ${rec.grid.join("x")}`);
  if (rec.flash) {
    console.log(`flashes/frame p10/p50/p90/max: ${q(fired, 0.1)} ${q(fired, 0.5)} ${q(fired, 0.9)} ${Math.max(...fired)}`);
    console.log(`flashes per 10 s: ${per10.map((x) => x || 0).join(" ")}`);
    console.log(`jump (flash-class cells, >0.02) p50/p90/p99: ${f3(q(peakJumps, 0.5))} ${f3(q(peakJumps, 0.9))} ${f3(q(peakJumps, 0.99))}`);
  }
  console.log(`mean motion (classified cells) p10/p50/p90: ${f3(q(motion, 0.1))} ${f3(q(motion, 0.5))} ${f3(q(motion, 0.9))}`);
  rec.classes.forEach((c, k) => console.log(`class ${c.name}: mean fraction ${f3(frac.reduce((a, f) => a + f[k + 1], 0) / frac.length)}`));
}
