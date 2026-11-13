// B-side default mapping (AGENTS.md §7): brightness -> loudness, dominant hue -> chord, motion -> tempo.
// One settings object per clip; the engine treats it like any record.
import * as Tone from "tone";
import { FAMILY, COLORS, SCALES, makePool, makeDrone } from "../audio.js";
import { setPlayhead } from "../ripples.js";

const STEPS = 16;
const HUES = ["red", "orange", "yellow", "yellow-green", "green", "green", "teal", "blue", "blue", "violet", "purple", "pink"];
const dominantHue = (s) => { let k = 0; for (let i = 1; i < 12; i++) if (s.hueHistS[i] > s.hueHistS[k]) k = i; return k; };

export function bside({ id, title, blurb, svs, credit, clip, shows, artistic, grid = [96, 54], lonlat = false, live = null }) {
  return {
    id, title, blurb, svs, credit, clip, live, lonlat, grid,
    bside: true,
    mapArea: null,
    bpm: 80,
    // One class so the probe and overlay work on any picture: bright areas (V >= 0.25, any hue).
    classes: [{ name: "bright", label: "bright area", colorRange: { v: [0.25, 1] }, soundFamily: "neutral", kind: "sustained" }],
    probe: { scale: SCALES.majorPent, root: 48, amount: "v", words: ["dim", "medium", "bright"] },
    caption(s) {
      const b = s.meanS < 0.15 ? "Dim" : s.meanS < 0.35 ? "Medium bright" : "Bright";
      return `${b}, mostly ${HUES[dominantHue(s)]}, ${s.motionS < 0.004 ? "calm" : "moving"}.`;
    },
    notes: {
      shows: shows + (artistic ? " Artistic, not geographic: the camera moves, so left and right do not stay on one place." : ""),
      hear: "The default B-side mapping. Overall brightness sets the loudness of a soft pad. The strongest color picks the chord, changing each bar. A playhead sweeps the picture and plays its brightest spot in each strip; more motion on screen means a faster tempo.",
      listen: "Chord changes as the colors shift; the tempo rising when the picture moves fast.",
    },
    voices() {
      return {
        lead: makePool(FAMILY.neutral, { color: COLORS.neutral, scale: SCALES.majorPent, root: 48 }),
        chord: makePool(FAMILY.neutral, { color: COLORS.light, scale: SCALES.majorPent, root: 36, octaves: 2, size: 3 }),
        pad: makeDrone(new Tone.FatOscillator("C2", "triangle", 20), { cutoff: 600 }),
      };
    },
    onBeat(s, v, time, beat) {
      const { W, H } = s;
      // tempo follows motion
      Tone.getTransport().bpm.rampTo(72 + 60 * Math.min(1, s.motionS / 0.02), 1, time);
      v.pad.set(Math.min(0.25, s.meanS * 0.6), time);

      // chord per bar: dominant hue -> scale degree, played at the brightness centroid
      if (beat % 8 === 0 && s.meanS > 0.03) {
        const deg = dominantHue(s) / 12; // 0..1 -> position up the 2-octave chord pool
        [0, 0.2, 0.4].forEach((d) => v.chord(s.bx, 1 - Math.min(0.99, deg * 0.6 + d), 0.3, "2n", time));
      }

      // melody: brightest cell in the current strip
      const step = beat % STEPS, x0 = Math.floor((step * W) / STEPS), x1 = Math.floor(((step + 1) * W) / STEPS);
      Tone.getDraw().schedule(() => setPlayhead((x0 + x1) / 2 / W), time);
      let best = -1;
      for (let x = x0; x < x1; x++) for (let y = 0; y < H; y++) { const i = y * W + x; if (best < 0 || s.v[i] > s.v[best]) best = i; }
      if (best < 0 || s.v[best] < 0.12) return;
      v.lead(((best % W) + 0.5) / W, (Math.floor(best / W) + 0.5) / H, 0.2 + 0.5 * s.v[best], "8n", time);
    },
  };
}

const SVS = "NASA's Scientific Visualization Studio";
export const BSIDES = [
  bside({ id: "co2", title: "DYAMOND Carbon Dioxide", blurb: "CO2 plumes swirling over North America.", svs: 5196, credit: SVS, clip: "clips/co2.mp4", artistic: true,
    shows: "Carbon dioxide from the DYAMOND global model run, zooming into North America: orange is higher CO2 from cities and fires, tan the background CO2 carried by winds." }),
  bside({ id: "airquality", title: "Air Quality Model Runs", blurb: "Four pollutants side by side.", svs: 5533, credit: SVS, clip: "clips/airquality.mp4", artistic: true,
    shows: "NASA GEOS air-quality forecasts shown as strips of carbon monoxide, ozone, nitrogen dioxide, and fine particles across the world." }),
  bside({ id: "perpetualocean", title: "Perpetual Ocean 2", blurb: "Western boundary currents, by temperature.", svs: 5425, credit: SVS, clip: "clips/perpetualocean.mp4", artistic: true,
    shows: "Ocean surface currents on a turning globe, colored by temperature, focusing on fast western boundary currents like the Gulf Stream." }),
  bside({ id: "atmosriver", title: "Atmospheric River", blurb: "A river of water vapor hits the coast.", svs: 4960, credit: SVS, clip: "clips/atmosriver.mp4", artistic: true,
    shows: "A 3D view of an atmospheric river from a NASA Earth system model: a long band of water vapor flowing toward North America's west coast." }),
  bside({ id: "gedi", title: "GEDI Forest Height", blurb: "How tall the world's forests are.", svs: 4950, credit: SVS, clip: "clips/gedi.mp4", artistic: true,
    shows: "Forest canopy height measured by the GEDI lidar on the International Space Station, on a turning globe: brighter green is taller forest." }),
];
