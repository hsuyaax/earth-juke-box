import * as Tone from "tone";
import { FAMILY, COLORS, SCALES, makePool, makeDrone } from "../audio.js";
import { setPlayhead } from "../ripples.js";

const STEPS = 32;
const CALM = 0.0019; // median water motion measured on the clip at 96x48, 15 ticks/s

export default {
  id: "currents",
  title: "Sea Surface Currents and Temperature",
  blurb: "Warm and cold water, and how fast the sea is moving.",
  svs: 3912,
  credit: "NASA/Goddard Space Flight Center Scientific Visualization Studio",
  clip: "/clips/currents.mp4",
  mapArea: null, // full frame is the 2:1 world map
  grid: [96, 48],
  bpm: 96,
  // Colorbar: blue 0 °C, green 10–20 °C, yellow ~25 °C, red 32 °C. Sampled: land is grey (s < 0.15), water s > 0.6.
  classes: [
    { name: "warm", label: "warm water", colorRange: { h: [345, 70], s: [0.4, 1], v: [0.04, 1] }, soundFamily: "warm", kind: "sustained" },
    { name: "cold", label: "cold water", colorRange: { h: [70, 250], s: [0.4, 1], v: [0.04, 1] }, soundFamily: "cold", kind: "sustained" },
  ],
  probe: { scale: SCALES.majorPent, root: 45, amount: "motion", full: 0.01, words: ["calm", "moving", "fast"] },
  caption(s) {
    const w = s.classFracS[1], c = s.classFracS[2];
    return `${w > c ? "More warm water than cold" : "More cold water than warm"}; the sea is ${s.motionS < CALM ? "calm" : "busy"}.`;
  },
  notes: {
    shows: "Ocean surface currents from the ECCO2 model, June 2005 to December 2007, as streaks colored by sea surface temperature: red and yellow are warm, green and blue are cold. Land is grey.",
    hear: "Two held tones: a soft warm pad grows louder the more warm water is on screen, a glassy bell the more cold water. A playhead sweeps west to east and plays the fastest-moving water in each strip: warm water as a soft flute, cold water as a bell. The busier the sea, the busier the melody.",
    listen: "Fast runs near the Gulf Stream and the Kuroshio; the flute in the tropics and bells near the poles.",
  },
  voices() {
    return {
      warm: makePool(FAMILY.warm, { color: COLORS.warm, scale: SCALES.majorPent, root: 45 }),
      cold: makePool(FAMILY.cold, { color: COLORS.cold, scale: SCALES.majorPent, root: 45 }),
      warmPad: makeDrone(new Tone.FatOscillator("A2", "triangle", 25), { cutoff: 700 }),
      coldPad: makeDrone(new Tone.FMOscillator({ frequency: "E5", harmonicity: 3.5, modulationIndex: 2 }), { cutoff: 4000 }),
    };
  },
  onBeat(s, v, time, beat) {
    const { W, H, cls, motion } = s;
    const step = beat % STEPS, x0 = Math.floor((step * W) / STEPS), x1 = Math.floor(((step + 1) * W) / STEPS);
    Tone.getDraw().schedule(() => setPlayhead((x0 + x1) / 2 / W), time);
    v.warmPad.set(0.25 * s.classFracS[1], time);
    v.coldPad.set(0.06 * s.classFracS[2], time);

    if (s.motionS < CALM && step % 2) return; // calm sea: half as many notes
    let best = -1;
    for (let x = x0; x < x1; x++) for (let y = 0; y < H; y++) {
      const i = y * W + x;
      if (cls[i] && (best < 0 || motion[i] > motion[best])) best = i;
    }
    if (best < 0) return;
    const x = ((best % W) + 0.5) / W, y = (Math.floor(best / W) + 0.5) / H;
    const vel = 0.3 + 0.5 * Math.min(1, motion[best] / 0.03);
    (cls[best] === 1 ? v.warm : v.cold)(x, y, vel, "8n", time);
  },
};
