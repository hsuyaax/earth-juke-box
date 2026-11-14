// Earth Band members (EARTH_BAND_GUIDE.md section 2). Phase 1: drum kit, bass, lead, harmony pad.
// Engine settings come from the record data files unchanged, except the clip (small band clips) and one measured
// flash threshold for the smaller lightning clip. No Tone and no DOM here, so the tests can import it.
import lightningData from "../records/lightning.data.js";
import currentsData from "../records/currents.data.js";
import nightlightsData from "../records/nightlights.data.js";

export const BPM = 96;

// Normalization ranges: p5 and p95 measured with tools/engine_run.mjs on the band clips (not the full clips).
export const NORM = {
  flashRate: [0.66, 17.95], // lightning band clip, flashes per second
  motion: [0.00198, 0.00244], // currents band clip, smoothed mean motion of the water
  warmShare: [0.357, 0.4], // currents band clip, warm / (warm + cold): this is all it moves over the whole clip
  lit: [0.0164, 0.1071], // night lights band clip, share of the map that is lit
  density: [0.085, 0.438], // CO2 band clip, smoothed mean brightness of the frame
};
export const norm = (v, [lo, hi]) => Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

export const MEMBERS = [
  {
    id: "drums", role: "Drums", name: "Lightning", svs: 5011, color: "#FFF3B0", positional: true,
    // Band clip 640 px wide (480 px lost too many one-pixel dots). jump 0.25 gave 6.2 flashes/s on it; 0.23 gives 8.9/s
    // against 9.2/s on the full clip, same quiet-to-busy shape, 15% of beats at the 6-hit cap (full clip 16%).
    rec: { ...lightningData, clip: "clips/band/lightning.mp4", flash: { ...lightningData.flash, jump: 0.23 } },
    describe: "Each flash is a hit: a kick on beats 1 and 3, a snare on beats 2 and 4, a hi-hat in between.",
  },
  {
    id: "bass", role: "Bass", name: "Ocean currents", svs: 3912, color: "#5CC8FF", positional: true,
    rec: { ...currentsData, clip: "clips/band/currents.mp4" }, // 480 px matches the full clip
    describe: "The chord's root on every bar line; the warm share of the water picks root, third or fifth; the sea's motion sets how busy it is.",
  },
  {
    id: "lead", role: "Lead", name: "Night lights", svs: 5313, color: "#9B7BFF", positional: true,
    // Band clip 960 px wide: at 480 and 640 px the thin violet and orange change-map areas lost half their cells.
    rec: { ...nightlightsData, clip: "clips/band/nightlights.mp4" },
    describe: "A playhead sweeps west to east once every four bars; the brightest light under it sets the next note's height.",
  },
  {
    id: "pad", role: "Pad", name: "CO2", svs: 5196, color: "#FF8A3D", positional: false,
    // Same engine settings as the CO2 B-side (src/records/bside.js: grid 96x54, one "bright" class). That file imports
    // Tone, so the settings are repeated here. Band clip 480 px: mean brightness, bright share and motion within 6% of the full clip.
    rec: { id: "co2", clip: "clips/band/co2.mp4", mapArea: null, grid: [96, 54],
      classes: [{ name: "bright", label: "bright area", colorRange: { v: [0.25, 1] }, soundFamily: "neutral", kind: "sustained" }] },
    describe: "Holds the current chord. Denser CO2 adds the 7th, then the 9th, and opens the filter. Artistic, not geographic: the camera moves.",
  },
];
