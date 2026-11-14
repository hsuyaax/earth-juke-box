// The Earth Band score: one call per 16th note. Features in, note events out. Pure apart from its own memory
// (tension, current chord, last lead note, pad voicing), and deterministic: same features, same notes.
// No member plays a note unless a feature from its own frames caused it; a member that is off plays nothing.
import { chordForBar, chordPcs, melodyNote, bassStep, voiceChord, drumVoice, CHORDS } from "./theory.js";
import { NORM, norm } from "./members.js";

const LEAD_RANGE = [60, 76], PAD_RANGE = [45, 64];

// Activity 0..1 per member, each against its own measured quiet-to-busy range (used for tension and the pad glow).
export function activityOf(id, s) {
  if (!s || !s.ready) return 0;
  if (id === "drums") return norm(s.flashRate, NORM.flashRate);
  if (id === "bass") return norm(s.motionS, NORM.motion);
  if (id === "lead") return norm(s.classFracS[1] + s.classFracS[2] + s.classFracS[3] + s.classFracS[4], NORM.lit);
  if (id === "pad") return norm(s.meanS, NORM.density);
  return 0;
}

export function createScore() {
  const mem = { T: 0, numeral: "i", next: "i", lead: null, voicing: null, padOn: false };

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

    return { events, chord, spoken: CHORDS[chord].spoken, T: mem.T, activity, slot, bar };
  }
  return { step };
}
