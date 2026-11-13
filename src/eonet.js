// EONET natural-event alerts (AGENTS.md §14, P2). In-app only; not a warning system.
import * as Tone from "tone";
import { master, COLORS } from "./audio.js";
import { addRipple } from "./ripples.js";

const URL = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7";
const EVERY = 5 * 60 * 1000;
// One short motif per category (semitones from A4). Unknown categories share the last one.
const MOTIF = {
  wildfires: [0, 3], severeStorms: [0, -5, -7], volcanoes: [-12, -7], floods: [7, 4, 0],
  seaLakeIce: [12, 19], earthquakes: [-12, -12], dustHaze: [5, 3], other: [0, 0],
};
const WORD = {
  wildfires: "wildfire", severeStorms: "severe storm", volcanoes: "volcano", floods: "flood", seaLakeIce: "sea and lake ice",
  earthquakes: "earthquake", dustHaze: "dust and haze", landslides: "landslide", drought: "drought", snow: "snow",
  tempExtremes: "temperature extreme", waterColor: "water color", manmade: "man-made event",
};

export const events = []; // { id, title, cat, word, lon, lat, date, link }
const toXY = (e) => [(e.lon + 180) / 360, (90 - e.lat) / 180];

export function createEonet({ list, status, announce, canPlay, onChange }) {
  let synth, pan, first = true;

  function play(e, when = Tone.now()) {
    if (!canPlay()) return;
    if (!synth) {
      pan = new Tone.Panner(0).connect(master);
      synth = new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.08 }, volume: -20 }).connect(pan);
    }
    const [x, y] = toXY(e);
    pan.pan.setValueAtTime(x * 2 - 1, when);
    (MOTIF[e.cat] || MOTIF.other).forEach((st, i) => synth.triggerAttackRelease(440 * 2 ** (st / 12), 0.1, when + i * 0.14, 0.5));
    Tone.getDraw().schedule(() => addRipple(x, y, COLORS.alert, 1), when);
  }

  function render() {
    list.replaceChildren(...events.slice(0, 12).map((e) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = e.link; a.textContent = e.title; a.target = "_blank"; a.rel = "noopener";
      li.append(a, ` · ${e.word} · ${e.date.slice(0, 10)}`);
      return li;
    }));
  }

  async function refresh() {
    try {
      const res = await fetch(URL);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const known = new Set(events.map((e) => e.id));
      const fresh = [];
      events.length = 0;
      for (const ev of data.events) {
        const g = ev.geometry.at(-1);
        if (!g || g.type !== "Point") continue;
        const cat = ev.categories[0]?.id || "other";
        const e = { id: ev.id, title: ev.title, cat, word: WORD[cat] || cat, lon: g.coordinates[0], lat: g.coordinates[1], date: g.date, link: ev.sources?.[0]?.url || ev.link };
        events.push(e);
        if (!known.has(e.id)) fresh.push(e);
      }
      events.sort((a, b) => b.date.localeCompare(a.date));
      render();
      status.textContent = `${events.length} open events in the last 7 days. Updated ${new Date().toLocaleTimeString()}.`;
      if (!first && fresh.length) {
        announce(`New event: ${fresh[0].word}, ${fresh[0].title}${fresh.length > 1 ? `, and ${fresh.length - 1} more` : ""}.`);
        fresh.slice(0, 3).forEach((e, i) => play(e, Tone.now() + i * 0.6));
      }
      first = false;
      onChange();
    } catch {
      status.textContent = "Could not reach NASA EONET. The list may be out of date.";
    }
  }

  refresh();
  setInterval(refresh, EVERY);
  return { play, toXY };
}
