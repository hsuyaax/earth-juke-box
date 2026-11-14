import * as Tone from "tone";
import { FAMILY, COLORS, SCALES, makePool, makeDrone } from "../audio.js";
import { setPlayhead } from "../ripples.js";
import data from "./aerosols.data.js";

const STEPS = 32;

export default {
  ...data,
  title: "GEOS Aerosols",
  blurb: "Dust, smoke, and sea salt drifting around the planet.",
  svs: 5552, // flat-map version of the GEOS aerosol visualization (also SVS 5572, 5669)
  credit: "NASA's Scientific Visualization Studio, GEOS model by NASA's Global Modeling and Assimilation Office",
  bpm: 88,
  probe: { scale: SCALES.minorPent, root: 48, amount: "v", words: ["thin", "medium", "dense"] },
  caption(s) {
    const [, d, sm, sa] = s.classFracS;
    const top = [["dust", d], ["smoke", sm], ["sea salt", sa]].sort((a, b) => b[1] - a[1])[0];
    return top[1] < 0.01 ? "Clear air on most of the map." : `Mostly ${top[0]} right now.`;
  },
  notes: {
    shows: "Aerosols from NASA's GEOS model, August to September 2024: dust from the Sahara in lavender, smoke from fires in red-orange, sea salt from ocean winds in teal, sulfate in green.",
    hear: "A playhead sweeps west to east. Dust is gritty noise, smoke a low breathy tone, sea salt an airy hiss; higher on the map is higher, left and right follow the map, thicker is louder. A soft bed of noise swells with the total amount of dust and smoke.",
    listen: "The Saharan dust plume crossing the Atlantic in the middle; smoke over Africa and South America; sea salt along the stormy southern oceans. Sulfate (green) is silent.",
  },
  voices() {
    return {
      dust: makePool(FAMILY.dust, { color: COLORS.dust, scale: SCALES.minorPent, root: 60, size: 4 }),
      smoke: makePool(FAMILY.smoke, { color: COLORS.smoke, scale: SCALES.minorPent, root: 36, size: 4 }),
      salt: makePool(FAMILY.salt, { color: COLORS.salt, scale: SCALES.minorPent, root: 72, size: 4 }),
      bed: makeDrone(new Tone.Noise("brown"), { cutoff: 300 }),
    };
  },
  onBeat(s, v, time, beat) {
    const { W, H, cls } = s;
    const step = beat % STEPS, x0 = Math.floor((step * W) / STEPS), x1 = Math.floor(((step + 1) * W) / STEPS);
    Tone.getDraw().schedule(() => setPlayhead((x0 + x1) / 2 / W), time);
    v.bed.set(Math.min(0.12, (s.classFracS[1] + s.classFracS[2]) * 0.6), time);

    const hits = [];
    for (let x = x0; x < x1; x++) for (let y = 0; y < H; y++) if (cls[y * W + x]) hits.push(y * W + x);
    hits.sort((i, j) => s.v[j] - s.v[i]);
    for (const i of hits.slice(0, 3)) {
      const name = this.classes[cls[i] - 1].name;
      const x = ((i % W) + 0.5) / W, y = (Math.floor(i / W) + 0.5) / H;
      v[name](x, y, 0.25 + 0.6 * Math.min(1, (s.v[i] - 0.3) / 0.5), "8n", time);
    }
  },
};
