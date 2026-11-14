// Earth Band page (EARTH_BAND_GUIDE.md, phase 1): drum kit, bass, lead and harmony pad on one 16th-note grid.
// One transport, one master chain (src/audio.js, with its limiter), one gain per member, one shared reverb send.
// The score (score.js) decides every note from the frames; this file only turns its events into sound and pictures.
// No sound and no audio code before the visitor presses Play.
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import "../tokens.css";
import "./band.css";
import { logoSVG } from "../logo.js";
import { MEMBERS, BPM } from "./members.js";
import { createScore } from "./score.js";
import { CHORDS } from "./theory.js";
import { createBandAnalyzer } from "./analyzer.js";
import { createLayer } from "./layers.js";

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
$("logo").innerHTML = logoSVG(32);

// ---- live region, throttled: at most one update every 700 ms, latest messages joined ----
let pending = [], flushT = 0;
function announce(msg) {
  pending.push(msg);
  if (!flushT) flushT = setTimeout(() => { $("status").textContent = pending.slice(-3).join(" "); pending = []; flushT = 0; }, 700);
}

// ---- members: video, analyzer, ripple layer, pad state ----
const M = MEMBERS.map((def) => {
  const strip = document.querySelector(`.strip[data-member="${def.id}"]`);
  const video = strip.querySelector("video");
  video.src = def.rec.clip;
  const an = createBandAnalyzer(video, def.rec);
  video.addEventListener("loadeddata", () => an.tick(), { once: true });
  return { ...def, strip, video, an, layer: createLayer(strip.querySelector("canvas"), def.color),
    on: def.id === "bass", full: true, solo: false, activity: 0, out: null, notes: 0 };
});
const byId = Object.fromEntries(M.map((m) => [m.id, m]));
$("how").innerHTML = M.map((m) => `<li><strong>${m.role}, ${m.name}:</strong> ${m.describe}</li>`).join("");

const soloing = () => M.some((m) => m.solo);
const audible = (m) => (soloing() ? m.solo : m.on);

// ---- audio, loaded on the first Play ----
let A = null, step16 = 0, lateBeats = 0, lastChord = null;
const score = createScore();
async function loadAudio() {
  if (A) return A;
  const Tone = await import("tone");
  // "playback" latency gives larger audio buffers: fewer dropouts on phones while several videos decode. Notes are
  // scheduled ahead on the grid anyway, so the extra latency only delays a pad change by a fraction of a beat.
  Tone.setContext(new Tone.Context({ latencyHint: "playback", lookAhead: 0.15 }));
  const audio = await import("../audio.js"); // master gain + limiter, in this context
  await Tone.start();
  const transport = Tone.getTransport();
  transport.bpm.value = BPM;
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 1 }).connect(audio.master); // one shared send, kept low
  await reverb.ready;
  const hz = (m) => Tone.Frequency(m, "midi").toFrequency();
  const chain = (m, send) => { // member gain -> master, plus a send to the reverb after the gain (an off member sends nothing)
    m.out = new Tone.Gain(audible(m) ? 1 : 0).connect(audio.master);
    if (send) m.out.connect(new Tone.Gain(send).connect(reverb));
    return m.out;
  };
  const hp = (dest) => new Tone.Filter(150, "highpass").connect(dest); // everything except bass and kick is high-passed at 150 Hz

  // Drum kit (guide 3.8, levels 3.10): kick tuned to A1 and centered; snare and hat pan from the flash.
  const dOut = chain(byId.drums, 0.06);
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 4, envelope: { attack: 0.001, decay: 0.38, sustain: 0, release: 0.1 }, volume: -6 }).connect(dOut);
  const snarePan = new Tone.Panner(0).connect(hp(dOut));
  const snare = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 }, volume: -10 })
    .connect(new Tone.Filter({ type: "bandpass", frequency: 1800, Q: 0.9 }).connect(snarePan));
  const hatPan = new Tone.Panner(0).connect(dOut);
  const hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.035, sustain: 0 }, volume: -16 })
    .connect(new Tone.Filter(7000, "highpass").connect(hatPan));
  // Bass (3.7): saw through a lowpass, the only pitched part below 110 Hz, no reverb.
  const bassPan = new Tone.Panner(0).connect(chain(byId.bass, 0));
  const bass = new Tone.MonoSynth({ oscillator: { type: "sawtooth" }, filter: { Q: 2, type: "lowpass" },
    filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.3, baseFrequency: 90, octaves: 2.6 },
    envelope: { attack: 0.005, decay: 0.25, sustain: 0.6, release: 0.25 }, volume: -8 }).connect(bassPan);
  // Lead (3.6): triangle synth, two voices so a note's tail can ring under the next.
  const leadOut = hp(chain(byId.lead, 0.18));
  const leads = [0, 1].map(() => { const pan = new Tone.Panner(0).connect(leadOut); return { pan, synth: new Tone.Synth({ oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 0.4 }, volume: -10 }).connect(pan) }; });
  let leadN = 0;
  // Pad (3.9): slow triangle PolySynth through a lowpass that density opens; centered.
  const padFilter = new Tone.Filter(2400, "lowpass").connect(hp(chain(byId.pad, 0.3)));
  const pad = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 8, oscillator: { type: "triangle" },
    envelope: { attack: 0.8, decay: 0.4, sustain: 0.8, release: 1.6 }, volume: -16 }).connect(padFilter);

  const SIXTEENTH = 60 / BPM / 4;
  const play = (e, time) => {
    const m = byId[e.member], t = time + e.offset * SIXTEENTH;
    switch (e.voice) {
      case "kick": kick.triggerAttackRelease(hz(e.midi), "16n", t, e.vel); break;
      case "snare": snarePan.pan.setValueAtTime(e.pan, t); snare.triggerAttackRelease("16n", t, e.vel); break;
      case "hat": hatPan.pan.setValueAtTime(e.pan, t); hat.triggerAttackRelease("32n", t, e.vel); break;
      case "bass": bassPan.pan.setValueAtTime(e.pan, t); bass.triggerAttackRelease(hz(e.midi), e.dur, t, e.vel); break;
      case "lead": { const v = leads[leadN++ % 2]; v.pan.pan.setValueAtTime(e.pan, t); v.synth.triggerAttackRelease(hz(e.midi), e.dur, t, e.vel); break; }
      case "pad": { // keep common tones sounding; release only what leaves, attack only what arrives
        const prev = e.prev || [];
        const leaving = prev.filter((n) => !e.midis.includes(n)), arriving = e.midis.filter((n) => !prev.includes(n));
        if (leaving.length) pad.triggerRelease(leaving.map(hz), t);
        if (arriving.length) pad.triggerAttack(arriving.map(hz), t, e.vel);
        padFilter.frequency.rampTo(e.cutoff, 1.5, t);
        break;
      }
      case "padOff": pad.releaseAll(t); break;
    }
    if (e.voice !== "padOff" && e.voice !== "playhead") m.notes++;
    Tone.getDraw().schedule(() => {
      if (e.playhead !== undefined) m.layer.playhead(e.playhead);
      if (e.x !== undefined && e.voice !== "playhead") { m.layer.ripple(e.x, e.y, e.vel); pulse(m); }
    }, t);
  };

  transport.scheduleRepeat((time) => {
    if (time < Tone.getContext().rawContext.currentTime + 0.005) lateBeats++; // a step handled too late would glitch
    const members = {};
    for (const m of M) members[m.id] = { on: audible(m), full: m.full, s: m.an.state };
    const r = score.step(step16++, members);
    for (const e of r.events) play(e, time);
    if (r.slot % 4 === 0) Tone.getDraw().schedule(() => { M.forEach((m) => { m.activity = r.activity[m.id]; }); glow(); if (r.slot === 0) showChord(r); }, time);
  }, "16n");
  A = { Tone, audio, transport, pad };
  return A;
}

// Chord display: name and tension; a spoken update only when the chord changes (so at most once per bar), and only
// while "Announce chord changes" is ticked.
function showChord(r) {
  $("chord-name").textContent = CHORDS[r.chord].name;
  $("tension").textContent = `${r.T < 0.33 ? "calm" : r.T < 0.66 ? "moving" : "busy"} (${r.T.toFixed(2)})`;
  if (r.chord !== lastChord) { lastChord = r.chord; if ($("speak-chords").checked) announce(`${r.spoken}.`); }
}

// ---- pads (phase 1: one row per member: On, Full, Solo) ----
const COLS = ["on", "full", "solo"];
const padsEl = $("pads");
const ROWS = M.length;
padsEl.innerHTML = M.map((m, r) => `
  <div class="pad-row" data-member="${m.id}" style="--c: ${m.color}; --act: 0">
    <p class="row-label" aria-hidden="true"><span class="role">${m.role}</span> ${m.name}</p>
    ${COLS.map((c, k) => `<button type="button" class="pad pad-${c}" data-r="${r}" data-k="${k}" tabindex="${r === 0 && k === 0 ? 0 : -1}"
      aria-label="${m.role}, ${m.name.toLowerCase()}, ${c}" aria-pressed="false"><span class="pad-k">${c === "on" ? "On" : c === "full" ? "Full" : "Solo"}</span><span class="pad-s" aria-hidden="true"></span></button>`).join("")}
  </div>`).join("");
const pad = (r, k) => padsEl.querySelector(`[data-r="${r}"][data-k="${k}"]`);

function render() {
  M.forEach((m, r) => {
    const set = (k, pressed, state) => { const b = pad(r, k); b.setAttribute("aria-pressed", String(pressed)); b.querySelector(".pad-s").textContent = state; };
    set(0, m.on, m.on ? "Playing" : "Off");
    set(1, m.full, m.full ? "All notes" : "Sparse");
    set(2, m.solo, m.solo ? "Solo now" : "Hold");
    m.strip.classList.toggle("silent", !audible(m));
    if (m.out) m.out.gain.rampTo(audible(m) ? 1 : 0, 0.05);
    if (!audible(m)) m.layer.clear();
  });
}
render();

function pulse(m) {
  if (reduced) return;
  const row = padsEl.querySelector(`.pad-row[data-member="${m.id}"]`);
  row.classList.add("hit");
  setTimeout(() => row.classList.remove("hit"), 140);
}
function glow() {
  for (const m of M) padsEl.querySelector(`.pad-row[data-member="${m.id}"]`).style.setProperty("--act", (m.activity || 0).toFixed(2));
}

// On and Full: ordinary toggles (Space or Enter, click, tap).
let suppressClick = false;
padsEl.addEventListener("click", (e) => {
  const b = e.target.closest(".pad"); if (!b) return;
  const m = M[+b.dataset.r], col = COLS[+b.dataset.k];
  if (col === "on") { m.on = !m.on; announce(`${m.role} ${m.on ? "on" : "off"}.`); }
  else if (col === "full") { m.full = !m.full; announce(`${m.role} ${m.full ? "full" : "sparse"}.`); }
  else if (col === "solo") {
    if (suppressClick) { suppressClick = false; return; } // this click ends a hold
    m.solo = !m.solo; // no hold possible (for example a screen reader's activate): Solo latches instead
    if (m.solo) M.forEach((o) => { if (o !== m) o.solo = false; });
    announce(m.solo ? `${m.role} solo. Activate Solo again to return.` : "Solo off.");
  }
  render();
});

// Solo: hold to solo, release to return. Pointer and keyboard.
const soloStart = (m) => { if (m.solo) return; M.forEach((o) => { o.solo = o === m; }); render(); announce(`${m.role} solo.`); };
const soloEnd = (m) => { if (!m.solo) return; m.solo = false; suppressClick = true; render(); announce("Solo off."); setTimeout(() => { suppressClick = false; }, 400); };
padsEl.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".pad-solo"); if (!b || e.button > 0) return;
  b.setPointerCapture(e.pointerId); soloStart(M[+b.dataset.r]);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  padsEl.addEventListener(type, (e) => { const b = e.target.closest(".pad-solo"); if (b) soloEnd(M[+b.dataset.r]); });
}

// Arrow keys move within the grid (one tab stop); Solo holds while Space or Enter is held.
padsEl.addEventListener("keydown", (e) => {
  const b = e.target.closest(".pad"); if (!b) return;
  let r = +b.dataset.r, k = +b.dataset.k;
  const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
  if (mv) {
    e.preventDefault();
    r = (r + mv[0] + ROWS) % ROWS; k = (k + mv[1] + 3) % 3;
    b.tabIndex = -1; const nb = pad(r, k); nb.tabIndex = 0; nb.focus();
    return;
  }
  if (b.classList.contains("pad-solo") && (e.key === " " || e.key === "Enter")) {
    e.preventDefault(); // no click: the hold is the action
    if (!e.repeat) soloStart(M[r]);
  }
});
padsEl.addEventListener("keyup", (e) => {
  const b = e.target.closest(".pad-solo");
  if (b && (e.key === " " || e.key === "Enter")) { e.preventDefault(); soloEnd(M[+b.dataset.r]); }
});

// ---- transport ----
const playBtn = $("play");
let playing = false;
async function start() {
  playBtn.disabled = true; playBtn.textContent = "Loading sound…";
  try { await loadAudio(); } catch { playBtn.disabled = false; playBtn.textContent = "Play"; announce("The sound could not start in this browser."); return; }
  // Start with whatever videos are ready: a clip that is slow to arrive must not hold up the band.
  await Promise.race([Promise.all(M.map((m) => m.video.play().catch(() => {}))), new Promise((r) => setTimeout(r, 2500))]);
  A.audio.setVolume(+$("volume").value / 100);
  A.transport.start();
  playing = true; playBtn.disabled = false; playBtn.textContent = "Pause";
  announce(`Playing. ${M.filter(audible).map((m) => m.role).join(", ") || "Nothing"} on.`);
}
function stop(msg = "Paused.") {
  if (!playing) return;
  A.transport.pause();
  A.pad.releaseAll();
  M.forEach((m) => { m.video.pause(); m.layer.clear(); m.solo = false; });
  playing = false; playBtn.textContent = "Play";
  render(); announce(msg);
}
playBtn.addEventListener("click", () => (playing ? stop() : start()));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") stop("Stopped all sound."); });
$("volume").addEventListener("input", (e) => A?.audio.setVolume(e.target.value / 100));

// Record: the jukebox's "Save 20 s as WAV", on the same master chain.
const wavBtn = $("wav-btn");
let recTimer = null;
async function finishRecording() {
  clearTimeout(recTimer); recTimer = null;
  wavBtn.textContent = "Saving…";
  const blob = await A.audio.stopRecordingAsWav();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "earth-band.wav"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  wavBtn.textContent = "Save 20 s as WAV"; announce("Recording saved.");
}
wavBtn.addEventListener("click", async () => {
  if (recTimer) return finishRecording();
  if (!playing) await start();
  if (!A) return;
  await A.audio.startRecording();
  wavBtn.textContent = "Stop and save"; announce("Recording 20 seconds.");
  recTimer = setTimeout(finishRecording, 20000);
});

// ---- frame-rate guard ----
// Each band clip is 15 frames a second. If any member gets fewer than 8 frame callbacks a second for 5 seconds,
// or steps start arriving late, read every video at most 8 times a second and give audio a longer look-ahead.
const stats = (window.__bandStats = []); // per-second measurements, read by tests
let lowFor = 0, degraded = false;
setInterval(() => {
  const per = M.map((m) => ({ ...m.an.stats(), notes: m.notes }));
  M.forEach((m) => { m.notes = 0; });
  const late = lateBeats; lateBeats = 0;
  if (!playing || document.hidden) { lowFor = 0; return; }
  stats.push({ t: Math.round(performance.now() / 1000), late, chord: lastChord, ...Object.fromEntries(M.map((m, i) => [m.id, per[i]])) });
  if (stats.length > 600) stats.shift();
  const minCb = Math.min(...per.map((p) => p.callbacks));
  lowFor = minCb < 8 || late > 0 ? lowFor + 1 : 0;
  if (lowFor >= 5 && !degraded) {
    degraded = true;
    M.forEach((m) => m.an.setMaxRate(8));
    A.Tone.getContext().lookAhead = 0.3;
    const n = $("perf-notice");
    n.hidden = false;
    n.textContent = "This device is busy, so each video is now read 8 times a second instead of 15. The beat stays steady; the parts react a little more slowly.";
    announce("Reading the videos less often to keep the sound smooth.");
  }
}, 1000);
