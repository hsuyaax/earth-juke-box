// Scales inspired by ragas (experimental). Pure: no Tone, no DOM, no randomness, so the tests can check it.
// A raga is more than a scale, and nobody trained in Hindustani music has reviewed this.
//
// Why the old presets sounded the same (measured on Night Lights, 30 s): Bhupali was exactly the default major pentatonic,
// Durga differed from it on 6% of the notes, and the tonic made up 43% of every preset's notes because nothing said where
// "home" was. So: one shared tonic for every preset, four presets whose interval patterns differ clearly, a drone that
// states the home note, and strong beats that lean on each preset's own strong notes (vadi and samvadi).
//
// notes: semitones above the tonic. vadi, samvadi: the two strong notes. drone: the interval held with the tonic
// (the fifth, or the fourth for Malkauns, which has no fifth).
export const RAGAS = {
  bhupali: { name: "Bhupali: open, bright", notes: [0, 2, 4, 7, 9], vadi: 4, samvadi: 9, drone: 7 },
  yaman: { name: "Yaman: evening, raised 4th", notes: [0, 2, 4, 6, 7, 9, 11], vadi: 4, samvadi: 11, drone: 7 },
  bhairav: { name: "Bhairav: dawn, flat 2nd and 6th", notes: [0, 1, 4, 5, 7, 8, 11], vadi: 8, samvadi: 1, drone: 7 },
  malkauns: { name: "Malkauns: dark, no 5th", notes: [0, 3, 5, 8, 10], vadi: 5, samvadi: 0, drone: 5 },
};

// The shared tonic: C, in the octave of each voice's own root (so registers stay where the record put them).
export const tonicFor = (root) => root - (((root % 12) + 12) % 12);

// t = 0..1 (bottom to top, from the data) -> a note of the raga in the voice's range, on the shared tonic.
// strong: a strong beat (1 or 3); a note one scale step from the vadi or samvadi moves onto it.
// end: the last note of a bar; a note one step from the tonic resolves to it.
export function ragaNote(t, raga, root, octaves = 3, { strong = false, end = false } = {}) {
  const n = raga.notes.length, steps = n * octaves, tonic = tonicFor(root);
  let i = Math.min(steps - 1, Math.max(0, Math.floor(t * steps)));
  const deg = (k) => raga.notes[((k % n) + n) % n];
  const near = (targets) => {
    if (targets.includes(deg(i))) return i;
    for (const k of [i - 1, i + 1]) if (k >= 0 && k < steps && targets.includes(deg(k))) return k;
    return i;
  };
  if (end) i = near([0]);
  else if (strong) i = near([raga.vadi, raga.samvadi]);
  return tonic + 12 * Math.floor(i / n) + deg(i);
}

// The drone's two notes for a voice whose root is `root`: the tonic and the fifth (or fourth), an octave below the root.
export const droneNotes = (raga, root = 48) => [tonicFor(root) - 12, tonicFor(root) - 12 + raga.drone];
