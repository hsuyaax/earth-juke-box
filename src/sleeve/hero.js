// Hero controller: the real lightning clip through the real engine, on the landing page.
// Before Play it is silent: the engine reads the frames and every flash it finds draws a ring.
// After Play the same lightning record the jukebox uses takes over and the rings come from its notes.
// Tone.js, the audio chain, and the record load only when the visitor presses Play (no sound, no audio code before that).
const START = 12; // seconds into the clip: the first ~10 s are the quiet stretch, so the hero starts where it is busy
const PREVIEW_RING = "#FFF3B0"; // the lightning voice color (COLORS.crack in audio.js), repeated here so Tone is not loaded early

export function createHero({ video, stage, onStats, onVisible, onPlaying, onError }) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = !!navigator.connection?.saveData;
  const autoPreview = !reduced && !saveData; // the silent preview moves only when motion is welcome
  let mode = "preview"; // "preview" = silent rings, "sound" = the record is playing
  let visible = true, flashesSeen = 0, beat = 0, destroyed = false;
  let engine = null, snd = null, volume = 0.5, loading = null;

  video.muted = true;
  const seekStart = () => { try { video.currentTime = START; } catch { /* metadata not ready yet */ } };
  video.addEventListener("loadedmetadata", seekStart, { once: true });
  video.addEventListener("ended", () => { seekStart(); if (wantRunning()) video.play().catch(() => {}); }); // loop from START, not 0
  const wantRunning = () => !destroyed && !document.hidden && (mode === "sound" || (autoPreview && visible));
  const sync = () => { if (wantRunning()) video.play().catch(() => {}); else video.pause(); };

  // Off screen means off: the silent preview stops when the hero leaves the viewport or the tab is hidden.
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; onVisible?.(visible); sync(); }, { threshold: 0.15 });
  io.observe(stage);
  document.addEventListener("visibilitychange", sync);

  // Analysis and ripples load right after first paint; both are small and neither makes a sound.
  const ready = Promise.all([import("../analysis.js"), import("../ripples.js"), import("../records/lightning.data.js")]).then(([{ createAnalyzer }, rip, { default: data }]) => {
    if (destroyed) return;
    const analyzer = createAnalyzer(video);
    analyzer.setRecord(data);
    const state = analyzer.state;
    const setView = () => rip.setView({ x: 0, y: 0, w: video.videoWidth, h: video.videoHeight }, video.videoWidth, video.videoHeight);
    if (video.videoWidth) setView(); else video.addEventListener("loadedmetadata", setView, { once: true });
    analyzer.onFrame(() => {
      flashesSeen += state.fired;
      if (mode !== "preview") return; // in sound mode the beat clock drains the flashes
      for (let k = 0; k < state.nFlashes; k++) { const fl = state.flashes[k]; rip.addRipple(fl.x, fl.y, PREVIEW_RING, fl.power); }
      state.nFlashes = 0;
    });
    video.addEventListener("seeked", () => analyzer.tick());
    video.addEventListener("loadeddata", () => analyzer.tick());
    engine = { state, rip };
    setInterval(() => { if (!destroyed && visible && !document.hidden && !video.paused) onStats?.({ rate: state.flashRate, flashes: flashesSeen, beat }); }, 500);
    sync();
  }).catch(() => onError?.("The picture could not start. You can still open the full jukebox."));

  async function loadSound() {
    const [Tone, audio, lightning] = await Promise.all([import("tone"), import("../audio.js"), import("../records/lightning.js")]);
    const rec = lightning.default;
    await Tone.start(); // only ever from a click
    const voices = audio.withVoices(() => rec.voices());
    rec.v = voices.v;
    const transport = Tone.getTransport();
    transport.bpm.value = rec.bpm;
    transport.scheduleRepeat((time) => {
      if (mode === "sound" && engine?.state.ready) rec.onBeat(engine.state, rec.v, time, beat++);
    }, "8n");
    audio.setVolume(volume);
    snd = { Tone, audio, transport };
  }

  async function start() {
    await ready;
    if (!engine) return;
    try { loading ||= loadSound(); await loading; } catch { loading = null; onError?.("The sound could not start in this browser."); return; }
    mode = "sound";
    sync();
    snd.transport.start();
    onPlaying?.(true);
  }
  function stop() {
    if (mode !== "sound") return;
    mode = "preview";
    snd?.transport.pause();
    snd?.audio.silenceDrones();
    sync();
    onPlaying?.(false);
  }

  const onKey = (e) => { if (e.key === "Escape") stop(); };
  document.addEventListener("keydown", onKey);

  return {
    start, stop,
    isSound: () => mode === "sound",
    setVolume(v) { volume = v; snd?.audio.setVolume(v); },
    destroy() { destroyed = true; io.disconnect(); document.removeEventListener("visibilitychange", sync); document.removeEventListener("keydown", onKey); stop(); video.pause(); },
  };
}
