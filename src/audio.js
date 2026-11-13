import * as Tone from "tone";
import { addRipple } from "./ripples.js";

// Master chain: every sound goes through here (AGENTS.md §8, §18).
const limiter = new Tone.Limiter(-3).toDestination();
export const master = new Tone.Gain(0.5).connect(limiter);
// The piece goes through musicBus so the probe can duck it; the probe plays straight into master.
export const musicBus = new Tone.Gain(1).connect(master);
export function duck(on) { musicBus.gain.rampTo(on ? 0.5 : 1, 0.15); }

export const SCALES = { majorPent: [0, 2, 4, 7, 9], minorPent: [0, 3, 5, 7, 10] };

// t = 0..1 (bottom to top) -> frequency snapped to the scale.
export function noteAt(t, scale, root = 48, octaves = 3) {
  const steps = scale.length * octaves;
  const i = Math.min(steps - 1, Math.max(0, Math.floor(t * steps)));
  const midi = root + 12 * Math.floor(i / scale.length) + scale[i % scale.length];
  return Tone.Frequency(midi, "midi").toFrequency();
}

// Sound families (AGENTS.md §8): one timbre per meaning, identical in every record.
export const FAMILY = {
  crack: () => new Tone.MembraneSynth({ octaves: 2, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }, volume: -6 }),
  warm: () => new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.06, decay: 0.3, sustain: 0.3, release: 0.8 }, volume: -10 }),
  cold: () => new Tone.FMSynth({ harmonicity: 3.5, modulationIndex: 4, envelope: { attack: 0.002, decay: 0.8, sustain: 0, release: 0.6 }, volume: -14 }),
  pluckA: () => new Tone.FMSynth({ harmonicity: 2, modulationIndex: 1.5, envelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.4 }, volume: -10 }),
  pluckB: () => new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.7, sustain: 0, release: 0.5 }, volume: -8 }),
};
// One color per voice; ripples use it.
export const COLORS = { crack: "#FFF3B0", warm: "#FF6B6B", cold: "#5CC8FF", pluckA: "#9B7BFF", pluckB: "#FF8A3D", light: "#FFC25C" };

// A pool of one instrument. play(x, y, vel, dur, time): x,y are 0..1 map coords.
// Position drives pan (x), pitch (y), and the ripple, so sound and picture can't drift apart.
export function makePool(makeSynth, { color, scale, root = 48, octaves = 3, size = 6, out = musicBus }) {
  const voices = Array.from({ length: size }, () => {
    const pan = new Tone.Panner(0).connect(out);
    return { synth: makeSynth().connect(pan), pan };
  });
  let n = 0;
  return (x, y, vel, dur, time, rippleColor = color) => {
    const v = voices[n++ % size];
    v.pan.pan.setValueAtTime(x * 2 - 1, time);
    v.synth.triggerAttackRelease(noteAt(1 - y, scale, root, octaves), dur, time, vel);
    Tone.getDraw().schedule(() => addRipple(x, y, rippleColor, vel), time);
  };
}

// Sustained layer (drone/pad): a running source behind a filter and a gain that starts silent.
const drones = [];
export function makeDrone(source, { cutoff = 800, pan = 0, out = musicBus } = {}) {
  const gain = new Tone.Gain(0).connect(new Tone.Panner(pan).connect(out));
  const filter = new Tone.Filter(cutoff, "lowpass").connect(gain);
  source.connect(filter).start();
  const d = {
    set(level, time, hz) {
      gain.gain.rampTo(level, 0.25, time);
      if (hz) filter.frequency.rampTo(hz, 0.25, time);
    },
    silence() { gain.gain.cancelScheduledValues(Tone.now()); gain.gain.rampTo(0, 0.2); },
  };
  if (out === musicBus) drones.push(d); // probe drones are managed by the probe
  return d;
}

export function silenceDrones() { drones.forEach((d) => d.silence()); }

export function setVolume(v) { master.gain.rampTo(v, 0.05); }
