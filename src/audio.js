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

// Every node a record creates is collected, so switching records can free them (running noise sources cost CPU).
let bag = null;
const keep = (...nodes) => { bag?.push(...nodes); return nodes[0]; };
export function withVoices(make) {
  bag = [];
  const v = make();
  const nodes = bag;
  bag = null;
  return { v, dispose() { nodes.forEach((n) => n.dispose()); drones = drones.filter((d) => !nodes.includes(d.gainNode)); } };
}

// Filtered-noise voice with a pitch: the bandpass centre follows the note, so pitch = height still holds.
function noiseVoice(type, Q, attack, release, volume) {
  return () => {
    const out = new Tone.Volume(volume);
    const env = new Tone.AmplitudeEnvelope({ attack, decay: 0.1, sustain: 0.7, release }).connect(out);
    const bp = new Tone.Filter({ type: "bandpass", Q }).connect(env);
    const noise = new Tone.Noise(type).connect(bp).start();
    return {
      dispose() { [noise, bp, env, out].forEach((n) => n.dispose()); },
      connect(node) { out.connect(node); return this; },
      triggerAttackRelease(freq, dur, time, vel = 1) { bp.frequency.setValueAtTime(freq, time); env.triggerAttackRelease(dur, time, vel); },
    };
  };
}

// Sound families (AGENTS.md §8): one timbre per meaning, identical in every record.
export const FAMILY = {
  dust: noiseVoice("white", 3, 0.02, 0.3, -6),     // gritty filtered noise
  smoke: noiseVoice("brown", 1.2, 0.08, 0.5, -2),  // muffled low breathy tone
  salt: noiseVoice("white", 9, 0.04, 0.4, -10),    // airy high hiss
  neutral: () => new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.02, decay: 0.6, sustain: 0.1, release: 0.6 }, volume: -10 }), // B-side default
  alert: () => new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 }, volume: -18 }), // EONET
  crack: () => new Tone.MembraneSynth({ octaves: 2, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }, volume: -6 }),
  warm: () => new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.06, decay: 0.3, sustain: 0.3, release: 0.8 }, volume: -10 }),
  cold: () => new Tone.FMSynth({ harmonicity: 3.5, modulationIndex: 4, envelope: { attack: 0.002, decay: 0.8, sustain: 0, release: 0.6 }, volume: -14 }),
  pluckA: () => new Tone.FMSynth({ harmonicity: 2, modulationIndex: 1.5, envelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.4 }, volume: -10 }),
  pluckB: () => new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.7, sustain: 0, release: 0.5 }, volume: -8 }),
};
// One color per voice; ripples use it.
export const COLORS = { crack: "#FFF3B0", warm: "#FF6B6B", cold: "#5CC8FF", pluckA: "#9B7BFF", pluckB: "#FF8A3D", light: "#FFC25C", dust: "#C39BDB", smoke: "#D2604A", salt: "#86AAA8", neutral: "#F4EFE6", alert: "#FF5C5C" };

// Scale presets are data (D7). Ragas are experimental until a teammate with a musical ear approves them.
export const RAGAS = {
  bhupali: { name: "Raga Bhupali (calm)", notes: [0, 2, 4, 7, 9] },
  durga: { name: "Raga Durga (calm)", notes: [0, 2, 5, 7, 9] },
  malkauns: { name: "Raga Malkauns (tense)", notes: [0, 3, 5, 8, 10] },
  yaman: { name: "Raga Yaman (evening)", notes: [0, 2, 4, 6, 7, 9, 11] },
};
let scaleOverride = null;
export function setScaleOverride(notes) { scaleOverride = notes; }

// A pool of one instrument. play(x, y, vel, dur, time): x,y are 0..1 map coords.
// Position drives pan (x), pitch (y), and the ripple, so sound and picture can't drift apart.
export function makePool(makeSynth, { color, scale, root = 48, octaves = 3, size = 6, out = musicBus }) {
  const voices = Array.from({ length: size }, () => {
    const pan = keep(new Tone.Panner(0).connect(out));
    return { synth: keep(makeSynth().connect(pan)), pan };
  });
  let n = 0;
  const play = (x, y, vel, dur, time, rippleColor = color) => {
    const v = voices[n++ % size];
    v.pan.pan.setValueAtTime(x * 2 - 1, time);
    v.synth.triggerAttackRelease(noteAt(1 - y, scaleOverride || scale, root, octaves), dur, time, vel);
    Tone.getDraw().schedule(() => addRipple(x, y, rippleColor, vel), time);
  };
  play.dispose = () => voices.forEach((v) => { v.synth.dispose(); v.pan.dispose(); });
  return play;
}

// Sustained layer (drone/pad): a running source behind a filter and a gain that starts silent.
let drones = [];
export function makeDrone(source, { cutoff = 800, pan = 0, out = musicBus } = {}) {
  const panner = keep(new Tone.Panner(pan).connect(out));
  const gain = keep(new Tone.Gain(0).connect(panner));
  const filter = keep(new Tone.Filter(cutoff, "lowpass").connect(gain));
  keep(source.connect(filter).start());
  const d = {
    gainNode: gain,
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

// ---- WAV export: tap the master, record, re-encode as 16-bit PCM WAV ----
let recorder;
export async function startRecording() {
  recorder ||= new Tone.Recorder();
  master.connect(recorder);
  await recorder.start();
}
export async function stopRecordingAsWav() {
  const blob = await recorder.stop();
  master.disconnect(recorder);
  const buf = await Tone.getContext().rawContext.decodeAudioData(await blob.arrayBuffer());
  return encodeWav(buf);
}
export function encodeWav(buf) {
  const ch = buf.numberOfChannels, len = buf.length, rate = buf.sampleRate;
  const view = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const str = (o, t) => [...t].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); view.setUint32(4, 36 + len * ch * 2, true); str(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, ch, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * ch * 2, true); view.setUint16(32, ch * 2, true); view.setUint16(34, 16, true);
  str(36, "data"); view.setUint32(40, len * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  for (let i = 0, o = 44; i < len; i++) for (let c = 0; c < ch; c++, o += 2) {
    const v = Math.max(-1, Math.min(1, data[c][i]));
    view.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}
