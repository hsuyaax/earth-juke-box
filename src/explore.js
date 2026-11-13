// Explore probe (AGENTS.md §9): hear what is under the pointer — what it is, how much, where.
// Runs on the analysis tick, independent of the music clock, so it works while playing and paused.
import * as Tone from "tone";
import { FAMILY, COLORS, master, makePool, makeDrone, duck } from "./audio.js";
import { setProbe } from "./ripples.js";

const TICK = 0.066; // s, matches the analysis interval
const HOLD = 2; // ticks a new sustained class must hold before the voice switches
const SAY_EVERY = 1500; // ms between class-change announcements
const SOUND_WORDS = { crack: "a sharp drum hit", warm: "a soft flute", cold: "a glassy bell", pluckA: "a bright pluck", pluckB: "a soft, round pluck" };
const ROWS = ["upper", "middle", "lower"], COLS = ["left", "center", "right"];

export function createProbe({ stage, video, state, getRecord, isAudioReady, announce }) {
  let cx = 0, cy = 0, rec = null;
  let pointerIn = false, focusIn = false;
  let pendingSay = "", current = 0, candidate = 0, held = 0, phase = 0, eventCool = 0, lastSaid = 0;
  const pools = {}; // `${rec.id}:${family}` -> pool (scale differs per record)
  let room, edge, counts, ducked = false, roomOn = false;
  const setDuck = (on) => { if (on !== ducked) duck((ducked = on)); };
  const setRoom = (on) => { if (on !== roomOn) room?.set((roomOn = on) ? 0.015 : 0); };

  const active = () => (pointerIn || focusIn) && !!rec;
  const pool = (family) => {
    const key = `${rec.id}:${family}`;
    return (pools[key] ||= makePool(FAMILY[family], { color: COLORS[family], scale: rec.probe.scale, root: rec.probe.root, size: 3, out: master }));
  };

  function setRecord(r) {
    rec = r;
    counts = new Uint8Array(r.classes.length + 1); // reused every tick
    cx = Math.floor(r.grid[0] / 2); cy = Math.floor(r.grid[1] / 2);
    current = candidate = held = 0; pendingSay = "";
    drawMarker();
  }

  function drawMarker() {
    if (!rec || !active()) return setProbe(null);
    const [W, H] = rec.grid;
    setProbe({ x0: (cx - 1) / W, y0: (cy - 1) / H, x1: (cx + 2) / W, y1: (cy + 2) / H });
  }

  function moveTo(x, y) {
    const [W, H] = rec.grid;
    cx = Math.max(0, Math.min(W - 1, x)); cy = Math.max(0, Math.min(H - 1, y));
    drawMarker();
  }
  const move = (dx, dy) => moveTo(cx + dx, cy + dy);

  // Read the 3x3 neighborhood: dominant class, amount 0..1, and whether a flash just fired here.
  function read() {
    const { W, H, cls, v, motion, jump } = state;
    counts.fill(0);
    let sum = 0, n = 0, flash = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x;
      counts[cls[i]]++;
      sum += rec.probe.amount === "motion" ? motion[i] : v[i];
      if (rec.flash && jump[i] >= rec.flash.jump && cls[i]) flash = true;
      n++;
    }
    let c = 0;
    for (let k = 1; k < counts.length; k++) if (counts[k] > counts[c] || (c === 0 && counts[k] >= 3)) c = k;
    const avg = sum / n;
    const amount = rec.probe.amount === "motion" ? Math.min(1, avg / rec.probe.full) : Math.max(0, Math.min(1, (avg - 0.05) / 0.45));
    return { c, amount, flash };
  }

  const label = (c) => (c ? rec.classes[c - 1].label : "nothing");
  const words = () => rec.probe.words || ["faint", "medium", "strong"];
  const amountWord = (a) => words()[a < 0.33 ? 0 : a < 0.66 ? 1 : 2];
  const where = () => `${ROWS[Math.min(2, Math.floor((cy / rec.grid[1]) * 3))]} ${COLS[Math.min(2, Math.floor((cx / rec.grid[0]) * 3))]}`;

  function describe() {
    if (!rec || !state.ready) return;
    const { c, amount } = read();
    announce(c ? `${label(c)}, ${amountWord(amount)}, ${where()}.` : `Nothing here, ${where()}.`);
  }

  function silence() { setRoom(false); setDuck(false); }

  function tick() {
    drawMarker();
    if (!active() || !isAudioReady() || !state.ready) return silence();
    room ||= makeDrone(new Tone.Noise("pink"), { cutoff: 900, out: master });
    edge ||= makePool(() => new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 }, volume: -18 }),
      { color: "#F4EFE6", scale: rec.probe.scale, root: 84, octaves: 1, size: 2, out: master });
    const playing = !video.paused;
    setDuck(playing);

    const x = (cx + 0.5) / rec.grid[0], y = (cy + 0.5) / rec.grid[1];
    const r = read();
    let c = r.c;
    const kind = c ? rec.classes[c - 1].kind : null;

    // Events fire at once (temporal detector while playing). While playing, a still event class is not a sustained sound.
    if (eventCool) eventCool--;
    if (playing && r.flash && !eventCool) {
      const fc = rec.classes.findIndex((k) => k.kind === "event");
      pool(rec.classes[fc].soundFamily)(x, y, 0.4 + 0.4 * r.amount, "16n", Tone.now());
      eventCool = 3;
    }
    if (playing && kind === "event") c = 0;

    // Sustained classes: hysteresis, then a soft edge tick and the new voice.
    if (c === current) { held = 0; candidate = c; }
    else if (c === candidate && ++held >= HOLD) {
      current = c; held = 0; phase = 1;
      edge(x, 0.5, 0.3, 0.03, Tone.now());
      pendingSay = current ? `${label(current)}, ${amountWord(r.amount)}` : "nothing";
    } else if (c !== candidate) { candidate = c; held = 1; }
    // Throttled announcements are delayed, never dropped: the latest class always gets said.
    if (pendingSay && performance.now() - lastSaid > SAY_EVERY) { lastSaid = performance.now(); announce(pendingSay); pendingSay = ""; }

    setRoom(!current);
    if (!current) return;

    // Pulse speed = how much (faster = more). A paused event class pulses softly (spatial detector).
    const rate = 2 + 8 * r.amount;
    phase += rate * TICK;
    if (phase >= 1) {
      phase -= Math.floor(phase);
      const ev = rec.classes[current - 1].kind === "event";
      pool(rec.classes[current - 1].soundFamily)(x, y, ev ? 0.15 + 0.2 * r.amount : 0.2 + 0.5 * r.amount, ev ? "32n" : "16n", Tone.now());
    }
  }

  // ---- input ----
  function fromPointer(e) {
    const rct = video.getBoundingClientRect(), m = rec.mapArea;
    const vx = ((e.clientX - rct.left) / rct.width) * video.videoWidth, vy = ((e.clientY - rct.top) / rct.height) * video.videoHeight;
    const mx = m ? (vx - m.x) / m.w : vx / video.videoWidth, my = m ? (vy - m.y) / m.h : vy / video.videoHeight;
    moveTo(Math.floor(mx * rec.grid[0]), Math.floor(my * rec.grid[1]));
  }
  stage.addEventListener("pointerdown", (e) => { pointerIn = true; fromPointer(e); stage.focus(); });
  stage.addEventListener("pointermove", (e) => { pointerIn = true; fromPointer(e); });
  stage.addEventListener("pointerleave", () => { pointerIn = false; drawMarker(); });
  stage.addEventListener("pointercancel", () => { pointerIn = false; drawMarker(); });

  // Audio legend: each sound with its label, low to high so pitch = height is audible too.
  let legendTimers = [];
  function legend(say) {
    legendTimers.forEach(clearTimeout);
    const seen = new Set();
    const items = rec.classes.filter((k) => !seen.has(k.label) && seen.add(k.label));
    const lines = items.map((k) => [`${k.label[0].toUpperCase() + k.label.slice(1)}: ${SOUND_WORDS[k.soundFamily]}.`, k.soundFamily]);
    lines.push(["When exploring, nothing detected is a faint hiss.", null]);
    legendTimers = lines.map(([text, family], i) => setTimeout(() => {
      say(text);
      if (family) [0.8, 0.5, 0.2].forEach((y, j) => pool(family)(0.5, y, 0.5, "16n", Tone.now() + 0.6 + j * 0.3));
      else { room ||= makeDrone(new Tone.Noise("pink"), { cutoff: 900, out: master }); room.set(0.015); setTimeout(() => { if (!roomOn) room.set(0); }, 1200); }
    }, i * 2600));
  }

  return {
    tick, legend, setRecord, move, describe,
    setFocus(on) { focusIn = on; drawMarker(); },
  };
}
