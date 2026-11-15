# AGENTS.md — Earth Jukebox (NASA Space Apps 2026)

Single reference for the team and for any coding agent in this repo. This version is **final** and replaces the earlier draft and `EXPLORE_MODE.md` (now section 9).
Change a decision only by editing this file in the same commit as the code.

Finalized: Sat 14 Nov 2026. Status updated the same day (see "Current status" below).

## Current status (keep this up to date)

| Area | State |
|---|---|
| P0 core | Built. 3 featured records, live music, ripples, keyboard, scrub |
| P1 | Built: explore probe, legend, captions, liner notes, visual polish. **Not done: screen-reader pass, listening test** (scripts in `tests/`) |
| P2 | Built: aerosols, 5 B-sides, EONET alerts, Earth Today, raga presets (experimental, need a musician's approval), WAV export, vibration |
| Pages | `index.html` sleeve (landing), `play.html` jukebox, `notes.html` liner notes (about.html redirects). Design: DESIGN.md |
| Deploy | Ready (Pages workflow in `.github/workflows/deploy.yml`), not yet published |
| Tests | `npm test` (fast), `npm run test:clips` (real clips, needs ffmpeg) |

Where the numbers live: engine settings and thresholds in `src/records/<id>.data.js` (each with the measurement behind it). BUILD_PLAN.md is the original build order; where its numbers differ from the code, the code and this file win.

---

## 1. Snapshot

- **Event:** NASA International Space Apps Challenge 2026. Hackathon: Sat 14 – Sun 15 Nov 2026.
- **Challenge:** The Earth Information Jukebox.
- **What we are building:** a website that turns NASA Earth Information Center (EIC) videos into live music, which people can also explore by touch or keyboard, built so that people who cannot see the screen can use it.
- **One-line pitch:** Hear the planet. Every sound comes from the NASA picture, at the place it happened.

**Team to fill in**

| Item | Value |
|---|---|
| Project name | ______ (working title: Earth Jukebox) |
| Team name and members | ______ |
| Who owns: clips and classes / audio / UI / testing and submission | ______ |
| Local submission deadline (date, time, time zone) | ______ |
| Required submission items, checked against the 2026 guide | ______ |

## 2. What the challenge asks for

An "Earth Jukebox": an interface, script, or application that **pairs EIC visual frames with dynamic sonifications generated in real time**.

The brief stresses:

1. **Sound comes from the visual frames** (color to chords, pixel density to rhythm, shapes to synth parameters).
2. **Accessibility is a core theme** (screen readers, tactile feedback, descriptive text; blind and low-vision users are named).
3. **Musicality** (scales and rulesets, not raw noise).
4. **Exploration** (the sight-to-sound translation should be interactive).
5. **Story and process** (explain the artistic and technical choices).
6. **Selection** (pick a visualization, experience its soundscape).

## 3. How we are judged

Criteria: **Impact, Creativity, Validity, Relevance, Presentation.**

| Criterion | Our answer |
|---|---|
| Impact | Usable without sight; listening test with real people |
| Creativity | Touch-to-hear probe; every sound also leaves a visible mark |
| Validity | Deterministic, documented mappings; limits stated openly |
| Relevance | EIC frames are the input; sound is generated live from pixels |
| Presentation | Sound-first demo; clear project page |

## 4. Where other teams are weak

- Sound driven by a number series or a weather API, not by the EIC frames.
- A single rising tone, not music.
- Accessibility claimed in the README, not tested.
- No way to explore the image by ear.

## 5. Decisions

| # | Decision |
|---|---|
| D1 | Three featured records for P0: Lightning (5011), Night Lights (5313), Sea Surface Currents and Temperature (3912). |
| D2 | All nine listed visualizations appear on the jukebox. The other six are "B-sides" using a default mapping. B-sides are P2. |
| D3 | The engine reads the video frames in the browser. No pre-rendered audio. |
| D4 | One sound language everywhere (section 8). Timbre = what. Pan = left-right. Pitch = up-down. Loudness, tone brightness, and pulse speed = how much. |
| D5 | Explore probe works while playing and while paused (section 9). Keyboard is the primary path. |
| D6 | "See the sound": every note draws a ripple on the video at its source, in that voice's color. |
| D7 | Scales are data in each record's settings. P0 uses pentatonic scales. Raga presets are a P2 swap and need a teammate with a musical ear to approve them. |
| D8 | GEOS Aerosols (5669) is the first P2 item. If a dust storm becomes the demo story, it replaces 3912; it is never a fourth P0 clip. |
| D9 | "Earth Today" live record and EONET calamity alerts are P2. Alerts are in-app only. |
| D10 | Static site, no backend, no API keys. |

## 6. Scope tiers

**P0 — done and deployed Saturday night**
- Jukebox screen with the three featured records.
- Video playback, live frame analysis, live layered music in a scale.
- Play, pause, scrub; scrubbing changes the sound at once.
- Ripples on the video for every note.
- Full keyboard operation.

**P1 — Sunday morning**
- Explore probe (section 9), lightning first.
- "What the engine sees" overlay toggle.
- Audio legend ("Learn the sounds") per record.
- Captions in a live region; written liner notes per record.
- Screen-reader pass (NVDA or TalkBack).
- Listening test, written up honestly.
- Visual polish (section 11).

**P2 — only when P0 and P1 are solid, in this order**
1. GEOS Aerosols record with dust, smoke, and sea-salt voices.
2. Six B-side records with the default mapping.
3. EONET calamity alerts.
4. "Earth Today" live record.
5. Raga scale presets.
6. Phone vibration; WAV export.

Rule: never start a P2 item while a P0 or P1 item is broken. Feature freeze Sunday midday.

## 7. Records

SVS page = `https://svs.gsfc.nasa.gov/<ID>/`. Gallery: `https://svs.gsfc.nasa.gov/gallery/earth-information-center/`.

| Tier | Record | SVS ID | What the engine reads | What you hear |
|---|---|---|---|---|
| P0 | Lightning from the ISS 2017–2023 | 5011 | Sudden bright cells | Crack/drum per flash; busier rhythm and heavier rumble with more flashes |
| P0 | Night Lights 2012–2023 (EIC) | 5313 | Brightness; violet (more light) vs orange (less light) | Pluck A for violet, pluck B for orange; brighter = louder |
| P0 | Sea Surface Currents and Temperature | 3912 | Motion between frames; warm vs cold colors | Warm pad vs cold bell; more motion = faster arpeggio |
| P2 | GEOS Aerosols | 5669 | Color classes per aerosol type | Dust = gritty noise, smoke = low breathy tone, sea salt = airy hiss |
| P2 B-side | DYAMOND CO2 5196, Air Quality Model Runs 5533, Perpetual Ocean 2 5425, Atmospheric River 4960, GEDI Forest Height 4950 | | Default: brightness, hue, motion | Default: loudness, chord, tempo |

Concept reference: Data Sonification: Caldwell 73 (SVS 13786).

Clip notes:
- 5313 is a flat map with zooms of India, Ukraine, Western Europe, and the Eastern Mediterranean. Its EIC file is 7680x2160 H.265; transcode first.
- 5011's 1080p file is a globe view. If rotation causes false flashes, count only cells matching the lightning dot color.
- 5196 and 5425 have camera motion; 4960 is narrated 3D (strip audio). Label these B-sides "artistic, not geographic."
- EIC versions are about 32:9. Find the real map area inside each frame; never assume it fills the frame.

Clip decisions made during the build (Sat 14 Nov):
- 5011 uses the flat-map file `iss_lightning_sos_yearly_07312023_2048p60.mp4` (full 100 s), not the globe. 3912 uses the full 67 s.
- 5313's EIC frame holds two copies of the world map; the clip is cropped to the left half (1280x720), grid 128x72.
- 5669 has stills only. Aerosols use the flat, unlabeled video from SVS 5552 (`Aerosols_NoLabels_2048x1024_30fps.mp4`), same GEOS model; credit links 5552 and 5669. Sulfate (green) has no voice.
- 5196 uses the `globe_zoom` version; the `globe_tilt` version is too dark.
- All clips are now full length (Sat 14 Nov). Perpetual Ocean 2 (317 s) and Atmospheric River (292 s) are 960x540 to stay near 1 Mbps; the rest 1280 wide. All H.264, faststart, streamed by range requests.
- Earth Today uses GIBS `MODIS_Terra_CorrectedReflectance_TrueColor` (VIIRS tiles came back blank).

Transcode command:
```
ffmpeg -i input.mp4 -t 40 -vf scale=1280:-2 -c:v libx264 -crf 26 -an -movflags +faststart out.mp4
```

## 8. Sound language

The same rules apply to the music and to the probe.

| Sound property | Means |
|---|---|
| Timbre (which instrument) | What it is |
| Stereo pan | Left-right position |
| Pitch | Up-down position (higher on screen = higher note), snapped to the scale |
| Loudness and tone brightness | How much |
| Pulse speed (probe only) | How much (faster = more) |

Sound families, identical in every record:

| Feature | Sound | Kind |
|---|---|---|
| Lightning flash | Sharp crack or click | Event |
| Warm current | Soft pad or flute | Sustained |
| Cold current | Glassy bell | Sustained |
| City lights, more light (violet) | Pluck A | Sustained |
| City lights, less light (orange) | Pluck B | Sustained |
| Dust (P2) | Gritty filtered noise | Sustained |
| Smoke (P2) | Muffled low breathy tone | Sustained |
| Sea salt (P2) | Airy high hiss | Sustained |
| Nothing detected | Faint room tone | — |

Music layers: **drone** (overall state), **melody** (column profile or dominant region), **percussion** (events), **texture** (motion).

Rules:
- Always snap pitch to the record's scale. Default scales: major pentatonic (calm), minor pentatonic (tense).
- Smooth every feature before it reaches a synth.
- At most 6 events per beat, snapped to the beat grid.
- One master chain with a limiter. Conservative default volume. No sudden loud sounds.
- Same frame in, same sound out. No unseeded randomness.
- Each mapping must fit in one sentence in the liner notes.

## 9. Explore probe (touch to hear)

**Goal:** with the video playing or paused, a person moves a mouse, finger, or arrow keys over the frame and hears what is under the pointer: what it is, how much, and where.

**Behavior**
- Each analysis tick, read the cell under the pointer (3x3 neighborhood), classify it, and play that class's voice using the section 8 rules.
- Re-read on every tick, not only on pointer move, so a still finger hears the picture change.
- **Events fire immediately.** A flash under the pointer plays its crack with no delay.
- **Sustained classes use hysteresis:** a new class must hold for 2 ticks before the voice switches.
- On a class change, play a short soft edge tick, then switch voices.
- Drag speed does not affect the sound.
- **Ducking:** while the probe is active during playback, lower the music to about half loudness; restore it when the pointer leaves.
- The probe is independent of the music clock. Pausing stops the piece; the probe stays live.

**Paused video**
- Run analysis on `pause` and `seeked`, and cache the result.
- Lightning uses two detectors with the same sound: *temporal* (jump above the running average) while playing; *spatial* (much brighter than neighbors) while paused.
- A paused flash under a still pointer repeats a soft click; speed follows brightness.
- Currents while paused: temperature voice only, no motion texture.
- A still pointer on a paused frame gives a steady sound, which itself says nothing is changing.

**Classification**
- Class definitions live in each record's settings: `classes: [{ name, colorRange, soundFamily, kind }]`.
- Color ranges are sampled from the real clip and its colorbar, never guessed.
- Build the **calibration page first**: click any point to see RGB/HSV, cell features, and assigned class.

**Input and accessibility**
- Keyboard is the primary path. Arrow keys move the probe one cell; Shift+arrow moves five.
- The stage has `role="application"`, an accessible name, and usage instructions, so screen readers pass arrow keys through when it is focused.
- Phone screen readers capture touch gestures, so provide large on-screen arrow buttons as well.
- Set `touch-action: none` on the stage and use pointer events, so dragging does not scroll the page.
- `D` describes the current cell (class, amount, rough position) in the live region. Active only when the stage is focused.
- On class change, update the live region (for example "dust, dense"), throttled.
- Vibration per class on supported phones is P2 and an enhancement only.

**Effort**
- Clips, map areas, classes, and threshold tuning: about 5 hours for the three P0 clips.
- Five voices, edge tick, and ducking: about 2 hours.
- Split: one person on clips and classes, one on voices against fake feature data.

## 10. Architecture

- **Stack:** Vite + JavaScript, Tone.js, Canvas 2D. Deploy to Vercel or GitHub Pages.
- **Assets:** full-length clips, H.264, faststart, about 1280 px wide (960 for the two 5-minute B-sides), served from the same origin (required for reading pixels).

```
video element
   └─ analysis loop (about 15 times per second)
        draw frame at 4x the grid (grid 96x48 or 128x72), box-average each block
        compute features -> smoothed feature state (cached)
music clock (Tone.Transport, independent of video frame rate)
   └─ each beat: read feature state -> schedule notes -> emit ripple events
explore probe
   └─ each tick: read cached cell under pointer -> voice, pan, pitch, pulse
ripple layer (canvas over the video)
   └─ draws one ring per note at its source position
```

The analysis loop and the music clock are separate. Analysis writes features; the clock reads them on the beat.

Implementation (Sat 14 Nov): analysis is a pure engine (`createEngine` in `src/analysis.js`) shared by the browser and Node. It runs on decoded video frames (`requestVideoFrameCallback`, about 15 per second, timer fallback), box-averages a 4x supersampled grid itself (same result in every browser), keeps each cell's brightest pixel for flashes, and smooths with time constants so results do not depend on frame rate. Engine settings per record live in `src/records/<id>.data.js`. Thresholds are calibrated with `tools/engine_run.mjs` and locked by `npm run test:clips`.

Features per frame: mean brightness, hue histogram (12 bins, saturation-weighted), motion energy per cell, flash events, column profile, brightness centroid, per-record color-class masks.

```
index.html (sleeve), play.html (jukebox), notes.html (liner notes), calibrate.html; about.html redirects
src/
  main.js            jukebox screen, keyboard, wiring
  analysis.js        pure engine (createEngine) + browser wrapper (createAnalyzer)
  audio.js           master chain, scales, ragas, sound families, pools, drones, WAV export
  explore.js         probe and audio legend
  ripples.js         see-the-sound layer, playhead, probe box, EONET markers
  overlay.js         "what the engine sees"
  eonet.js           EONET alerts
  records/<id>.data.js   engine settings (grid, classes, flash) — no imports, shared with Node
  records/<id>.js        voices, onBeat, captions, liner notes
  records/bside.js       default mapping + the five B-sides
  records/today.js       Earth Today (GIBS)
tools/engine_run.mjs     real clip through the real engine: calibration statistics
tests/                   engine_check, wav_check, engine_regress, test scripts for people
public/clips, public/discs
```

Each record's settings: clip path, credit line, map area in the frame, colorbar stops if any, classes, scale, mapping preset, liner notes, audio-legend script.

## 11. Visual design

- **The one bold element is the ripples.** Everything else stays quiet. No decorative gradients or star backgrounds. One exception (DESIGN_PASS_2 3.5, POLISH_PASS_3 A4): the ambient glow behind the jukebox stage and the band strips, which takes its colours from the picture the engine is reading, at most 4 updates a second, kept dim enough that text on the deck stays AA.
- **Layout:** full-width video stage on top; record shelf below left; liner notes below right. Stack vertically on phones.
- **Records:** each visualization is a disc whose label is a circular crop of its clip. It spins slowly while playing.
- **First play:** sound starts in darkness; the image fades in two seconds later. This is the only planned animation besides ripples and the spinning record.
- **Colors** (taken from the night lights visualization):

| Role | Hex |
|---|---|
| Background, night blue | `#0D1B3D` |
| Text, warm white | `#F4EFE6` |
| Main accent, amber (Play, focus outline) | `#FFC25C` |
| Voice A, violet | `#9B7BFF` |
| Voice B, orange | `#FF8A3D` |

- Each voice has one color; its ripples use that color.
- **Type:** Atkinson Hyperlegible for body (designed by the Braille Institute for low-vision readers), 18 px minimum. Bricolage Grotesque for record titles only.
- **Words:** plain and active. "Play", "Explore by touch", "Learn the sounds", "What you'll hear".
- Large touch targets, visible focus, loading message while clips load, works on a phone.
- Turn off all motion when `prefers-reduced-motion` is set.

## 12. Accessibility rules

- Everything works by keyboard: Space play/pause, arrows move the probe, number keys pick a record, Escape stops sound.
- Real buttons with labels. Visible focus. Check contrast.
- Live region for captions, at most one update every few seconds.
- No sound before a user action. Stop and volume always reachable.
- Liner notes per record: what it shows, what you will hear, what to listen for.
- Audio legend plays each sound with its label before the piece.
- Test with a screen reader on Saturday for lightning, and again before submitting.

## 13. Validity and honesty rules

- The frames are rendered visuals, not raw data. Say "sonification of the visualization." Call color-derived values approximate.
- Prefer flat-map clips for anything with geographic meaning.
- Report the listening test exactly as it happened, including sample size. Never invent results or quotes.
- Show "Not an official NASA product" and credit NASA's Scientific Visualization Studio for every clip.
- Use visualization clips, not the produced EIC videos (licensed music and third-party imagery).
- EONET alerts (P2): state that this is not a warning system, that the feed can lag, and link to official sources.
- Disclose AI tool use if the rules ask for it.

## 14. P2 notes: live features

- **EONET:** `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7`, no key. Fetch on load and every few minutes. One alert sound per category, a live-region announcement, and a map marker that the probe can play.
- **Earth Today:** EIC Daily Visualizations, or a NASA GIBS near-real-time tile loaded as an image and passed through the same engine. Confirm pixel reading works before committing time.
- No generic city-weather API; it is not a visual frame.

## 15. Timeline

**Saturday**
- Setup, deploy empty page, transcode three clips.
- Player, analysis loop, overlay, calibration page.
- Lightning end to end, then music engine, then the other two records.
- Jukebox screen and ripples. First screen-reader check. P0 deployed before sleep.

**Sunday**
- Morning: probe, audio legend, captions, liner notes, visual polish, listening test.
- Midday: feature freeze. P2 items only if everything works.
- Afternoon: demo video, project page, submit with hours to spare.

Minimum strong entry if time runs short: lightning record with music, ripples, probe, and keyboard access, plus the submission.

## 16. Demo (30 seconds)

1. Black screen, sound only: "This is lightning over Earth."
2. Image fades in with ripples on every hit.
3. Overlay on for two seconds to show the engine reading the frame.
4. A finger or arrow keys explore the map; the sound follows.
5. Closing line with the listening-test result.

## 17. Submission checklist

- [ ] Live URL works on phone and laptop in a fresh browser.
- [ ] Public repo with README, license, credits.
- [ ] Demo video or slides in the required format.
- [x] Project page: problem, what it does, how the mapping works, who it helps, test results, NASA resources with links, credits.
- [x] AI use disclosed (README and notes.html).
- [ ] Team table in section 1 filled in.
- [ ] Submitted before the deadline, with buffer.

## 18. Instructions for coding agents

- Read this file first. Do not expand scope beyond section 6.
- No backend, no API keys. Runtime network calls only for our own assets (and EONET or GIBS if those P2 items are started).
- Never read pixels from a cross-origin video.
- Keep the analysis canvas small; reuse buffers; no allocation inside the analysis loop.
- All audio goes through the master chain with the limiter.
- Every note emitted must also emit a ripple event with position and voice.
- Follow the section 8 sound language exactly; do not invent per-record meanings for pitch or pan.
- Every interactive element needs a keyboard path and an accessible name.
- Do not add a dependency without a written reason.
- Do not write claims into the README or UI that are not true of the running app.
