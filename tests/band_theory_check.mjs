// Earth Band theory and score checks (EARTH_BAND_GUIDE.md section 6). Pure: no browser, no audio.
import { PENT as PENT_SRC, KEY as KEY_SRC, CHORDS, pc, chordForBar, chordPcs, melodyNote, chordToneNear, bassRoot, voiceChord, movement } from "../src/band/theory.js";
import { createScore } from "../src/band/score.js";

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error("FAIL", msg); } };
const NUMS = Object.keys(CHORDS), LEAD = [60, 76], PAD = [45, 64];
// Expected sets written out here, independent of the module, so a wrong scale in theory.js cannot pass its own test.
const PENT = [9, 0, 2, 4, 7]; // A C D E G
const KEY = [9, 11, 0, 2, 4, 5, 7]; // A B C D E F G
ok(PENT_SRC.length === 5 && PENT_SRC.every((p) => PENT.includes(p)), "theory.js pentatonic is A C D E G");
ok(KEY_SRC.length === 7 && KEY_SRC.every((p) => KEY.includes(p)), "theory.js key is A natural minor");
const CH = { i: [9, 0, 4], III: [0, 4, 7], iv: [2, 5, 9], v: [4, 7, 11], VI: [5, 9, 0], VII: [7, 11, 2] };
for (const [nm, pcs] of Object.entries(CH)) ok(CHORDS[nm].pcs.join() === pcs.join(), `${nm} is spelled ${pcs}`);

// Seeded, so the synthetic "frames" are the same every run.
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// Synthetic engine states shaped like the real ones.
function frames() {
  const mk = (W, H, k) => ({ W, H, cls: new Uint8Array(W * H), v: new Float32Array(W * H), motion: new Float32Array(W * H), classFracS: new Float32Array(k), ready: true });
  const lead = mk(128, 72, 5), bass = mk(96, 48, 3);
  return {
    drums: { flashes: Array.from({ length: 6 }, () => ({ x: 0, y: 0, power: 0 })), nFlashes: 0, flashRate: 0, ready: true },
    bass, lead, pad: { meanS: 0, bx: 0.5, by: 0.5, ready: true },
    tick() { // new random features for the next 16th
      const d = this.drums; d.nFlashes = Math.floor(rnd() * 4); d.flashRate = rnd() * 18;
      for (let k = 0; k < d.nFlashes; k++) Object.assign(d.flashes[k], { x: rnd(), y: rnd(), power: rnd() });
      bass.classFracS[1] = 0.2 + 0.05 * rnd(); bass.classFracS[2] = 0.35 + 0.05 * rnd(); bass.motionS = 0.0019 + 0.0006 * rnd();
      for (let i = 0; i < bass.cls.length; i++) { bass.cls[i] = rnd() < 0.5 ? 1 + (rnd() < 0.4 ? 0 : 1) : 0; bass.motion[i] = rnd() * 0.01; }
      for (let i = 0; i < lead.cls.length; i++) { lead.cls[i] = rnd() < 0.05 ? 3 : 0; lead.v[i] = rnd(); }
      lead.classFracS[3] = 0.01 + 0.1 * rnd();
      this.pad.meanS = 0.08 + 0.4 * rnd();
    },
  };
}
function run(onSet, steps = 16 * 32) {
  seed = 7; const f = frames(), score = createScore(), out = [];
  for (let n = 0; n < steps; n++) {
    f.tick();
    const r = score.step(n, { drums: { on: onSet.drums, full: true, s: f.drums }, bass: { on: onSet.bass, full: true, s: f.bass }, lead: { on: onSet.lead, full: true, s: f.lead }, pad: { on: onSet.pad, full: true, s: f.pad } });
    out.push(r);
  }
  return out;
}
const ALL = { drums: true, bass: true, lead: true, pad: true };
const steps = run(ALL);
const events = steps.flatMap((r) => r.events.map((e) => ({ ...e, chord: r.chord, slot: r.slot, bar: r.bar })));

// 1. Every lead note is in A minor pentatonic and in range.
const leads = events.filter((e) => e.voice === "lead");
ok(leads.length > 50, `lead played (${leads.length} notes)`);
ok(leads.every((e) => PENT.includes(pc(e.midi)) && e.midi >= LEAD[0] && e.midi <= LEAD[1]), "every lead note is pentatonic and in range");
// No leap larger than an octave between consecutive lead notes.
ok(leads.every((e, i) => i === 0 || Math.abs(e.midi - leads[i - 1].midi) <= 12), "no lead leap over an octave");

// 2. Strong beats land on a chord tone whenever one is within 2 scale steps (checked over every height and chord).
for (const nm of NUMS) for (let t = 0; t <= 1.0001; t += 0.01) {
  const m = melodyNote(t, LEAD, nm, true);
  if (chordToneNear(t, LEAD, nm)) ok(CHORDS[nm].pcs.includes(pc(m)), `strong beat on ${nm} at height ${t.toFixed(2)} is a chord tone`);
  ok(PENT.includes(pc(m)) && PENT.includes(pc(melodyNote(t, LEAD, nm, false))), `melody note pentatonic (${nm}, ${t.toFixed(2)})`);
}

// 3. The bass plays the chord root on beat 1 of every bar.
const bars = steps.filter((r) => r.slot === 0);
ok(bars.every((r) => r.events.some((e) => e.voice === "bass" && e.midi === bassRoot(r.chord))), "bass root on beat 1 of every bar");
ok(events.filter((e) => e.voice === "bass").every((e) => e.midi >= 28 && e.midi <= 52 && KEY.includes(pc(e.midi))), "bass in range and in key");

// 4. Voicings stay in range and move little from one chord to the next.
let prev = null, worst = 0;
for (let k = 0; k < 400; k++) {
  const nm = NUMS[k % NUMS.length === 0 ? 0 : Math.floor(rnd() * NUMS.length)], dens = rnd();
  const v = voiceChord(chordPcs(nm, dens), PAD, prev);
  ok(v.every((m) => m >= PAD[0] && m <= PAD[1]), `pad voicing in range (${v})`);
  if (prev) { const mv = movement(prev, v); worst = Math.max(worst, mv / v.length); ok(mv <= 6 * v.length, `pad movement ${mv} for ${v.length} notes`); }
  prev = v;
}
const padEvents = events.filter((e) => e.voice === "pad");
ok(padEvents.length >= 8 && padEvents.every((e) => e.midis.every((m) => m >= PAD[0] && m <= PAD[1])), "pad events in range");

// 5. Phrase shape: bar 1 is i, bar 4 is VII or v; v never gets a 9th; every chord tone is in the key.
for (let T = 0; T <= 1.0001; T += 0.05) {
  ok(chordForBar(0, T) === "i", "bar 1 is i");
  ok(["VII", "v"].includes(chordForBar(3, T)), "bar 4 is VII or v");
  for (const nm of NUMS) ok(chordPcs(nm, T).every((p) => KEY.includes(p)), `${nm} at density ${T.toFixed(2)} stays in A natural minor`);
}
ok(!chordPcs("v", 1).includes(6) && chordPcs("v", 1).length === 4, "v gets a 7th but never a 9th");
ok(bars.every((r) => (r.bar % 4 === 0 ? r.chord === "i" : r.bar % 4 === 3 ? ["VII", "v"].includes(r.chord) : true)), "score phrases start on i and end on VII or v");

// 6. A member that is off produces zero notes.
const offRun = run({ drums: false, bass: true, lead: false, pad: false }).flatMap((r) => r.events);
ok(offRun.every((e) => e.member === "bass"), "members that are off play nothing");
ok(run({ drums: false, bass: false, lead: false, pad: false }).every((r) => r.events.length === 0), "all off: silence");

// 7. Same features twice, same notes.
ok(JSON.stringify(run(ALL).map((r) => r.events)) === JSON.stringify(steps.map((r) => r.events)), "deterministic");

// Drum kit: kick on beats 1 and 3, snare on 2 and 4, hats elsewhere; kick centered.
const drums = events.filter((e) => e.member === "drums");
ok(drums.length > 100, `drums played (${drums.length})`);
ok(drums.every((e) => { const s = e.slot + e.offset; return e.voice === (s % 8 === 0 ? "kick" : s % 8 === 4 ? "snare" : "hat"); }), "drum voice follows the slot");
ok(drums.filter((e) => e.voice === "kick").every((e) => e.pan === 0), "kick centered");

if (fails) { console.error(`band theory: ${fails} failed`); process.exit(1); }
console.log(`band theory ok (${leads.length} lead, ${drums.length} drum, ${padEvents.length} pad events; worst pad move ${worst.toFixed(1)} semitones per note)`);
