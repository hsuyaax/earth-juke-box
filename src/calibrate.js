// Click a point: full-res pixel + what the analyzer computed for that cell.
import { createAnalyzer, hsv, classify } from "./analysis.js";
// Engine settings only (the data files): this page needs no audio.
import lightning from "./records/lightning.data.js";
import nightlights from "./records/nightlights.data.js";
import currents from "./records/currents.data.js";

const RECORDS = [lightning, nightlights, currents];
const video = document.getElementById("video"), out = document.getElementById("out"), pick = document.getElementById("pick");
const analyzer = createAnalyzer(video);
const s = analyzer.state;
const full = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
let rec;

const NAMES = { lightning: "Lightning from the ISS", nightlights: "Night Lights 2012–2023", currents: "Sea Surface Currents and Temperature" };
RECORDS.forEach((r, i) => pick.add(new Option(NAMES[r.id] || r.id, i)));
pick.addEventListener("change", () => load(+pick.value));
function load(i) { rec = RECORDS[i]; analyzer.setRecord(rec); video.src = rec.clip; }
video.addEventListener("seeked", () => analyzer.tick());
video.addEventListener("loadeddata", () => analyzer.tick());

video.addEventListener("click", (e) => {
  e.preventDefault();
  const r = video.getBoundingClientRect();
  const vx = Math.floor(((e.clientX - r.left) / r.width) * video.videoWidth);
  const vy = Math.floor(((e.clientY - r.top) / r.height) * video.videoHeight);
  full.canvas.width = video.videoWidth; full.canvas.height = video.videoHeight;
  full.drawImage(video, 0, 0);
  const [R, G, B] = full.getImageData(vx, vy, 1, 1).data;
  const [h, sat, v] = hsv(R, G, B, [0, 0, 0]);
  const m = rec.mapArea || { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight };
  const cx = Math.floor(((vx - m.x) / m.w) * s.W), cy = Math.floor(((vy - m.y) / m.h) * s.H);
  const i = cy * s.W + cx, ok = cx >= 0 && cy >= 0 && cx < s.W && cy < s.H;
  const name = (k) => (k ? rec.classes[k - 1].name : "none");
  out.textContent = [
    `t=${video.currentTime.toFixed(2)}s  video px (${vx}, ${vy})`,
    `pixel   RGB ${R},${G},${B}   H ${h.toFixed(0)}  S ${sat.toFixed(2)}  V ${v.toFixed(2)}   class: ${name(classify(rec.classes, h, sat, v))}`,
    ok ? `cell (${cx}, ${cy}) of ${s.W}x${s.H}   H ${s.h[i].toFixed(0)}  S ${s.s[i].toFixed(2)}  V ${s.v[i].toFixed(3)}  motion ${s.motion[i].toFixed(4)}  peak ${s.peak[i].toFixed(3)}  jump ${s.jump[i].toFixed(3)}   class: ${name(s.cls[i])}` : "outside map area",
    `frame   mean V ${s.mean.toFixed(3)}  mean motion ${s.meanMotion.toFixed(4)}  flash rate ${s.flashRate.toFixed(1)}/s`,
  ].join("\n");
});

load(0);
