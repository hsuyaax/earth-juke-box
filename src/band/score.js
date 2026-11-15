// The Earth Band score: one call per 16th note. Features in, note events out. Pure apart from its own memory
// (tension, current chord, last lead note, pad voicing), and deterministic: same features, same notes.
// No member plays a note unless a feature from its own frames caused it; a member that is off plays nothing.
import { chordForBar, chordPcs, melodyNote, bassStep, voiceChord, drumVoice, notesIn, CHORDS } from "./theory.js";
import { NORM, norm } from "./members.js";

// The aerosol noise voices are pitched noise (src/audio.js: the bandpass follows the note), so their centers are notes too:
// height on the map picks a pentatonic note in each voice's own band. Dust around 2-3 kHz, salt higher, smoke low.
const DUST_RANGE = [86, 98], SALT_RANGE = [98, 110], SMOKE_RANGE = [45, 57];
const STRINGS_RANGE = [52, 69], DRONE = [45, 52]; // drone: A2 and E3 only
const VOICE_CAP = 12; // new notes per 16th at most (about 24 sounding voices overall); the quietest are dropped
// Average hue angle of a frame (circular mean of the saturation-weighted hue histogram), in degrees.
export const hueAngle = (h) => { let x = 0, y = 0; for (let i = 0; i < 12; i++) { const a = ((i + 0.5) * Math.PI) / 6; x += h[i] * Math.cos(a); y += h[i] * Math.sin(a); } return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360; };
const colorAmount = (s) => s.hueHistS.reduce((a, b) => a + b, 0);
const LEAD_RANGE = [60, 76], PAD_RANGE = [45, 64], MARIMBA_RANGE = [57, 69], ARP_RANGE = [76, 88];
const strongestColor = (s) => Math.max(...s.hueHistS);

// Activity 0..1 per member, each against its own measured quiet-to-busy range (used for tension and the pad glow).
export function activityOf(id, s) {
  if (!s || !s.ready) return 0;
  if (id === "drums") return norm(s.flashRate, NORM.flashRate);
  if (id === "bass") return norm(s.motionS, NORM.motion);
  if (id === "lead") return norm(s.classFracS[1] + s.classFracS[2] + s.classFracS[3] + s.classFracS[4], NORM.lit);
  if (id === "pad") return norm(s.meanS, NORM.density);
  if (id === "shaker") return (norm(s.classFracS[1], NORM.dust) + norm(s.classFracS[2], NORM.smoke) + norm(s.classFracS[3], NORM.salt)) / 3;
  if (id === "arp") return norm(s.motionS, NORM.oceanMotion);
  if (id === "marimba") return norm(s.meanS, NORM.forestBright);
  if (id === "strings") return norm(s.meanS, NORM.riverDensity);
  if (id === "drone") return norm(colorAmount(s), NORM.pollution);
  return 0;
}

export function createScore() {
  const mem = { T: 0, numeral: "i", next: "i", lead: null, voicing: null, padOn: false, arpI: 0, arpChord: null, marimba: null, strings: null, droneOn: false };

  // n = 16th-note count since Play. members = { id: { on, full, s } }, s = that member's engine state.
  function step(n, members) {
    const slot = n % 16, bar = Math.floor(n / 16), events = [];
    const activity = {};
    for (const id of Object.keys(members)) activity[id] = activityOf(id, members[id].s);

    // Harmony: once per bar, from the members that are on (off members do not count).
    if (slot === 0) {
      const on = Object.keys(members).filter((id) => members[id].on && members[id].s?.ready);
      const raw = on.length ? on.reduce((a, id) => a + activity[id], 0) / on.length : 0;
      mem.T += 0.5 * (raw - mem.T); // smoothed bar to bar
      mem.numeral = chordForBar(bar % 4, mem.T);
      mem.next = chordForBar((bar + 1) % 4, mem.T); // best guess of the next chord, for the bass approach note
    }
    const chord = mem.numeral;

    // Drum kit: flashes since the last slot, one hit for the slot's voice. Sparse: the 2 strongest per beat.
    const d = members.drums;
    if (d) {
      if (!d.on || !d.s?.ready) { if (d.s) d.s.nFlashes = 0; }
      else if (d.full || slot % 4 === 0) {
        const fl = d.s.flashes.slice(0, d.s.nFlashes).sort((a, b) => b.power - a.power);
        d.s.nFlashes = 0;
        fl.slice(0, d.full ? 1 : 2).forEach((f, k) => {
          const s16 = d.full ? slot : slot + 2 * k; // sparse: the beat and the eighth after it
          const voice = drumVoice(s16);
          events.push({ member: "drums", voice, midi: 33, vel: 0.3 + 0.6 * f.power, dur: "16n", offset: s16 - slot,
            pan: voice === "kick" ? 0 : f.x * 2 - 1, x: f.x, y: f.y });
        });
      }
    }

    // Bass: chord tones on the grid, busyness from motion, pan and ripple at the fastest-moving water.
    const b = members.bass;
    if (b?.on && b.s?.ready) {
      const s = b.s, warm = s.classFracS[1], cold = s.classFracS[2];
      if (warm + cold >= 0.05) {
        let level = activity.bass < 0.34 ? 0 : activity.bass < 0.67 ? 1 : 2;
        if (!b.full) level = Math.max(0, level - 1);
        const note = bassStep(slot, chord, mem.next, level, norm(warm / (warm + cold), NORM.warmShare));
        if (note) {
          let best = -1;
          for (let i = 0; i < s.W * s.H; i++) if (s.cls[i] && (best < 0 || s.motion[i] > s.motion[best])) best = i;
          const x = best < 0 ? 0.5 : ((best % s.W) + 0.5) / s.W, y = best < 0 ? 0.5 : (Math.floor(best / s.W) + 0.5) / s.H;
          events.push({ member: "bass", voice: "bass", midi: note.midi, vel: 0.5 + 0.35 * activity.bass, dur: note.dur, offset: 0, pan: x * 2 - 1, x, y });
        }
      }
    }

    // Lead: a sweep of 32 eighth-note strips per 4-bar phrase; the brightest light in the strip sets the height.
    const l = members.lead;
    const rest = bar % 4 === 3 && slot >= 12; // breathing space: beat 4 of every fourth bar
    if (l?.on && l.s?.ready && slot % 2 === 0 && (l.full || slot % 4 === 0) && !rest) {
      const s = l.s, strip = (bar % 4) * 8 + slot / 2, x0 = Math.floor((strip * s.W) / 32), x1 = Math.floor(((strip + 1) * s.W) / 32);
      let best = -1;
      for (let x = x0; x < x1; x++) for (let y = 0; y < s.H; y++) { const i = y * s.W + x; if (s.cls[i] && (best < 0 || s.v[i] > s.v[best])) best = i; }
      if (best >= 0) {
        const x = ((best % s.W) + 0.5) / s.W, y = (Math.floor(best / s.W) + 0.5) / s.H;
        const midi = melodyNote(1 - y, LEAD_RANGE, chord, slot === 0 || slot === 8, mem.lead);
        mem.lead = midi;
        events.push({ member: "lead", voice: "lead", midi, vel: 0.35 + 0.5 * Math.min(1, (s.v[best] - 0.08) / 0.4), dur: "8n", offset: 0, pan: x * 2 - 1, x, y, playhead: (x0 + x1) / 2 / s.W });
      } else events.push({ member: "lead", voice: "playhead", offset: 0, playhead: (x0 + x1) / 2 / s.W }); // silent: nothing lit
    }

    // Pad: holds the chord, re-voiced on each chord change; density adds 7th and 9th and opens the filter.
    const p = members.pad;
    if (p) {
      const dense = activity.pad;
      const sounding = p.on && p.s?.ready && p.s.meanS >= NORM.density[0]; // a near-black frame holds nothing
      if (!sounding) { if (mem.padOn) { events.push({ member: "pad", voice: "padOff", offset: 0 }); mem.padOn = false; } }
      else if (slot === 0) {
        const pcs = chordPcs(chord, p.full ? dense : 0); // Sparse: triad only
        const voicing = voiceChord(pcs, PAD_RANGE, mem.voicing);
        if (!mem.padOn || voicing.join() !== mem.voicing?.join()) {
          events.push({ member: "pad", voice: "pad", midis: voicing, prev: mem.padOn ? mem.voicing : null, vel: 0.5 + 0.4 * dense,
            cutoff: 1200 + 2600 * dense, offset: 0, pan: 0, x: p.s.bx, y: p.s.by });
          mem.voicing = voicing; mem.padOn = true;
        }
      }
    }

    // Shaker and atmosphere (aerosols, flat map): dust shaker on 16ths, sea-salt hiss on off-beats, smoke swell per bar.
    const sh = members.shaker;
    if (sh?.on && sh.s?.ready) {
      const s = sh.s, cx = [0, 0, 0, 0], cy = [0, 0, 0, 0], cn = [0, 0, 0, 0];
      for (let i = 0; i < s.W * s.H; i++) { const c = s.cls[i]; if (c) { cx[c] += i % s.W; cy[c] += Math.floor(i / s.W); cn[c]++; } }
      const at = (c) => (cn[c] ? [(cx[c] / cn[c] + 0.5) / s.W, (cy[c] / cn[c] + 0.5) / s.H] : [0.5, 0.5]);
      const dust = norm(s.classFracS[1], NORM.dust), smoke = norm(s.classFracS[2], NORM.smoke), salt = norm(s.classFracS[3], NORM.salt);
      if (cn[1] && (sh.full || slot % 2 === 0)) { const [x, y] = at(1); events.push({ member: "shaker", voice: "dust", vel: 0.15 + 0.6 * dust, dur: "32n", midi: melodyNote(1 - y, DUST_RANGE, chord, false), offset: 0, pan: x * 2 - 1, x, y }); }
      if (cn[3] && slot % 4 === 2 && (sh.full || slot % 8 === 6)) { const [x, y] = at(3); events.push({ member: "shaker", voice: "salt", vel: 0.2 + 0.6 * salt, dur: "16n", midi: melodyNote(1 - y, SALT_RANGE, chord, false), offset: 0, pan: x * 2 - 1, x, y }); }
      if (cn[2] && slot === 0 && smoke > 0.2) { const [x, y] = at(2); events.push({ member: "shaker", voice: "smoke", vel: 0.2 + 0.6 * smoke, dur: "1m", midi: melodyNote(1 - y, SMOKE_RANGE, chord, true), offset: 0, pan: x * 2 - 1, x, y }); }
    }

    // Arpeggio (Perpetual Ocean, moving camera): chord tones only, up then down; motion sets the rate, brightness the span.
    const ar = members.arp;
    if (ar?.on && ar.s?.ready && ar.s.meanS >= NORM.oceanBright[0]) {
      const fast = activity.arp >= 0.5, every = (fast ? 1 : 2) * (ar.full ? 1 : 2);
      if (slot % every === 0) {
        const bright = norm(ar.s.meanS, NORM.oceanBright) >= 0.5;
        const tones = notesIn(ARP_RANGE[0], bright ? ARP_RANGE[1] : 82, CHORDS[chord].pcs); // dim: the lower half-octave only
        const seq = [...tones, ...tones.slice(1, -1).reverse()];
        if (mem.arpChord !== chord) { mem.arpChord = chord; mem.arpI = 0; }
        const midi = seq[mem.arpI++ % seq.length];
        events.push({ member: "arp", voice: "arp", midi, vel: 0.3 + 0.4 * norm(ar.s.meanS, NORM.oceanBright), dur: fast ? "16n" : "8n", offset: 0,
          pan: mem.arpI % 2 ? -0.5 : 0.5, x: ar.s.bx, y: ar.s.by });
      }
    }

    // Marimba (forest height, moving camera): off-beat eighths only; color strength sets the height, brightness the loudness.
    const ma = members.marimba;
    if (ma?.on && ma.s?.ready && slot % 4 === 2 && (ma.full || slot % 8 === 6)) {
      const t = norm(strongestColor(ma.s), NORM.forestColor);
      const midi = melodyNote(t, MARIMBA_RANGE, chord, false, mem.marimba);
      mem.marimba = midi;
      events.push({ member: "marimba", voice: "marimba", midi, vel: 0.3 + 0.5 * activity.marimba, dur: "8n", offset: 0, pan: 0.3, x: ma.s.bx, y: ma.s.by });
    }

    // Strings (atmospheric river, moving camera): one long note per bar, a chord tone picked by the picture's color,
    // placed nearest the last one so it glides; moisture sets the swell.
    const st = members.strings;
    if (st?.on && st.s?.ready && slot === 0 && st.s.meanS >= NORM.riverDensity[0]) {
      const tones = CHORDS[chord].pcs, k = Math.min(2, Math.floor(norm(hueAngle(st.s.hueHistS), NORM.riverHue) * 3));
      const options = notesIn(STRINGS_RANGE[0], STRINGS_RANGE[1], [tones[k]]);
      const midi = mem.strings === null ? options[0] : options.reduce((a, m) => (Math.abs(m - mem.strings) < Math.abs(a - mem.strings) ? m : a));
      mem.strings = midi;
      events.push({ member: "strings", voice: "strings", midi, vel: 0.3 + 0.6 * activity.strings, dur: "1m", offset: 0, pan: -0.3, x: st.s.bx, y: st.s.by });
    }

    // Drone (air quality, moving camera): A and E held while there is pollution color on screen; it opens the filter
    // and speeds the tremolo. It never changes pitch.
    const dr = members.drone;
    const droning = dr?.on && dr.s?.ready && colorAmount(dr.s) >= NORM.pollution[0] * 0.9;
    if (!droning) { if (mem.droneOn) { events.push({ member: "drone", voice: "droneOff", offset: 0 }); mem.droneOn = false; } }
    else if (slot === 0 || !mem.droneOn) {
      const p = activity.drone;
      events.push({ member: "drone", voice: mem.droneOn ? "droneSet" : "drone", midis: DRONE, vel: 0.5 + 0.3 * p, cutoff: 300 + 1700 * p, rate: 1 + 5 * p, offset: 0, pan: 0, x: dr.s.bx, y: dr.s.by });
      mem.droneOn = true;
    }

    // Voice cap: at most VOICE_CAP new notes in one 16th; the quietest new ones are dropped (none are invented).
    const isNote = (e) => e.midi !== undefined || (e.midis && e.voice !== "droneSet");
    const notes = events.filter(isNote);
    if (notes.length > VOICE_CAP) {
      const keep = new Set(notes.sort((a, b) => b.vel - a.vel).slice(0, VOICE_CAP));
      for (let i = events.length - 1; i >= 0; i--) if (isNote(events[i]) && !keep.has(events[i])) events.splice(i, 1);
    }

    return { events, chord, spoken: CHORDS[chord].spoken, T: mem.T, activity, slot, bar };
  }
  return { step };
}
