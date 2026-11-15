// Scales inspired by ragas (POLISH_PASS_3 part B4). Pure: no browser, no audio.
import { RAGAS, ragaNote, droneNotes, tonicFor } from "../src/ragas.js";

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error("FAIL", m); } };
const pc = (m) => ((m % 12) + 12) % 12;
// Expected interval sets, written out here so a mistake in ragas.js cannot pass its own test.
const EXPECT = { bhupali: [0, 2, 4, 7, 9], yaman: [0, 2, 4, 6, 7, 9, 11], bhairav: [0, 1, 4, 5, 7, 8, 11], malkauns: [0, 3, 5, 8, 10] };
const STRONG = { bhupali: [4, 9], yaman: [4, 11], bhairav: [8, 1], malkauns: [5, 0] };
for (const [id, notes] of Object.entries(EXPECT)) {
  ok(RAGAS[id] && RAGAS[id].notes.join() === notes.join(), `${id} is ${notes}`);
  ok(RAGAS[id] && [RAGAS[id].vadi, RAGAS[id].samvadi].join() === STRONG[id].join(), `${id} strong notes ${STRONG[id]}`);
}

// 1. Relative to the tonic, every pair of presets differs by at least two notes.
const ids = Object.keys(EXPECT);
for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
  const A = new Set(RAGAS[ids[a]].notes), B = new Set(RAGAS[ids[b]].notes);
  const diff = [...A].filter((x) => !B.has(x)).length + [...B].filter((x) => !A.has(x)).length;
  ok(diff >= 2, `${ids[a]} and ${ids[b]} differ by ${diff} notes`);
}

// 2. For a fixed feature input (an even sweep of heights), the strong-beat histogram's most common note is the vadi or samvadi.
for (const id of ids) {
  const h = Array(12).fill(0);
  for (let k = 0; k <= 200; k++) h[pc(ragaNote(k / 200, RAGAS[id], 48, 3, { strong: true }))]++;
  const top = h.indexOf(Math.max(...h));
  ok(STRONG[id].includes(top), `${id}: strong beats most often on ${top}, expected ${STRONG[id]}`);
}

// Every note stays in the preset, on the shared tonic, in the voice's range; bar ends resolve to the tonic when near it.
for (const id of ids) for (let k = 0; k <= 100; k++) for (const ctx of [{}, { strong: true }, { end: true }]) {
  const m = ragaNote(k / 100, RAGAS[id], 45, 3, ctx);
  ok(EXPECT[id].includes(pc(m - tonicFor(45))) && m >= tonicFor(45) && m < tonicFor(45) + 36, `${id} note ${m} in scale and range`);
}
ok(ragaNote(0.02, RAGAS.yaman, 48, 3, { end: true }) % 12 === 0, "a bar's last note one step from the tonic resolves to it");
ok(tonicFor(45) === 36 && tonicFor(48) === 48 && tonicFor(60) === 60, "one shared tonic (C) in each voice's octave");

// The drone: tonic and fifth, or tonic and fourth for Malkauns (no fifth).
ok(droneNotes(RAGAS.yaman).join() === "36,43" && droneNotes(RAGAS.malkauns).join() === "36,41", "drone is tonic + fifth (fourth for Malkauns)");

// 3. Same input twice, same notes.
const run = () => ids.map((id) => Array.from({ length: 64 }, (_, k) => ragaNote((k * 37 % 64) / 64, RAGAS[id], 48, 3, { strong: k % 4 === 0, end: k % 8 === 7 })).join()).join("|");
ok(run() === run(), "deterministic");

if (fails) { console.error(`ragas: ${fails} failed`); process.exit(1); }
console.log("ragas ok");
