// Earth Band page: three members, one transport, one master chain (src/audio.js, with its limiter), one gain per member.
// No sound and no audio code before the visitor presses Play.
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import "../tokens.css";
import "./band.css";
import { logoSVG } from "../logo.js";
import { MEMBERS, BEATS, SCALE, BPM } from "./members.js";
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
    on: def.id === "bass", full: true, solo: false, activity: 0, out: null, play: null, notes: 0 };
});
$("how").innerHTML = M.map((m) => `<li><strong>${m.role}, ${m.name.toLowerCase()}:</strong> ${m.describe}</li>`).join("");

const soloing = () => M.some((m) => m.solo);
const audible = (m) => (soloing() ? m.solo : m.on);

// ---- audio, loaded on the first Play ----
let A = null, beat = 0, lateBeats = 0;
async function loadAudio() {
  if (A) return A;
  const Tone = await import("tone");
  // "playback" latency gives larger audio buffers: fewer dropouts on phones while three videos decode. Notes are
  // scheduled ahead on the beat grid anyway, so the extra latency only delays a pad change by a fraction of a beat.
  Tone.setContext(new Tone.Context({ latencyHint: "playback", lookAhead: 0.15 }));
  const audio = await import("../audio.js"); // master gain + limiter, in this context
  await Tone.start();
  const transport = Tone.getTransport();
  transport.bpm.value = BPM;
  for (const m of M) {
    m.out = new Tone.Gain(audible(m) ? 1 : 0).connect(audio.master);
    const pool = (make, size) => {
      const v = Array.from({ length: size }, () => { const pan = new Tone.Panner(0).connect(m.out); return { synth: make().connect(pan), pan }; });
      let n = 0;
      return () => v[n++ % size];
    };
    const pools = m.id === "drums" ? { a: pool(audio.FAMILY.crack, 6) }
      : m.id === "bass" ? { a: pool(() => new Tone.MonoSynth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, baseFrequency: 140, octaves: 2.5 }, volume: -4 }), 2) }
      : { a: pool(audio.FAMILY.pluckA, 4), b: pool(audio.FAMILY.pluckB, 4) };
    const { root, octaves } = m.range;
    // One note: x -> pan and ripple, pitchT (default: height on the map) -> pitch in this member's range, snapped to the shared scale.
    m.play = (x, y, vel, dur, time, pitchT = 1 - y, which = "a") => {
      const v = pools[which]();
      m.notes++;
      v.pan.pan.setValueAtTime(x * 2 - 1, time);
      v.synth.triggerAttackRelease(audio.noteAt(pitchT, SCALE, root, octaves), dur, time, vel);
      Tone.getDraw().schedule(() => m.layer.ripple(x, y, vel), time);
    };
  }
  const noop = () => {};
  transport.scheduleRepeat((time) => {
    if (time < Tone.getContext().rawContext.currentTime + 0.005) lateBeats++; // a beat handled too late would glitch
    const b = beat++;
    for (const m of M) {
      const s = m.an.state;
      if (!s.ready) continue;
      const on = audible(m);
      const playhead = on ? (x, t) => Tone.getDraw().schedule(() => m.layer.playhead(x), t) : noop;
      const n = BEATS[m.id](s, m, on ? m.play : noop, time, b, m.full, playhead);
      if (n && on) Tone.getDraw().schedule(() => pulse(m), time);
    }
    Tone.getDraw().schedule(glow, time);
  }, "8n");
  A = { Tone, audio, transport };
  return A;
}

// ---- pads ----
const COLS = ["on", "full", "solo"];
const padsEl = $("pads");
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
  for (const m of M) padsEl.querySelector(`.pad-row[data-member="${m.id}"]`).style.setProperty("--act", m.activity.toFixed(2));
}

// On and Full: ordinary toggles (Space or Enter, click, tap).
padsEl.addEventListener("click", (e) => {
  const b = e.target.closest(".pad"); if (!b) return;
  const m = M[+b.dataset.r], col = COLS[+b.dataset.k];
  if (col === "on") { m.on = !m.on; announce(`${m.role} ${m.on ? "on" : "off"}.`); }
  else if (col === "full") { m.full = !m.full; announce(`${m.role} ${m.full ? "full" : "sparse"}.`); }
  else if (col === "solo") {
    if (suppressClick) { suppressClick = false; return; } // this click ends a hold
    m.solo = !m.solo; // no hold possible (for example a screen reader's activate): Solo latches instead
    announce(m.solo ? `${m.role} solo. Activate Solo again to return.` : `Solo off.`);
  }
  render();
});

// Solo: hold to solo, release to return. Pointer and keyboard.
let suppressClick = false;
const soloStart = (m) => { if (m.solo) return; M.forEach((o) => { o.solo = o === m; }); render(); announce(`${m.role} solo.`); };
const soloEnd = (m) => { if (!m.solo) return; m.solo = false; suppressClick = true; render(); announce("Solo off."); setTimeout(() => { suppressClick = false; }, 400); };
padsEl.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".pad-solo"); if (!b || e.button > 0) return;
  b.setPointerCapture(e.pointerId); soloStart(M[+b.dataset.r]);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  padsEl.addEventListener(type, (e) => { const b = e.target.closest(".pad-solo"); if (b) soloEnd(M[+b.dataset.r]); });
}

// Arrow keys move within the 3 x 3 grid (one tab stop); Solo holds while Space or Enter is held.
padsEl.addEventListener("keydown", (e) => {
  const b = e.target.closest(".pad"); if (!b) return;
  let r = +b.dataset.r, k = +b.dataset.k;
  const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
  if (mv) {
    e.preventDefault();
    r = (r + mv[0] + 3) % 3; k = (k + mv[1] + 3) % 3;
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
  await Promise.all(M.map((m) => m.video.play().catch(() => {})));
  A.audio.setVolume(+$("volume").value / 100);
  A.transport.start();
  playing = true; playBtn.disabled = false; playBtn.textContent = "Pause";
  announce(`Playing. ${M.filter(audible).map((m) => m.role).join(", ") || "Nothing"} on.`);
}
function stop(msg = "Paused.") {
  if (!playing) return;
  A.transport.pause();
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
// or beats start arriving late, read every video at most 8 times a second and give audio a longer look-ahead.
const stats = (window.__bandStats = []); // per-second measurements, read by tests
let lowFor = 0, degraded = false;
setInterval(() => {
  const per = M.map((m) => ({ ...m.an.stats(), notes: m.notes }));
  M.forEach((m) => { m.notes = 0; });
  const late = lateBeats; lateBeats = 0;
  if (!playing || document.hidden) { lowFor = 0; return; }
  stats.push({ t: Math.round(performance.now() / 1000), late, ...Object.fromEntries(M.map((m, i) => [m.id, per[i]])) });
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
