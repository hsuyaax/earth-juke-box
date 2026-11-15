// Earth Band members (EARTH_BAND_GUIDE.md section 2): all nine visualizations NASA listed for the challenge.
// Engine settings come from the record data files unchanged, except the clip (small band clips) and one measured
// flash threshold for the smaller lightning clip. No Tone and no DOM here, so the tests can import it.
import lightningData from "../records/lightning.data.js";
import currentsData from "../records/currents.data.js";
import nightlightsData from "../records/nightlights.data.js";
import aerosolsData from "../records/aerosols.data.js";

// B-side engine settings (src/records/bside.js: grid 96x54, one "bright" class). That file imports Tone, so they are repeated here.
const bsideRec = (id, clip) => ({ id, clip, mapArea: null, grid: [96, 54],
  classes: [{ name: "bright", label: "bright area", colorRange: { v: [0.25, 1] }, soundFamily: "neutral", kind: "sustained" }] });

export const BPM = 96;

// Normalization ranges: p5 and p95 measured with tools/engine_run.mjs on the band clips (not the full clips).
export const NORM = {
  flashRate: [0.66, 17.95], // lightning band clip, flashes per second
  motion: [0.00198, 0.00244], // currents band clip, smoothed mean motion of the water
  warmShare: [0.357, 0.4], // currents band clip, warm / (warm + cold): this is all it moves over the whole clip
  lit: [0.0164, 0.1071], // night lights band clip, share of the map that is lit
  density: [0.085, 0.438], // CO2 band clip, smoothed mean brightness of the frame
  dust: [0.0294, 0.0464], smoke: [0.0143, 0.03], salt: [0.0157, 0.0334], // aerosols band clip, share of the map per class
  oceanBright: [0.1478, 0.3989], oceanMotion: [0.0013, 0.0148], // Perpetual Ocean 2 band clip
  forestBright: [0.1393, 0.1885], // GEDI band clip, smoothed mean brightness
  // GEDI's strongest color is green in every frame, so "strongest color" is its strength: the largest
  // saturation-weighted hue-histogram bin (greener canopy, higher). GEDI band clip.
  forestColor: [0.0494, 0.1102],
  riverDensity: [0.1594, 0.4734], // Atmospheric River band clip, smoothed mean brightness (moisture)
  riverHue: [105.8, 263.0], // Atmospheric River band clip, average hue angle in degrees (green in 86% of frames, so the angle, not the top bin)
  pollution: [0.3653, 0.442], // Air Quality band clip, saturation-weighted color amount (its hue is the same in every frame)
};
export const norm = (v, [lo, hi]) => Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

export const MEMBERS = [
  {
    id: "drums", role: "Drums", name: "Lightning", svs: 5011, color: "#FFF3B0", positional: true,
    // Band clip 640 px wide (480 px lost too many one-pixel dots). jump 0.25 gave 6.2 flashes/s on it; 0.23 gives 8.9/s
    // against 9.2/s on the full clip, same quiet-to-busy shape, 15% of beats at the 6-hit cap (full clip 16%).
    rec: { ...lightningData, clip: "clips/band/lightning.mp4", flash: { ...lightningData.flash, jump: 0.23 } }, aspect: "2 / 1", years: "2017–2023",
    describe: "Each flash is a hit: a kick on beats 1 and 3, a snare on beats 2 and 4, a hi-hat in between.",
  },
  {
    id: "bass", role: "Bass", name: "Ocean currents", svs: 3912, color: "#5CC8FF", positional: true,
    rec: { ...currentsData, clip: "clips/band/currents.mp4" }, aspect: "2 / 1", years: "2005–2007", // 480 px matches the full clip
    describe: "The chord's root on every bar line; the warm share of the water picks root, third or fifth; the sea's motion sets how busy it is.",
  },
  {
    id: "lead", role: "Lead", name: "Night lights", svs: 5313, color: "#9B7BFF", positional: true,
    // Band clip 960 px wide: at 480 and 640 px the thin violet and orange change-map areas lost half their cells.
    rec: { ...nightlightsData, clip: "clips/band/nightlights.mp4" }, aspect: "16 / 9", years: "2012–2023",
    describe: "A playhead sweeps west to east once every four bars; the brightest light under it sets the next note's height.",
  },
  {
    id: "pad", role: "Pad", name: "CO2", svs: 5196, color: "#FF8A3D", positional: false,
    // Same engine settings as the CO2 B-side (src/records/bside.js: grid 96x54, one "bright" class). That file imports
    // Tone, so the settings are repeated here. Band clip 480 px: mean brightness, bright share and motion within 6% of the full clip.
    rec: bsideRec("co2", "clips/band/co2.mp4"), aspect: "16 / 9", years: "",
    describe: "Holds the current chord. Denser CO2 adds the 7th, then the 9th, and opens the filter. Artistic, not geographic: the camera moves.",
  },
  {
    id: "shaker", role: "Shaker", name: "Aerosols", svs: 5552, color: "#C39BDB", positional: true,
    // Band clip 640 px, stronger compression: dust, smoke and salt shares within 3% of the full clip (480 px lost 13% of the smoke).
    rec: { ...aerosolsData, clip: "clips/band/aerosols.mp4" }, aspect: "2 / 1", years: "Aug–Sep 2024",
    describe: "Dust is a shaker on sixteenths, louder where there is more of it; sea salt is a hiss on the off-beats; smoke is a slow low swell.",
  },
  {
    id: "arp", role: "Arpeggio", name: "Perpetual Ocean", svs: 5425, color: "#7FE3D0", positional: false,
    // Band clip 384 px: brightness within 1%, motion within 9% of the full clip.
    rec: bsideRec("perpetualocean", "clips/band/perpetualocean.mp4"), aspect: "16 / 9", years: "",
    describe: "Chord tones only, up then down. Faster currents play sixteenths instead of eighths; a brighter picture spans the whole octave. Artistic, not geographic.",
  },
  {
    id: "marimba", role: "Marimba", name: "Forest height", svs: 4950, color: "#9BE36B", positional: false,
    // Band clip 384 px: brightness and color strength within 2% of the full clip.
    rec: bsideRec("gedi", "clips/band/gedi.mp4"), aspect: "16 / 9", years: "",
    describe: "Off-beat eighths only, so it never collides with the lead. Greener canopy plays higher; a brighter picture plays louder. Artistic, not geographic.",
  },
  {
    id: "strings", role: "Strings", name: "Atmospheric river", svs: 4960, color: "#86AAA8", positional: false,
    // Band clip 384 px: brightness and color amount within 1%, motion within 6% of the full clip (stronger compression lost 12% of the motion).
    rec: bsideRec("atmosriver", "clips/band/atmosriver.mp4"), aspect: "16 / 9", years: "",
    describe: "One long note per bar, gliding on the bar line. More moisture swells it; the picture's color picks which chord tone is on top. Artistic, not geographic.",
  },
  {
    id: "drone", role: "Drone", name: "Air quality", svs: 5533, color: "#E6E1A3", positional: false,
    // Band clip 480 px: brightness, color amount and motion within 10% of the full clip (384 px read the motion 15% high).
    rec: bsideRec("airquality", "clips/band/airquality.mp4"), aspect: "16 / 9", years: "",
    describe: "A and E held all the time, so the key stays anchored. More pollution color opens the filter and speeds the tremolo. Artistic, not geographic.",
  },
];

// Quick starts (guide section 5). Each is four members, inside the cap.
export const SCENES = [
  { id: "storm", name: "Storm", members: ["drums", "bass", "shaker", "strings"] },
  { id: "city", name: "City night", members: ["lead", "pad", "bass", "drone"] },
  { id: "ocean", name: "Ocean", members: ["bass", "arp", "marimba", "pad"] },
];
