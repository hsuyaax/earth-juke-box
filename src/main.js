import * as Tone from "tone";
// Self-hosted (no runtime calls to font CDNs, AGENTS.md §18).
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/bricolage-grotesque/700.css";
import "./style.css";
import { createAnalyzer } from "./analysis.js";
import { setVolume, silenceDrones } from "./audio.js";
import { setView, clearRipples } from "./ripples.js";
import { setOverlayRecord, toggleOverlay, drawOverlay } from "./overlay.js";
import { createProbe } from "./explore.js";
import lightning from "./records/lightning.js";
import nightlights from "./records/nightlights.js";
import currents from "./records/currents.js";

const RECORDS = [lightning, nightlights, currents];
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
  rec.v ||= rec.voices();
}
const probe = createProbe({ stage, video, state, isAudioReady: () => audioReady, announce: say });
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
const shelf = $("shelf");
RECORDS.forEach((r, i) => {
  const li = document.createElement("li");
  li.innerHTML = `<button aria-pressed="false" aria-keyshortcuts="${i + 1}"><img class="disc" src="/discs/${r.id}.jpg" alt=""><span class="t">${i + 1}. ${r.title}</span><span class="d">${r.blurb}</span></button>`;
  li.firstChild.addEventListener("click", () => select(i));
  shelf.append(li);
});

function select(i) {
  const next = RECORDS[i];
  if (next === rec) return;
  const wasPlaying = !video.paused;
  rec = next;
  silenceDrones();
  clearRipples();
  beat = 0;
  state.nFlashes = 0;
  analyzer.setRecord(rec);
  probe.setRecord(rec);
  caption.textContent = "";
  transport.bpm.value = rec.bpm;
  if (audioReady) rec.v ||= rec.voices();

  shelf.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  $("notes-title").textContent = rec.title;
  $("notes-shows").textContent = rec.notes.shows;
  $("notes-hear").textContent = rec.notes.hear;
  $("notes-listen").textContent = rec.notes.listen;
  $("notes-credit").innerHTML = `Visualization: ${rec.credit}. <a href="https://svs.gsfc.nasa.gov/${rec.svs}/">SVS ${rec.svs}</a>. This is a sonification of the visualization, not of the raw data.`;
  video.setAttribute("aria-label", `${rec.title} visualization`);

  $("loading").hidden = false;
  video.src = rec.clip;
  video.addEventListener("loadedmetadata", () => {
    setView(rec.mapArea || { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight }, video.videoWidth, video.videoHeight);
    setOverlayRecord(rec, video.videoWidth, video.videoHeight);
  }, { once: true });
  video.addEventListener("canplay", () => {
    $("loading").hidden = true;
    if (wasPlaying) play();
  }, { once: true });
  say(`${rec.title} selected.${wasPlaying ? "" : " Press Play."}`);
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
  if (!scrubbing && d) scrub.value = Math.round((video.currentTime / d) * 1000);
  const label = `${fmt(video.currentTime)} / ${fmt(d)}`;
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

// ---- keyboard ----
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === " ") { e.preventDefault(); toggle(); }
  else if (e.key >= "1" && e.key <= String(RECORDS.length)) select(+e.key - 1);
  else if (e.key === "o" || e.key === "O") flipOverlay();
  else if (e.key === "Escape") {
    if (video.paused) return say("Stopped all sound.");
    video.addEventListener("pause", () => say("Stopped all sound."), { once: true }); // runs after the generic "Paused."
    pause();
  }
});

select(0);
