import * as Tone from "tone";
// Self-hosted (no runtime calls to font CDNs, AGENTS.md §18).
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/bricolage-grotesque/700.css";
import "./style.css";
import { createAnalyzer } from "./analysis.js";
import { withVoices, setVolume, silenceDrones, RAGAS, setScaleOverride, startRecording, stopRecordingAsWav } from "./audio.js";
import { setView, clearRipples, setMarkers } from "./ripples.js";
import { createEonet, events } from "./eonet.js";
import { setOverlayRecord, toggleOverlay, drawOverlay } from "./overlay.js";
import { createProbe } from "./explore.js";
import lightning from "./records/lightning.js";
import nightlights from "./records/nightlights.js";
import currents from "./records/currents.js";
import aerosols from "./records/aerosols.js";
import { BSIDES } from "./records/bside.js";
import today from "./records/today.js";

const FEATURED = [lightning, nightlights, currents];
const RECORDS = [...FEATURED, aerosols, ...BSIDES, today]; // keys 1-9, then 0
const keyOf = (i) => (i === 9 ? "0" : String(i + 1));
const $ = (id) => document.getElementById(id);
const video = $("video"), playBtn = $("play"), scrub = $("scrub"), status = $("status");
const analyzer = createAnalyzer(video);
const state = analyzer.state;
const transport = Tone.getTransport();

let rec = null, audioReady = false, beat = 0, scrubbing = false;

const say = (msg) => { status.textContent = msg; };
const caption = $("caption");
const stage = $("stage"), pad = $("probe-pad");

async function unlockAudio() {
  if (!audioReady) { await Tone.start(); audioReady = true; } // only ever from a user action
  ensureVoices();
}
// Only the current record's instruments exist; the previous record's are freed on switch.
let voiceSet = null;
function ensureVoices() {
  if (rec.v) return;
  voiceSet = withVoices(() => rec.voices());
  rec.v = voiceSet.v;
}
function freeVoices(old) {
  if (!old?.v || !voiceSet) return;
  const vs = voiceSet;
  old.v = null; voiceSet = null;
  setTimeout(() => vs.dispose(), 1500); // let release tails finish
}
// EONET markers, cached as map coords for lon/lat records (no allocation in the probe tick).
let markers = [];
function refreshMarkers() {
  markers = rec?.lonlat ? events.map((e) => ({ ...e, xy: eonet.toXY(e) })) : [];
  setMarkers(markers.map((m) => m.xy));
}
const eonet = createEonet({
  list: $("eonet-list"), status: $("eonet-status"), announce: say,
  canPlay: () => audioReady, onChange: refreshMarkers,
});
const probe = createProbe({ stage, video, state, isAudioReady: () => audioReady, announce: say,
  getMarkers: () => markers, playMarker: (m) => { eonet.play(m); say(`${m.word}: ${m.title}`); } });
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

// Two clocks: analysis writes features ~15x/s; the beat clock reads them.
setInterval(() => { analyzer.tick(); probe.tick(); drawOverlay(state); }, 66);

// Captions: what the music is saying, at most one update every 6 s, only while playing.
setInterval(() => {
  if (video.paused || !state.ready || !rec.caption) return;
  const text = rec.caption(state);
  if (text !== caption.textContent) caption.textContent = text;
}, 6000);
transport.scheduleRepeat((time) => {
  if (rec?.v && state.ready) rec.onBeat(state, rec.v, time, beat++);
}, "8n");

// ---- records ----
const shelf = $("shelf"), shelfMore = $("shelf-more");
RECORDS.forEach((r, i) => {
  const li = document.createElement("li");
  const k = keyOf(i);
  li.innerHTML = `<button aria-pressed="false" aria-keyshortcuts="${k}"><img class="disc" src="discs/${r.id}.jpg" alt=""><span class="t">${k}. ${r.title}</span><span class="d">${r.blurb}</span></button>`;
  li.firstChild.addEventListener("click", () => select(i));
  (i < FEATURED.length ? shelf : shelfMore).append(li);
});
const allButtons = () => document.querySelectorAll(".shelf button");

async function select(i) {
  const next = RECORDS[i];
  if (next === rec) return;
  const wasPlaying = !video.paused;
  freeVoices(rec);
  rec = next;
  silenceDrones();
  clearRipples();
  beat = 0;
  state.nFlashes = 0;
  analyzer.setRecord(rec);
  probe.setRecord(rec);
  caption.textContent = "";
  transport.bpm.value = rec.bpm;
  if (audioReady) ensureVoices();

  allButtons().forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  refreshMarkers();
  $("notes-title").textContent = rec.title;
  $("notes-shows").textContent = rec.notes.shows;
  $("notes-hear").textContent = rec.notes.hear;
  $("notes-listen").textContent = rec.notes.listen;
  const src = rec.svs ? `<a href="https://svs.gsfc.nasa.gov/${rec.svs}/">SVS ${rec.svs}</a>` : `<a href="${rec.link}">${rec.link}</a>`;
  $("notes-credit").innerHTML = `Visualization: ${rec.credit}. ${src}. This is a sonification of the visualization, not of the raw data.`;
  video.setAttribute("aria-label", `${rec.title} visualization`);

  $("loading").hidden = false;
  $("loading").textContent = rec.live ? "Fetching today's image from NASA…" : "Loading clip…";
  scrub.disabled = !!rec.live;
  video.addEventListener("loadedmetadata", () => {
    setView(rec.mapArea || { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight }, video.videoWidth, video.videoHeight);
    setOverlayRecord(rec, video.videoWidth, video.videoHeight);
  }, { once: true });
  video.addEventListener("canplay", () => {
    $("loading").hidden = true;
    if (wasPlaying) play();
  }, { once: true });
  say(`${rec.title} selected.${wasPlaying ? "" : " Press Play."}`);
  if (!rec.live) { video.srcObject = null; video.src = rec.clip; return; }
  const mine = rec;
  video.removeAttribute("src");
  try {
    const { stream } = await rec.live();
    if (rec !== mine) return; // user switched away meanwhile
    video.srcObject = stream;
    $("notes-shows").textContent = rec.notes.shows;
  } catch {
    if (rec === mine) $("loading").textContent = "Could not load today's image from NASA GIBS. Try again later.";
  }
}

// ---- playback ----
// First play: sound starts in darkness, the picture fades in two seconds later (§11).
let firstPlay = true;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reducedMotion) stage.classList.remove("dark");
async function play() {
  await unlockAudio();
  if (firstPlay) setTimeout(() => stage.classList.remove("dark"), reducedMotion ? 0 : 2000);
  firstPlay = false;
  await video.play();
}
function pause() { video.pause(); }
function toggle() { video.paused ? play() : pause(); }

video.addEventListener("play", () => {
  if (audioReady) transport.start();
  playBtn.textContent = "Pause";
  document.body.classList.add("playing");
  say(`Playing ${rec.title}.`);
});
video.addEventListener("pause", () => {
  transport.pause();
  silenceDrones();
  playBtn.textContent = "Play";
  document.body.classList.remove("playing");
  say("Paused.");
});
playBtn.addEventListener("click", toggle);

// ---- scrub, time, volume, overlay ----
video.addEventListener("timeupdate", () => {
  const d = video.duration || 0;
  if (!scrubbing && isFinite(d) && d) scrub.value = Math.round((video.currentTime / d) * 1000);
  const label = isFinite(d) ? `${fmt(video.currentTime)} / ${fmt(d)}` : "Live image";
  $("time").textContent = label;
  scrub.setAttribute("aria-valuetext", label);
});
scrub.addEventListener("input", () => {
  scrubbing = true;
  if (video.duration) video.currentTime = (scrub.value / 1000) * video.duration; // analysis resets on 'seeking'
});
scrub.addEventListener("change", () => { scrubbing = false; });
$("volume").addEventListener("input", (e) => setVolume(e.target.value / 100));
setVolume(0.5);

const overlayBtn = $("overlay-btn");
function flipOverlay() {
  const on = toggleOverlay();
  overlayBtn.setAttribute("aria-pressed", String(on));
  say(on ? "Showing what the engine sees." : "Overlay off.");
}
overlayBtn.addEventListener("click", flipOverlay);

// ---- explore probe and legend ----
stage.addEventListener("pointerdown", unlockAudio);
const syncFocus = () => probe.setFocus(stage.contains(document.activeElement) || pad.contains(document.activeElement));
document.addEventListener("focusin", syncFocus);
document.addEventListener("focusout", () => setTimeout(syncFocus));
stage.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 5 : 1;
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (d) { e.preventDefault(); unlockAudio(); probe.move(...d); }
  else if (e.key === "d" || e.key === "D") probe.describe();
});
pad.querySelectorAll("[data-move]").forEach((b) => b.addEventListener("click", () => {
  unlockAudio();
  const [dx, dy] = b.dataset.move.split(",").map(Number);
  probe.move(dx, dy);
}));
$("describe").addEventListener("click", () => { unlockAudio(); probe.describe(); });
$("legend-btn").addEventListener("click", async () => { await unlockAudio(); probe.legend((t) => { caption.textContent = t; }); });

// ---- scale presets (experimental) ----
const scaleSel = $("scale");
for (const [id, r] of Object.entries(RAGAS)) scaleSel.add(new Option(r.name, id));
scaleSel.addEventListener("change", () => {
  setScaleOverride(RAGAS[scaleSel.value]?.notes || null);
  say(scaleSel.value ? `${RAGAS[scaleSel.value].name} on. Experimental.` : "Default scales.");
});

// ---- WAV export ----
const wavBtn = $("wav-btn");
let recTimer = null;
async function finishRecording() {
  clearTimeout(recTimer); recTimer = null;
  wavBtn.textContent = "Saving…";
  const blob = await stopRecordingAsWav();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `earth-jukebox-${rec.id}.wav`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  wavBtn.textContent = "Save 20 s as WAV";
  say("Recording saved.");
}
wavBtn.addEventListener("click", async () => {
  if (recTimer) return finishRecording();
  await play();
  await startRecording();
  wavBtn.textContent = "Stop and save";
  say("Recording 20 seconds.");
  recTimer = setTimeout(finishRecording, 20000);
});

// ---- keyboard ----
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === " ") { e.preventDefault(); toggle(); }
  else if (/^[0-9]$/.test(e.key) && !["INPUT", "SELECT"].includes(e.target.tagName)) select(e.key === "0" ? 9 : +e.key - 1);
  else if (e.key === "o" || e.key === "O") flipOverlay();
  else if (e.key === "Escape") {
    if (video.paused) return say("Stopped all sound.");
    video.addEventListener("pause", () => say("Stopped all sound."), { once: true }); // runs after the generic "Paused."
    pause();
  }
});

select(0);
