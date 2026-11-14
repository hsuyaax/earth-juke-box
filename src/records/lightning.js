import * as Tone from "tone";
import { FAMILY, COLORS, SCALES, makePool, makeDrone } from "../audio.js";
import data from "./lightning.data.js";

const side = (x) => (x < 0.38 ? "on the left" : x > 0.62 ? "on the right" : "in the middle");
let flashX = 0.5; // recent flash positions, for captions

export default {
  ...data,
  title: "Lightning from the ISS",
  blurb: "Every flash is a drum hit you can place by ear.",
  svs: 5011,
  credit: "NASA's Scientific Visualization Studio",
  bpm: 96,
  probe: { scale: SCALES.minorPent, root: 36, amount: "v" },
  caption(s) {
    const r = s.flashRate;
    const word = r < 3 ? "Quiet" : r < 10 ? "Some lightning" : "Busy, many flashes";
    return r < 3 ? "Quiet: few flashes." : `${word}, mostly ${side(flashX)}.`;
  },
  notes: {
    shows: "Lightning seen by the Lightning Imaging Sensor on the International Space Station, 2017 to 2023, on a flat world map. Each yellow dot is lightning in a rolling 10-day window.",
    hear: "Each new flash is a drum hit. Left and right follow the map; higher on the map is a higher drum. A low rumble grows louder and brighter when there are many flashes.",
    listen: "Storm seasons moving north and south with the year; the Americas in your left ear, Africa in the middle, Asia on the right.",
  },
  voices() {
    return {
      drum: makePool(FAMILY.crack, { color: COLORS.crack, scale: SCALES.minorPent, root: 36 }),
      rumble: makeDrone(new Tone.FatOscillator("E1", "sawtooth", 30), { cutoff: 120 }),
    };
  },
  onBeat(s, v, time) {
    const busy = Math.min(1, s.flashRate / 15); // full clip: ~15 flashes/s at the busiest 10 s stretch (measured)
    v.rumble.set(0.05 + 0.25 * busy, time, 120 + 500 * busy);
    for (let k = 0; k < s.nFlashes; k++) {
      const f = s.flashes[k];
      flashX += 0.05 * (f.x - flashX);
      // spread hits over the four 32nd-note slots of the beat (still on the grid), so 6 at once is a roll, not one loud stack
      v.drum(f.x, f.y, 0.3 + 0.5 * f.power, "16n", time + (k % 4) * Tone.Time("32n").toSeconds());
    }
    s.nFlashes = 0;
  },
};
