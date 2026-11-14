// Earth Band music theory (EARTH_BAND_GUIDE.md section 3). Pure functions: no Tone, no DOM, no randomness.
// Theory is a filter and a guide, never a source of notes: every function here takes a value that came from a frame
// (a height, a share, a level) and returns which exact note is allowed. Same input, same output.

export const pc = (m) => ((m % 12) + 12) % 12;
export const KEY = [9, 11, 0, 2, 4, 5, 7]; // A natural minor: A B C D E F G
export const PENT = [9, 0, 2, 4, 7]; // A minor pentatonic: A C D E G (a subset; consonant over every chord below)

// Diatonic chords of A natural minor. seventh and ninth are the diatonic extensions; v takes no 9th (F# is outside the key).
export const CHORDS = {
  i: { name: "Am", spoken: "A minor", pcs: [9, 0, 4], seventh: 7, ninth: 11 },
  III: { name: "C", spoken: "C major", pcs: [0, 4, 7], seventh: 11, ninth: 2 },
  iv: { name: "Dm", spoken: "D minor", pcs: [2, 5, 9], seventh: 0, ninth: 4 },
  v: { name: "Em", spoken: "E minor", pcs: [4, 7, 11], seventh: 2, ninth: null },
  VI: { name: "F", spoken: "F major", pcs: [5, 9, 0], seventh: 4, ninth: 7 },
  VII: { name: "G", spoken: "G major", pcs: [7, 11, 2], seventh: 5, ninth: 9 },
};

// Harmony conductor (section 3.3). barInPhrase 0..3; T = tension 0..1 from the switched-on members.
// Bar 1 is always home; bar 4 always leads back to it.
export function chordForBar(barInPhrase, T) {
  if (barInPhrase === 0) return "i";
  if (barInPhrase === 3) return T < 0.5 ? "VII" : "v";
  const col = T < 0.33 ? 0 : T < 0.66 ? 1 : 2;
  return (barInPhrase === 1 ? ["VI", "III", "iv"] : ["III", "VII", "v"])[col];
}

// Chord tones with extensions by density (section 3.9, pad): < 0.33 triad, 0.33-0.66 add the 7th, > 0.66 add the 9th if allowed.
export function chordPcs(numeral, density = 0) {
  const c = CHORDS[numeral], out = [...c.pcs];
  if (density >= 0.33) out.push(c.seventh);
  if (density > 0.66 && c.ninth !== null) out.push(c.ninth);
  return out;
}

// All MIDI notes in [lo, hi] whose pitch class is in pcs, ascending.
export function notesIn(lo, hi, pcs) {
  const out = [];
  for (let m = lo; m <= hi; m++) if (pcs.includes(pc(m))) out.push(m);
  return out;
}

// Lead and marimba (section 3.6). pitchT 0..1 (from the data) is mapped onto the member's pentatonic notes in range.
// Strong beat: move to the nearest chord tone (that is also pentatonic) within 2 scale steps; if none, keep the note.
// Then fold any leap larger than an octave back by octaves, staying in range.
export function melodyNote(pitchT, [lo, hi], numeral, strong, prev = null) {
  const pent = notesIn(lo, hi, PENT), last = pent.length - 1;
  let i = Math.min(last, Math.max(0, Math.round(pitchT * last)));
  if (strong) {
    const tones = CHORDS[numeral].pcs;
    search: for (let d = 0; d <= 2; d++) for (const j of d ? [i - d, i + d] : [i]) {
      if (j >= 0 && j <= last && tones.includes(pc(pent[j]))) { i = j; break search; }
    }
  }
  let n = pent[i];
  if (prev !== null) {
    while (n - prev > 12 && n - 12 >= lo) n -= 12;
    while (prev - n > 12 && n + 12 <= hi) n += 12;
  }
  return n;
}

// True when a chord tone lies within 2 pentatonic steps of the unsnapped note (used by the tests).
export function chordToneNear(pitchT, [lo, hi], numeral) {
  const pent = notesIn(lo, hi, PENT), last = pent.length - 1, i = Math.min(last, Math.max(0, Math.round(pitchT * last)));
  for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j <= last && CHORDS[numeral].pcs.includes(pc(pent[j]))) return true;
  return false;
}

// Bass (section 3.7), range E1-E3 (28-52). Root: the lowest root at or above E1.
export const BASS_RANGE = [28, 52];
export const bassRoot = (numeral) => 28 + pc(CHORDS[numeral].pcs[0] - 28);
// Root, third or fifth above the root, chosen by the warm share (0..1, already scaled to its measured range).
export function bassTone(numeral, warmT) {
  const r = bassRoot(numeral), k = warmT < 0.33 ? 0 : warmT < 0.66 ? 1 : 2;
  return r + pc(CHORDS[numeral].pcs[k] - r);
}
// One 16th slot of the bass. level 0..2 from motion (Sparse drops one level). Returns { midi, dur } or null.
// low: root on 1 and a chord tone on 3, half notes; medium: root on 1, fifth on 3; high: eighths, the octave on off-beats,
// and an approach note into the next root on the last eighth before a chord change.
export function bassStep(slot, numeral, next, level, warmT) {
  if (slot % 2) return null; // the bass lives on eighths at most
  const root = bassRoot(numeral), fifth = root + pc(CHORDS[numeral].pcs[2] - root);
  if (slot === 0) return { midi: root, dur: level === 2 ? "8n" : level === 1 ? "4n" : "2n" }; // beat 1: the root, always
  if (level === 0) return slot === 8 ? { midi: bassTone(numeral, warmT), dur: "2n" } : null;
  if (level === 1) return slot === 8 ? { midi: fifth, dur: "4n" } : null;
  if (slot === 14 && next !== numeral) { // approach: the scale step just below the next root (or just above it at the floor)
    const target = bassRoot(next), below = notesIn(BASS_RANGE[0], target - 1, KEY);
    return { midi: below.length ? below[below.length - 1] : notesIn(target + 1, BASS_RANGE[1], KEY)[0], dur: "8n" };
  }
  if (slot % 4 === 0) return { midi: bassTone(numeral, warmT), dur: "8n" };
  const onBeat = slot - 2 === 0 ? root : bassTone(numeral, warmT); // off-beat: the octave of the note just played
  return { midi: onBeat + 12 <= BASS_RANGE[1] ? onBeat + 12 : onBeat, dur: "8n" };
}

// Voice leading (section 3.5): place each chord tone at the octave nearest the previous voicing, inside the range.
// Common tones stay where they are; total movement is as small as the range allows.
export function voiceChord(pcs, [lo, hi], prev = null) {
  if (!prev || !prev.length) {
    const start = lo + Math.round((hi - lo) / 3); // first chord: close position in the lower middle of the range
    return pcs.map((p) => { let m = start + pc(p - start); while (m > hi) m -= 12; return m; }).sort((a, b) => a - b);
  }
  const out = pcs.map((p) => {
    let best = null, bestD = Infinity;
    for (const m of notesIn(lo, hi, [p])) { const d = Math.min(...prev.map((q) => Math.abs(m - q))); if (d < bestD || (d === bestD && m < best)) { best = m; bestD = d; } }
    return best;
  });
  return [...new Set(out)].sort((a, b) => a - b);
}
// Total movement from one voicing to the next: for each new note, the distance to the nearest previous note.
export const movement = (prev, next) => next.reduce((a, m) => a + Math.min(...prev.map((q) => Math.abs(m - q))), 0);

// Drum kit (section 3.8): which voice a 16th slot (0..15 in the bar) plays.
export const drumVoice = (slot) => (slot % 8 === 0 ? "kick" : slot % 8 === 4 ? "snare" : "hat");
