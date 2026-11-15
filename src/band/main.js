// Earth Band page (EARTH_BAND_GUIDE.md, phases 1-3): nine members on one 16th-note grid, three scenes.
// One transport, one master chain (src/audio.js, with its limiter), one gain per member, one shared reverb send.
// The score (score.js) decides every note from the frames; this file only turns its events into sound and pictures.
// A member's video loads the first time it is switched on, and plays only while it is on.
// No sound and no audio code before the visitor presses Play.
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import "../tokens.css";
import "./band.css";
import { logoSVG } from "../logo.js";
import { MEMBERS, SCENES, BPM } from "./members.js";
import { createScore } from "./score.js";
import { CHORDS } from "./theory.js";
import { createBandAnalyzer } from "./analyzer.js";
import { createLayer } from "./layers.js";
import { coverHTML } from "../covers.js";
import { createGlow } from "../glow.js";
import "../cover.css";
const COVER = { drums: "lightning", bass: "currents", lead: "nightlights", pad: "co2", shaker: "aerosols", arp: "perpetualocean", marimba: "gedi", strings: "atmosriver", drone: "airquality" };

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = matchMedia("(pointer: coarse)").matches || innerWidth < 820;
const CAP = 4, HOLD_MS = 350;
let degraded = false; // set by the frame-rate guard at the bottom
$("logo").innerHTML = logoSVG(32);

// ---- live region, throttled: at most one update every 700 ms, latest messages joined ----
let pending = [], flushT = 0;
function announce(msg) {
  pending.push(msg);
  if (!flushT) flushT = setTimeout(() => { $("status").textContent = pending.slice(-3).join(" "); pending = []; flushT = 0; }, 700);
}

// ---- members: strip (built now, empty), video and analyzer (made the first time the member is switched on) ----
const stripsEl = $("strips");
const M = MEMBERS.map((def) => {
  const fig = document.createElement("figure");
  fig.className = "strip"; fig.dataset.member = def.id; fig.style.setProperty("--c", def.color); fig.hidden = true;
  fig.innerHTML = `<div class="frame" style="aspect-ratio: ${def.aspect}"><video muted playsinline loop preload="auto" aria-hidden="true" tabindex="-1"></video><canvas aria-hidden="true"></canvas><p class="strip-msg">Loading clip…</p></div>
    <figcaption><span class="role">${def.role}</span> ${def.name}${def.years ? `, ${def.years}` : ""} <span class="src">SVS ${def.svs}</span>${def.positional ? "" : ' <span class="tag">Artistic, not geographic</span>'}</figcaption>`;
  stripsEl.append(fig);
  return { ...def, strip: fig, video: fig.querySelector("video"), layer: createLayer(fig.querySelector("canvas"), def.color), an: null,
    on: def.id === "bass", full: true, solo: false, activity: 0, out: null, notes: 0 };
});
const byId = Object.fromEntries(M.map((m) => [m.id, m]));
// The strips area glows with the colors of up to three members that are on (same rule as the jukebox deck).
const deckGlow = createGlow(stripsEl, () => M.filter((m) => m.on).map((m) => m.an?.state));
$("how").innerHTML = M.map((m) => `<li><strong>${m.role}, ${m.name}:</strong> ${m.describe}</li>`).join("");
function ensureMedia(m) {
  if (m.an) return;
  m.video.src = m.rec.clip;
  const msg = m.strip.querySelector(".strip-msg");
  m.video.addEventListener("loadeddata", () => { msg.hidden = true; }, { once: true });
  m.video.addEventListener("error", () => { msg.hidden = false; msg.textContent = "This clip did not load. Check the connection, or switch this part off."; });
  m.an = createBandAnalyzer(m.video, m.rec);
  if (degraded) m.an.setMaxRate(8); // switched on after a slow-down: start slowed
  m.video.addEventListener("loadeddata", () => m.an.tick(), { once: true });
}
M.filter((m) => m.on).forEach(ensureMedia);

const soloing = () => M.some((m) => m.solo);
const audible = (m) => m.on && (soloing() ? m.solo : true);

// ---- audio, loaded on the first Play ----
let A = null, step16 = 0, lateBeats = 0, lastChord = null, playing = false;
const score = createScore();
async function loadAudio() {
  if (A) return A;
  const Tone = await import("tone");
  // "playback" latency gives larger audio buffers: fewer dropouts on phones while several videos decode. Notes are
  // scheduled ahead on the grid anyway, so the extra latency only delays a pad change by a fraction of a beat.
  Tone.setContext(new Tone.Context({ latencyHint: "playback", lookAhead: 0.25 }));
  const audio = await import("../audio.js"); // master gain + limiter, in this context
  await Tone.start();
  const transport = Tone.getTransport();
  transport.bpm.value = BPM;
  const reverb = new Tone.Reverb({ decay: 2.0, wet: 0.7 }).connect(audio.master); // one shared send, kept low
  await reverb.ready;
  const hz = (m) => Tone.Frequency(m, "midi").toFrequency();
  const chain = (m, send) => { // member gain -> master, plus a send to the reverb after the gain (an off member sends nothing)
    m.out = new Tone.Gain(audible(m) ? 1 : 0).connect(audio.master);
    if (send) m.out.connect(new Tone.Gain(send).connect(reverb));
    return m.out;
  };
  const hp = (dest, hz = 150) => new Tone.Filter(hz, "highpass").connect(dest); // everything except bass and kick is high-passed at 150 Hz
  // (pad and drone at 100 Hz instead: their lowest note is A2, 110 Hz, which a 150 Hz high-pass would thin out)

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
  const bass = new Tone.MonoSynth({ oscillator: { type: "sawtooth" }, filter: { Q: 1, type: "lowpass" },
    filterEnvelope: { attack: 0.008, decay: 0.25, sustain: 0.25, baseFrequency: 80, octaves: 2.2 },
    envelope: { attack: 0.008, decay: 0.3, sustain: 0.5, release: 0.3 }, volume: -10 }).connect(bassPan);
  // Lead (3.6): triangle synth, two voices so a note's tail can ring under the next.
  const leadOut = hp(chain(byId.lead, 0.18));
  const leads = [0, 1].map(() => { const pan = new Tone.Panner(0).connect(leadOut); return { pan, synth: new Tone.Synth({ oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 0.4 }, volume: -10 }).connect(pan) }; });
  let leadN = 0;
  // Pad (3.9): slow triangle PolySynth through a lowpass that density opens; centered.
  const padFilter = new Tone.Filter(2400, "lowpass").connect(hp(chain(byId.pad, 0.3), 100));
  const pad = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 8, oscillator: { type: "triangle" },
    envelope: { attack: 1.0, decay: 0.5, sustain: 0.7, release: 2.0 }, volume: -18 }).connect(padFilter);
  // Shaker and atmosphere (3.9): the existing dust, sea-salt and smoke noise voices (src/audio.js), brought to the guide's levels.
  const shOut = hp(chain(byId.shaker, 0.1));
  const noise = (make, trim) => { const pan = new Tone.Panner(0).connect(shOut); return { pan, synth: make().connect(new Tone.Volume(trim).connect(pan)) }; };
  const sh = { dust: noise(audio.FAMILY.dust, -18), salt: noise(audio.FAMILY.salt, -16), smoke: noise(audio.FAMILY.smoke, -24) };
  // Arpeggio (3.9): short FM bell, integer ratio so its overtones stay consonant; two fixed pans, alternating.
  const arpOut = hp(chain(byId.arp, 0.2));
  const arps = [-0.5, 0.5].map((p) => new Tone.FMSynth({ harmonicity: 3, modulationIndex: 2, envelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.2 },
    modulationEnvelope: { attack: 0.002, decay: 0.15, sustain: 0, release: 0.1 }, volume: -16 }).connect(new Tone.Panner(p).connect(arpOut)));
  // Marimba (3.9): sine with a fast decay plus a short FM click, fixed pan +0.3.
  const mPan = new Tone.Panner(0.3).connect(hp(chain(byId.marimba, 0.15)));
  const marimba = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 }, volume: -14 }).connect(mPan);
  const click = new Tone.FMSynth({ harmonicity: 4, modulationIndex: 8, envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 }, volume: -32 }).connect(mPan);

  // Strings (3.9): one saw voice with a slow attack and a glide between bar lines, through a lowpass and a chorus; pan -0.3.
  const strings = new Tone.MonoSynth({ oscillator: { type: "sawtooth" }, portamento: 0.3, filter: { type: "lowpass", Q: 0.5 },
    filterEnvelope: { attack: 0.6, decay: 0.5, sustain: 0.7, baseFrequency: 500, octaves: 1.6 },
    envelope: { attack: 0.6, decay: 0.3, sustain: 0.8, release: 1.2 }, volume: -16 })
    .connect(new Tone.Chorus(1.5, 2.5, 0.25).start().connect(new Tone.Panner(-0.3).connect(hp(chain(byId.strings, 0.2)))));
  // Drone (3.9): A2 and E3 held, through a lowpass and a tremolo, faded in and out; never changes pitch.
  const droneGain = new Tone.Gain(0).connect(hp(chain(byId.drone, 0.15), 100));
  const tremolo = new Tone.Tremolo(1, 0.5).start().connect(droneGain);
  const droneFilter = new Tone.Filter(400, "lowpass").connect(tremolo);
  const droneOscs = [hz(45), hz(52)].map((f) => new Tone.Oscillator({ frequency: f, type: "triangle", volume: -24 }).connect(droneFilter));
  let droneStarted = false;

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
        // Guard: releaseAll before re-voicing avoids PolySynth clicks from releasing notes it lost track of
        if (leaving.length) { try { pad.triggerRelease(leaving.map(hz), t); } catch { pad.releaseAll(t); } }
        if (arriving.length) pad.triggerAttack(arriving.map(hz), t, e.vel);
        padFilter.frequency.rampTo(e.cutoff, 2.0, t);
        break;
      }
      case "padOff": pad.releaseAll(t); break;
      case "dust": case "salt": case "smoke": { const v = sh[e.voice]; v.pan.pan.setValueAtTime(e.pan, t); v.synth.triggerAttackRelease(hz(e.midi), e.dur, t, e.vel); break; }
      case "arp": arps[e.pan < 0 ? 0 : 1].triggerAttackRelease(hz(e.midi), e.dur, t, e.vel); break;
      case "marimba": marimba.triggerAttackRelease(hz(e.midi), e.dur, t, e.vel); click.triggerAttackRelease(hz(e.midi + 24), "64n", t, e.vel); break;
      case "strings": strings.triggerAttackRelease(hz(e.midi), "1m", t, e.vel); break;
      case "drone": if (!droneStarted) { droneOscs.forEach((o) => o.start(t)); droneStarted = true; } droneGain.gain.rampTo(e.vel, 2, t); // fall through to set
      case "droneSet": droneFilter.frequency.rampTo(e.cutoff, 2, t); tremolo.frequency.rampTo(e.rate, 2, t); if (e.voice === "droneSet") droneGain.gain.rampTo(e.vel, 2, t); break;
      case "droneOff": droneGain.gain.rampTo(0, 1.5, t); break;
    }
    if (!["padOff", "playhead", "droneSet", "droneOff"].includes(e.voice)) m.notes++;
    Tone.getDraw().schedule(() => {
      if (e.playhead !== undefined) m.layer.playhead(e.playhead);
      if (e.x !== undefined && e.voice !== "playhead") { m.layer.ripple(e.x, e.y, e.vel); pulse(m); } // a drone's bar update ripples too: it is still sounding
    }, t);
  };

  transport.scheduleRepeat((time) => {
    if (time < Tone.getContext().rawContext.currentTime + 0.005) lateBeats++; // a step handled too late would glitch
    const members = {};
    for (const m of M) members[m.id] = { on: audible(m), full: m.full, s: m.an?.state };
    const r = score.step(step16++, members);
    for (const e of r.events) play(e, time);
    if (r.slot % 4 === 0) Tone.getDraw().schedule(() => { M.forEach((m) => { m.activity = m.on ? r.activity[m.id] : 0; }); glow(); if (r.slot === 0) { showChord(r); deckGlow.breathe(); } }, time);
  }, "16n");
  A = { Tone, audio, transport, release: () => { pad.releaseAll(); try { strings.triggerRelease(); } catch {} droneGain.gain.rampTo(0, 0.5); bass.triggerRelease(); } };
  return A;
}

// Chord display: name and tension; a spoken update only when the chord changes (so at most once per bar), and only
// while "Announce chord changes" is ticked.
function showChord(r) {
  $("chord-name").textContent = CHORDS[r.chord].name;
  $("tension").textContent = `${r.T < 0.33 ? "calm" : r.T < 0.66 ? "moving" : "busy"} (${r.T.toFixed(2)})`;
  if (r.chord !== lastChord) { lastChord = r.chord; if ($("speak-chords").checked) announce(`${r.spoken}.`); }
}

// ---- pads: one per member in a 3-column grid. Tap = on or off. Hold (or S) = solo. ----
const padsEl = $("pads");
padsEl.innerHTML = M.map((m, i) => `<button type="button" class="pad" data-i="${i}" tabindex="${i === 0 ? 0 : -1}" style="--c: ${m.color}; --act: 0"
  aria-label="${m.role}, ${m.name.toLowerCase()}, on" aria-pressed="false"><span class="pad-face" aria-hidden="true">${coverHTML(COVER[m.id], { ink: m.color })}</span><span class="role">${m.role}</span><span class="pad-name">${m.name}</span><span class="pad-s" aria-hidden="true"></span></button>`).join("");
const pads = [...padsEl.querySelectorAll(".pad")];
let target = byId.bass; // the member the Sparse toggle applies to: the focused or last-touched pad
const sparseBtn = $("sparse");

function render() {
  M.forEach((m, i) => {
    const b = pads[i];
    b.setAttribute("aria-pressed", String(m.on));
    b.querySelector(".pad-s").textContent = [m.on ? "On" : "Off", m.on && !m.full ? "sparse" : "", m.solo ? "solo" : ""].filter(Boolean).join(" · ");
    b.classList.toggle("soloed", m.solo);
    m.strip.hidden = !m.on;
    if (m.out) m.out.gain.rampTo(audible(m) ? 1 : 0, 0.15);
    if (!audible(m)) m.layer.clear();
  });
  sparseBtn.textContent = `Sparse: ${target.role}`;
  sparseBtn.setAttribute("aria-pressed", String(!target.full));
}

function setOn(m, on) {
  if (on === m.on) return;
  if (on && !roomFor()) { refuse(); return; }
  m.on = on;
  if (on) { ensureMedia(m); if (playing) m.video.play().catch(() => {}); }
  else { m.video.pause(); m.solo = false; }
  render(); announce(`${m.role} ${on ? "on" : "off"}.`);
}
// The cap (guide 4): at most 4 on phones. On a desktop, a fifth or more only while the last 5 seconds showed every member
// that is on getting 12 or more analyses a second with no late steps.
function roomFor() {
  const n = M.filter((m) => m.on).length;
  if (n < CAP) return true;
  if (phone || !playing) return false;
  const recent = stats.slice(-5);
  return recent.length === 5 && recent.every((s) => s.late === 0 && M.filter((m) => m.on).every((m) => (s[m.id]?.analyses ?? 0) >= 12));
}
function refuse() {
  const msg = phone ? `At most ${CAP} parts play at once on a phone. Switch one off first.`
    : !playing ? `At most ${CAP} parts to start with. Press Play; if this computer keeps up, you can add more.`
      : `This computer is busy, so ${CAP} parts is the limit for now. Switch one off first.`;
  $("cap-msg").textContent = msg; $("cap-msg").hidden = false;
  clearTimeout(refuse.t); refuse.t = setTimeout(() => { $("cap-msg").hidden = true; }, 6000);
  announce(msg);
}
function soloStart(m) {
  if (!m.on) { announce(`Switch ${m.role} on first.`); return; }
  M.forEach((o) => { o.solo = o === m; }); render(); announce(`${m.role} solo.`);
}
function soloEnd(m) { if (!m.solo) return; m.solo = false; render(); announce("Solo off."); }

function pulse(m) {
  if (reduced) return;
  const b = pads[M.indexOf(m)];
  b.classList.add("hit");
  setTimeout(() => b.classList.remove("hit"), 140);
}
function glow() { M.forEach((m, i) => pads[i].style.setProperty("--act", (m.activity || 0).toFixed(2))); }

// Tap or hold, by pointer.
let hold = null; // { m, timer, held }
let handled = false; // the click that follows a handled tap or hold is ignored
padsEl.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".pad"); if (!b || e.button > 0) return;
  const m = M[+b.dataset.i]; target = m; render();
  b.setPointerCapture(e.pointerId);
  hold = { m, held: false, timer: setTimeout(() => { hold.held = true; soloStart(m); }, HOLD_MS) };
});
const endPointer = (cancel) => {
  if (!hold) return;
  clearTimeout(hold.timer);
  if (hold.held) soloEnd(hold.m); else if (!cancel) setOn(hold.m, !hold.m.on);
  hold = null; handled = true; setTimeout(() => { handled = false; }, 400);
};
padsEl.addEventListener("pointerup", () => endPointer(false));
padsEl.addEventListener("pointercancel", () => endPointer(true));
// A click with no pointer or key before it (a screen reader's activate) switches the member on or off.
padsEl.addEventListener("click", (e) => {
  const b = e.target.closest(".pad"); if (!b) return;
  if (handled) { handled = false; return; }
  const m = M[+b.dataset.i]; target = m; setOn(m, !m.on);
});

// Keyboard: arrows move in the grid (one tab stop); Space or Enter taps, holding it solos; S solos too (latched).
padsEl.addEventListener("focusin", (e) => { const b = e.target.closest(".pad"); if (b) { target = M[+b.dataset.i]; render(); } });
padsEl.addEventListener("keydown", (e) => {
  const b = e.target.closest(".pad"); if (!b) return;
  const i = +b.dataset.i, n = pads.length;
  const to = { ArrowLeft: (i - 1 + n) % n, ArrowRight: (i + 1) % n, ArrowUp: i - 3 >= 0 ? i - 3 : i + 3 * Math.floor((n - 1 - i) / 3), ArrowDown: i + 3 < n ? i + 3 : i % 3, Home: 0, End: n - 1 }[e.key];
  if (to !== undefined) { e.preventDefault(); b.tabIndex = -1; pads[to].tabIndex = 0; pads[to].focus(); return; }
  const m = M[i];
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (!e.repeat && !hold) hold = { m, held: false, timer: setTimeout(() => { hold.held = true; soloStart(m); }, HOLD_MS) };
  } else if (e.key === "s" || e.key === "S") {
    if (m.solo) soloEnd(m); else soloStart(m);
  }
});
padsEl.addEventListener("keyup", (e) => {
  if ((e.key === " " || e.key === "Enter") && hold) { e.preventDefault(); endPointer(false); }
});

// Scenes: switch to exactly these four members (others off first, so the cap is never hit).
$("scenes").innerHTML = SCENES.map((sc) => `<button type="button" data-scene="${sc.id}">${sc.name}<span class="scene-who">${sc.members.map((id) => byId[id].role).join(", ")}</span></button>`).join("");
$("scenes").addEventListener("click", (e) => {
  const b = e.target.closest("[data-scene]"); if (!b) return;
  const sc = SCENES.find((x) => x.id === b.dataset.scene);
  M.forEach((m) => { m.solo = false; if (m.on && !sc.members.includes(m.id)) { m.on = false; m.video.pause(); } });
  sc.members.forEach((id) => { const m = byId[id]; if (!m.on) { m.on = true; ensureMedia(m); if (playing) m.video.play().catch(() => {}); } });
  render(); announce(`${sc.name}: ${sc.members.map((id) => byId[id].role).join(", ")}.`);
});

sparseBtn.addEventListener("click", () => { target.full = !target.full; render(); announce(`${target.role} ${target.full ? "full" : "sparse"}.`); });
render();

// ---- transport ----
const playBtn = $("play");
async function start() {
  playBtn.disabled = true; playBtn.textContent = "Loading sound…";
  try { await loadAudio(); } catch { playBtn.disabled = false; playBtn.textContent = "Play"; announce("The sound could not start in this browser."); return; }
  // Start with whatever videos are ready: a clip that is slow to arrive must not hold up the band.
  await Promise.race([Promise.all(M.filter((m) => m.on).map((m) => m.video.play().catch(() => {}))), new Promise((r) => setTimeout(r, 2500))]);
  A.audio.setVolume(+$("volume").value / 100);
  A.transport.start();
  playing = true; playBtn.disabled = false; playBtn.textContent = "Pause";
  announce(`Playing. ${M.filter(audible).map((m) => m.role).join(", ") || "Nothing"} on.`);
}
function stop(msg = "Paused.") {
  if (!playing) return;
  A.transport.pause();
  A.release();
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
// Each band clip is 15 frames a second. If any member that is on gets fewer than 8 frame callbacks a second for
// 5 seconds, or steps start arriving late, read every video at most 8 times a second and give audio a longer look-ahead.
const stats = (window.__bandStats = []); // per-second measurements, read by tests and by the cap
let lowFor = 0;
setInterval(() => {
  const per = M.map((m) => ({ ...(m.an ? m.an.stats() : { callbacks: 0, analyses: 0, skipped: 0, mainMs: 0, workerMs: 0 }), notes: m.notes }));
  M.forEach((m) => { m.notes = 0; });
  const late = lateBeats; lateBeats = 0;
  if (!playing || document.hidden) { lowFor = 0; return; }
  stats.push({ t: Math.round(performance.now() / 1000), late, chord: lastChord, on: M.filter((m) => m.on).map((m) => m.id), ...Object.fromEntries(M.map((m, i) => [m.id, per[i]])) });
  if (stats.length > 600) stats.shift();
  const onIdx = M.map((m, i) => (m.on ? i : -1)).filter((i) => i >= 0);
  const minCb = onIdx.length ? Math.min(...onIdx.map((i) => per[i].callbacks)) : 15;
  lowFor = minCb < 8 || late > 0 ? lowFor + 1 : 0;
  if (lowFor >= 5 && !degraded) {
    degraded = true;
    M.forEach((m) => m.an?.setMaxRate(8));
    A.Tone.getContext().lookAhead = 0.3;
    const n = $("perf-notice");
    n.hidden = false;
    n.textContent = "This device is busy, so each video is now read 8 times a second instead of 15. The beat stays steady; the parts react a little more slowly.";
    announce("Reading the videos less often to keep the sound smooth.");
  }
}, 1000);
