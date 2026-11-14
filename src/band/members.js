// Earth Band: three records as one band, on one clock and one scale.
// Every note here comes from a frame. Pads only switch these parts on, off, or thinner (see main.js).
// Sound language (AGENTS.md section 8) holds inside each member: pan = left-right on its map,
// pitch = up-down on its map within the member's octave range, loudness = how much.
// Engine settings come from the record data files unchanged, except the clip (small band clips) and one
// measured flash threshold for the smaller lightning clip.
import lightningData from "../records/lightning.data.js";
import currentsData from "../records/currents.data.js";
import nightlightsData from "../records/nightlights.data.js";

// One shared scale and key for the whole band: A minor pentatonic.
export const SCALE = [0, 3, 5, 7, 10];
export const BPM = 96; // same tempo as the three featured records
const A1 = 33, A3 = 57;

export const MEMBERS = [
  {
    id: "drums", role: "Drums", name: "Lightning", svs: 5011, color: "#FFF3B0",
    // Band clip is 640 px wide (480 px lost too many one-pixel dots). Measured with tools/engine_run.mjs on the band clip:
    // jump 0.25 gave 6.2 flashes/s; 0.23 gives 8.9/s against 9.2/s on the full clip, same quiet-to-busy shape,
    // 15% of beats at the 6-hit cap (full clip 16%).
    rec: { ...lightningData, clip: "clips/band/lightning.mp4", flash: { ...lightningData.flash, jump: 0.23 } },
    range: { root: A1, octaves: 2 },
    describe: "Each flash the engine finds is a drum hit.",
  },
  {
    id: "bass", role: "Bass", name: "Ocean currents", svs: 3912, color: "#5CC8FF",
    rec: { ...currentsData, clip: "clips/band/currents.mp4" },
    range: { root: A1, octaves: 1 }, // low octave only
    describe: "The warm share of the water picks the bass note; the sea's motion sets how busy the bass is.",
  },
  {
    id: "melody", role: "Melody", name: "Night lights", svs: 5313, color: "#9B7BFF",
    // Band clip is 960 px wide: at 480 and 640 px the thin violet and orange change-map areas lost half their cells;
    // at 960 px they match the full clip (violet 0.0087 vs 0.0084, orange 0.0114 vs 0.0115 of the map).
    rec: { ...nightlightsData, clip: "clips/band/nightlights.mp4" },
    range: { root: A3, octaves: 2 }, // mid and high
    describe: "A playhead sweeps west to east; each lit place under it plays a pluck.",
  },
];

// Measured on the band currents clip (tools/engine_run.mjs, 1001 frames, p5 and p95):
const WARM_SHARE = [0.357, 0.4]; // warm / (warm + cold): moves only between these over the whole clip
const MOTION = [0.00198, 0.00244]; // smoothed mean motion of the water
const norm = (v, [lo, hi]) => Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

// Bass rhythms over one bar of eighth notes, from calm to busy. Motion picks the row; Sparse drops one row.
const BASS_RHYTHM = [[0, 4], [0, 2, 4, 6], [0, 2, 3, 4, 6, 7]];
const MELODY_STEPS = 32; // 4 bars of eighth notes to cross the map

// Each onBeat returns how many notes it played (for the pad pulse) and sets m.activity (0..1, for the pad glow).
// play(x, y, vel, dur, time, pitchT) plays one note: x drives pan and the ripple, pitchT (default 1 - y) drives pitch.
export const BEATS = {
  drums(s, m, play, time, beat, full) {
    m.activity = Math.min(1, s.flashRate / 15); // busiest stretch of the clip is about 15 flashes/s (measured on the full clip)
    const n = s.nFlashes;
    if (!n) return 0;
    // Sparse keeps only the two strongest flashes of the beat.
    const order = [...Array(n).keys()].sort((a, b) => s.flashes[b].power - s.flashes[a].power).slice(0, full ? n : 2);
    order.forEach((k, slot) => {
      const f = s.flashes[k];
      play(f.x, f.y, 0.3 + 0.5 * f.power, "16n", time + (slot % 4) * (60 / BPM / 8)); // 32nd-note slots, still on the grid
    });
    s.nFlashes = 0;
    return order.length;
  },

  bass(s, m, play, time, beat, full) {
    const { W, H, cls, motion } = s, warm = s.classFracS[1], cold = s.classFracS[2];
    const busy = norm(s.motionS, MOTION);
    m.activity = busy;
    if (warm + cold < 0.05) return 0; // no water on screen
    let level = busy < 0.34 ? 0 : busy < 0.67 ? 1 : 2;
    if (!full) level = Math.max(0, level - 1);
    if (!BASS_RHYTHM[level].includes(beat % 8)) return 0;
    // Where: the fastest-moving water cell (pan and ripple). Which note: the warm share of the water.
    let best = -1;
    for (let i = 0; i < W * H; i++) if (cls[i] && (best < 0 || motion[i] > motion[best])) best = i;
    if (best < 0) return 0;
    const x = ((best % W) + 0.5) / W, y = (Math.floor(best / W) + 0.5) / H;
    play(x, y, 0.45 + 0.35 * busy, "8n", time, norm(warm / (warm + cold), WARM_SHARE));
    return 1;
  },

  melody(s, m, play, time, beat, full, playhead) {
    const { W, H, cls } = s;
    const step = beat % MELODY_STEPS, x0 = Math.floor((step * W) / MELODY_STEPS), x1 = Math.floor(((step + 1) * W) / MELODY_STEPS);
    playhead((x0 + x1) / 2 / W, time);
    const hits = [];
    for (let x = x0; x < x1; x++) for (let y = 0; y < H; y++) if (cls[y * W + x]) hits.push(y * W + x);
    m.activity = Math.min(1, hits.length / 40);
    hits.sort((i, j) => s.v[j] - s.v[i]);
    const top = hits.slice(0, full ? 4 : 1);
    for (const i of top) {
      const x = ((i % W) + 0.5) / W, y = (Math.floor(i / W) + 0.5) / H;
      const orange = m.rec.classes[cls[i] - 1].name === "orange"; // "less light": the soft pluck
      play(x, y, 0.25 + 0.6 * Math.min(1, (s.v[i] - 0.08) / 0.4), "8n", time, undefined, orange ? "b" : "a");
    }
    return top.length;
  },
};
