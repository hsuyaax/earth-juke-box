import * as Tone from "tone";
import { FAMILY, COLORS, SCALES, makePool, makeDrone } from "../audio.js";
import { setPlayhead } from "../ripples.js";

const STEPS = 32; // 4 bars of eighth notes to cross the map

export default {
  id: "nightlights",
  title: "Night Lights 2012–2023",
  blurb: "Where the world is lit, and where it gained or lost light.",
  svs: 5313,
  credit: "NASA's Scientific Visualization Studio",
  clip: "/clips/nightlights.mp4",
  mapArea: null, // clip is pre-cropped to one world map (left half of the EIC frame)
  grid: [128, 72],
  bpm: 96,
  // Sampled from the clip at 128x72 (BUILD_PLAN T4). Dim terrain sits below v 0.10; grey land has s < 0.15.
  classes: [
    { name: "violet", label: "more light", colorRange: { h: [250, 345], s: [0.15, 1], v: [0.08, 1] }, soundFamily: "pluckA", kind: "sustained" },
    { name: "orange", label: "less light", colorRange: { h: [350, 32], s: [0.25, 1], v: [0.1, 1] }, soundFamily: "pluckB", kind: "sustained" },
    { name: "light", label: "city lights", colorRange: { h: [32, 70], s: [0.15, 1], v: [0.1, 1] }, soundFamily: "pluckA", kind: "sustained" },
    { name: "light", label: "city lights", colorRange: { s: [0, 0.15], v: [0.3, 1] }, soundFamily: "pluckA", kind: "sustained" },
  ],
  probe: { scale: SCALES.majorPent, root: 48, amount: "v" },
  caption(s) {
    const f = s.classFracS, lit = f[1] + f[2] + f[3] + f[4]; // violet only appears in the change map
    if (f[1] > 0.003) return `Change map: ${f[1] >= f[2] ? "more places gained light" : "more places lost light"}.`;
    return lit > 0.05 ? "Many lights on screen." : lit > 0.015 ? "Scattered city lights." : "Mostly dark.";
  },
  notes: {
    shows: "Earth at night from the VIIRS instrument, year by year from 2012 to 2023, then a change map: violet where light grew, orange where it faded, with zooms on Western Europe, the Eastern Mediterranean, Ukraine, and India.",
    hear: "A playhead sweeps west to east. Each lit place plays a pluck: higher on the map is a higher note, left and right follow the map. A bright bell pluck means light or more light; a soft round pluck means less light. A low pad swells as the whole planet gets brighter.",
    listen: "Busy, dense passages over Europe, India, and East Asia; near silence over the oceans; the change from one pluck to two in the change map.",
  },
  voices() {
    return {
      a: makePool(FAMILY.pluckA, { color: COLORS.pluckA, scale: SCALES.majorPent, root: 48 }),
      b: makePool(FAMILY.pluckB, { color: COLORS.pluckB, scale: SCALES.majorPent, root: 48 }),
      pad: makeDrone(new Tone.FatOscillator("C2", "triangle", 20), { cutoff: 500 }),
    };
  },
  onBeat(s, v, time, beat) {
    const { W, H, cls } = s;
    const step = beat % STEPS, x0 = Math.floor((step * W) / STEPS), x1 = Math.floor(((step + 1) * W) / STEPS);
    Tone.getDraw().schedule(() => setPlayhead((x0 + x1) / 2 / W), time);
    v.pad.set(Math.min(0.3, s.meanS * 2.5), time);

    const hits = [];
    for (let x = x0; x < x1; x++) for (let y = 0; y < H; y++) if (cls[y * W + x]) hits.push(y * W + x);
    hits.sort((i, j) => s.v[j] - s.v[i]);
    for (const i of hits.slice(0, 4)) {
      const name = this.classes[cls[i] - 1].name;
      const x = ((i % W) + 0.5) / W, y = (Math.floor(i / W) + 0.5) / H;
      const vel = 0.25 + 0.6 * Math.min(1, (s.v[i] - 0.08) / 0.4);
      if (name === "orange") v.b(x, y, vel, "8n", time);
      else v.a(x, y, vel, "8n", time, name === "violet" ? COLORS.pluckA : COLORS.light);
    }
  },
};
