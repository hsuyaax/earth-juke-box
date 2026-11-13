# BUILD_PLAN.md — Earth Jukebox core build

Companion to `AGENTS.md`. This file covers the **core (P0)**: three records playing live music from NASA frames, with ripples, a jukebox screen, and keyboard control. Explore probe, audio legend, and polish (P1) come after every task here is done.

Rules in `AGENTS.md` win if anything here disagrees with them.

---

## Part A — What to download

### A1. Software (once per laptop)

| Tool | Why | Get it |
|---|---|---|
| Node.js (LTS version) | Runs the dev server and build | nodejs.org |
| Git | Version control, needed for deploy | git-scm.com |
| VS Code (or any editor) | Writing code | code.visualstudio.com |
| ffmpeg | Trimming and converting NASA clips | Windows: `winget install Gyan.FFmpeg` · Mac: `brew install ffmpeg` · Linux: `sudo apt install ffmpeg` |
| Chrome or Edge | Main test browser | — |
| NVDA (Windows) or TalkBack (Android, built in) | Screen-reader testing | nvaccess.org |
| Stereo headphones | You cannot judge left-right panning on laptop speakers | — |

Accounts: GitHub (public repo) and Vercel or GitHub Pages (free hosting).

Code libraries (installed by npm in task T0): `vite`, `tone`. Nothing else for the core.

### A2. NASA clips for the three core records

Download only these three files to start. Total is about 175 MB.

| Record | SVS page | File to download | Size | Notes |
|---|---|---|---|---|
| Lightning | svs.gsfc.nasa.gov/5011 | `iss_lightning_sphere_07312023.mp4` (1920x1080) | 127 MB | Watch it first. If it shows a rotating globe and that causes false flashes, use the flat world map version on the same page instead: `iss_lightning_sos_yearly_07312023_2048p60.mp4` (4096x2048, 334 MB). |
| Night lights | svs.gsfc.nasa.gov/5313 | `nightlights_flat_series_and_change_wZooms_13_EIC_2160p30_h265.mp4` (7680x2160) | 32.7 MB | H.265 and very wide. Most browsers will not play it until converted. |
| Ocean currents | svs.gsfc.nasa.gov/3912 | `ecco2_sst_flow.webmhd.webm` (960x540) | 14.9 MB | Flat world map. If it looks too soft, switch later to `ecco2_sst_flow.mp4` (2048x1024, 244 MB). |
| Ocean colorbar | svs.gsfc.nasa.gov/3912 | `sst_ecco2_cbar.png` | 9 KB | Blue = 0 °C, green = 10–20 °C, yellow ≈ 25 °C, red = 32 °C. |

Do **not** download the ProRes `.mov` files (several GB) or the frame-set folders (thousands of images). You do not need them.

Credit lines to store with each record:
- 5011 and 5313: "NASA's Scientific Visualization Studio"
- 3912: "NASA/Goddard Space Flight Center Scientific Visualization Studio"

### A3. Later (not now)

Aerosols (5669), the five B-side clips, EONET, and GIBS are P2. Skip them until the core and P1 are finished.

---

## Part B — Architecture

One static web page. No server.

```
┌────────────────────────── browser ──────────────────────────┐
│                                                             │
│  <video> (NASA clip, same origin)                           │
│      │ every ~66 ms                                         │
│      ▼                                                      │
│  analysis.js   draw frame → tiny canvas → features          │
│      │ writes                                               │
│      ▼                                                      │
│  state         { cells, flashes, motion, hue, columns }     │
│      │ read on each beat                                    │
│      ▼                                                      │
│  audio.js      beat clock → record's mapping → Tone voices  │
│      │ for every note                                       │
│      ▼                                                      │
│  ripples.js    ring drawn on a canvas over the video        │
│                                                             │
│  records/*.js  settings + mapping function per record       │
│  main.js       jukebox screen, keyboard, wiring             │
└─────────────────────────────────────────────────────────────┘
```

Three ideas hold it together:

1. **Two clocks.** The analysis loop runs about 15 times a second and only writes features. The music clock (Tone.Transport) runs on the beat and only reads features. Music stays steady even if frames stutter.
2. **A record is data plus one function.** Each record file exports settings (clip, map area, scale, classes) and a `onBeat(state, audio, time)` function that decides which notes to play. Adding a record never touches the engine.
3. **Every note carries a position.** The same `{x, y, voice}` drives pan, pitch, and the ripple, so sound and picture cannot drift apart.

Files:

```
index.html
src/
  main.js          jukebox screen, keyboard, wiring
  analysis.js      frame reading and features
  audio.js         master chain, scales, voice pools, clock
  ripples.js       see-the-sound layer
  overlay.js       "what the engine sees" grid
  records/
    lightning.js
    nightlights.js
    currents.js
calibrate.html     click a point, see its numbers
public/clips/      lightning.mp4, nightlights.mp4, currents.mp4
```

---

## Part C — Core tasks

Each task has an objective, steps, and a "done when" check. Do not move on until the check passes.

Three people can work in parallel:
- **Lane 1 (picture):** T1 → T3 → T4 → class tuning for T6, T8, T9
- **Lane 2 (sound):** T5 → voices for T6, T8, T9 (test against fake data until Lane 1 is ready)
- **Lane 3 (screen):** T0 → T2 → T7 → T10 → T11

If you fall behind, cut in this order: T9 (currents), then T8 (night lights). Never cut T6, T7, or T11.

### T0 — Project setup and first deploy (30 min)

**Objective:** an empty page live on the internet.

```
npm create vite@latest earth-jukebox -- --template vanilla
cd earth-jukebox
npm install
npm install tone
npm run dev
```

1. Create a public GitHub repo and push.
2. Add `AGENTS.md` and this file to the repo root.
3. Import the repo in Vercel (or enable GitHub Pages) and deploy.

**Done when:** the default Vite page opens at a public URL on your phone.

### T1 — Convert the clips (45–60 min)

**Objective:** three small, browser-friendly clips in `public/clips/`.

Watch each original first and note the start time of a good 30–40 second stretch. Then:

```
# Lightning
ffmpeg -ss 0 -t 40 -i iss_lightning_sphere_07312023.mp4 -vf scale=1280:-2 -r 30 -c:v libx264 -pix_fmt yuv420p -crf 26 -an -movflags +faststart lightning.mp4

# Night lights (stays ultra-wide: 1920x540)
ffmpeg -ss 0 -t 45 -i nightlights_flat_series_and_change_wZooms_13_EIC_2160p30_h265.mp4 -vf scale=1920:-2 -r 30 -c:v libx264 -pix_fmt yuv420p -crf 24 -an -movflags +faststart nightlights.mp4

# Ocean currents
ffmpeg -ss 0 -t 40 -i ecco2_sst_flow.webmhd.webm -r 30 -c:v libx264 -pix_fmt yuv420p -crf 24 -an -movflags +faststart currents.mp4
```

- `-ss` is the start time in seconds, `-t` is the length. Change them to the stretch you chose.
- `-an` removes any audio. `-pix_fmt yuv420p` makes it play everywhere.
- For night lights, make sure the clip includes both the yearly time series and the violet/orange change map.

**Done when:** each file is under about 15 MB and plays by dragging it into Chrome and into a phone browser.

### T2 — Player and sound unlock (45 min)

**Objective:** a page that plays a clip and can make sound.

1. In `index.html`: a stage `<div>` holding a `<video muted playsinline loop>` and a Play button.
2. Browsers block sound until a click. The Play button handler must start audio first:

```js
import * as Tone from "tone";
playBtn.addEventListener("click", async () => {
  await Tone.start();            // unlocks audio
  await video.play();
  Tone.getTransport().start();
});
video.addEventListener("pause", () => Tone.getTransport().pause());
video.addEventListener("play",  () => Tone.getTransport().start());
```

3. Temporarily play a test note on click: `new Tone.Synth().toDestination().triggerAttackRelease("C4", "8n")`.

**Done when:** clicking Play starts the video and you hear the test note; pausing the video works.

### T3 — Analysis loop and overlay (1.5 hours)

**Objective:** the page knows, 15 times a second, what is in the picture.

1. Create a small hidden canvas. Size per record: lightning 96x54, night lights 128x36, currents 96x48.
2. Each tick, draw only the **map area** of the video onto it. The map area `{x, y, w, h}` (in video pixels) lives in the record settings, because clips may have borders or labels.

```js
const g = small.getContext("2d", { willReadFrequently: true });
setInterval(() => {
  if (video.readyState < 2) return;
  const m = record.mapArea;
  g.drawImage(video, m.x, m.y, m.w, m.h, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  computeFeatures(px);           // fills state.*
}, 66);
```

3. `computeFeatures` fills, per cell: brightness (luma), hue and saturation, and motion (absolute brightness change since the last tick). Then per frame: mean brightness, flash list, warm and cold fractions, and a per-column summary.
4. Allocate all arrays once (`new Float32Array(W * H)`) and reuse them.
5. `overlay.js`: a canvas on top of the video that draws the grid and tints cells by a chosen feature. Toggle with the `O` key.

**Done when:** with the overlay on, bright or moving parts of the video light up the matching grid cells, in step with the picture.

### T4 — Calibration page (45 min)

**Objective:** stop guessing thresholds.

`calibrate.html` loads a clip, lets you pause and click any point, and prints: cell x/y, RGB, hue/saturation/brightness, motion, and (later) the class assigned.

Use it to record real numbers for:
- Lightning: brightness of a flash vs the background around it.
- Night lights: hue and saturation of violet areas, orange areas, and plain city lights.
- Currents: hue of warm water, cold water, and land.

Write these numbers into each record's settings. Never type a color range you have not sampled.

**Done when:** clicking a lightning flash, a violet patch, and a warm current each shows clearly different numbers.

### T5 — Audio foundation (1 hour)

**Objective:** one safe output chain, scales, a beat clock, and reusable voices.

```js
// master chain: everything goes through this
const limiter = new Tone.Limiter(-3).toDestination();
export const master = new Tone.Gain(0.7).connect(limiter);

// scale helper: t = 0..1 (bottom to top of the screen) -> frequency in the scale
export const SCALES = { majorPent: [0, 2, 4, 7, 9], minorPent: [0, 3, 5, 7, 10] };
export function noteAt(t, scale, root = 48, octaves = 3) {
  const steps = scale.length * octaves;
  const i = Math.min(steps - 1, Math.max(0, Math.floor(t * steps)));
  const midi = root + 12 * Math.floor(i / scale.length) + scale[i % scale.length];
  return Tone.Frequency(midi, "midi").toFrequency();
}

// voice pool: several copies of an instrument, each with its own panner
export function makePool(makeSynth, size = 6) {
  const voices = Array.from({ length: size }, () => {
    const pan = new Tone.Panner(0).connect(master);
    return { synth: makeSynth().connect(pan), pan };
  });
  let n = 0;
  return (freq, dur, time, vel, x) => {
    const v = voices[n++ % size];
    v.pan.pan.setValueAtTime(x * 2 - 1, time);   // x = 0..1 across the screen
    v.synth.triggerAttackRelease(freq, dur, time, vel);
  };
}

// beat clock
Tone.getTransport().bpm.value = 96;
Tone.getTransport().scheduleRepeat((time) => record.onBeat(state, time), "8n");
```

Smooth slow-changing features before using them: `smooth += 0.1 * (value - smooth)`.

**Done when:** a fake `onBeat` that plays a rising scale with x sweeping 0→1 sounds in tune and moves from the left ear to the right.

### T6 — Lightning record (2 hours)

**Objective:** the first complete record. Every flash is a hit you can locate by ear.

**Picture side**
1. Keep a slow running average of brightness per cell.
2. A cell is a flash when it jumps above its average by more than the threshold you measured in T4. Give it an 8-tick cooldown.
3. Keep the 6 strongest flashes per tick in `state.flashes` as `{x, y, power}` (all 0..1).
4. If the globe rotates and coastlines trigger flashes, also require the cell's color to match the lightning dots.

**Sound side**
1. Percussion pool: `makePool(() => new Tone.MembraneSynth({ octaves: 2, envelope: { decay: 0.2 } }))`, or a `PluckSynth` for a lighter sound.
2. On each beat, for each pending flash: pitch = `noteAt(1 - y, SCALES.minorPent)`, pan from `x`, velocity from `power`.
3. Rumble layer: count flashes over the last 2 seconds, smooth it, and use it to raise the volume and filter cutoff of one low drone note.

**Done when:** with eyes closed and headphones on, a second person can tell whether storms are on the left or right, and whether a stretch is quiet or busy.

### T7 — Ripples (45 min)

**Objective:** every note is visible at its source.

1. A canvas the same size as the video, on top of it, with `pointer-events: none`.
2. `addRipple(x, y, color)` pushes `{x, y, color, born}` to a list. An animation loop draws each as an expanding, fading ring for about 600 ms, then removes it.
3. Fire ripples in sync with the audio clock, not when the note is scheduled:

```js
Tone.getDraw().schedule(() => addRipple(x, y, voiceColor), time);
```

4. Convert cell coordinates back through the record's map area so the ring lands on the right spot.
5. If `prefers-reduced-motion` is set, draw a static dot that fades, with no expansion.

**Done when:** each drum hit shows a ring exactly on the flash that caused it.

### T8 — Night lights record (2 hours)

**Objective:** hear where the world is lit, and where it gained or lost light.

**Picture side**
1. Per cell, compute a class from the numbers measured in T4: `violet` (more light), `orange` (less light), `light` (plain city lights), or `dark`.
2. Build `state.columns`: for each column, its lit cells with `{y, brightness, class}`.

**Sound side**
1. A playhead sweeps left to right across the map, one column group per beat, taking about 4 bars to cross. Draw it as a thin vertical line.
2. At each step, take up to 4 of the brightest cells in that column group and play a pluck: pitch = `noteAt(1 - y, SCALES.majorPent)`, pan from the column's x, velocity from brightness.
3. Two pools: Pluck A (bright, bell-like) for `violet` and `light`; Pluck B (darker, softer) for `orange`. Ripple colors: violet `#9B7BFF`, orange `#FF8A3D`, amber `#FFC25C` for plain light.
4. Drone: overall mean brightness sets a soft pad's volume, so the planet "glows" louder as the years advance.

**Done when:** the sweep is audibly dense over Europe, India, and East Asia and nearly silent over oceans; in the change-map section you can hear two different instruments.

### T9 — Ocean currents record (2 hours)

**Objective:** hear warm and cold water and how fast the sea is moving.

**Picture side**
1. Ignore land: skip cells with low saturation (measured in T4).
2. Per cell: `warm` or `cold` from hue, and motion from brightness change between ticks.
3. Per frame: warm fraction, cold fraction, and mean motion, all smoothed.

**Sound side**
1. Two sustained voices: a warm pad (`Tone.PolySynth` with a slow attack) and a cold bell (`Tone.FMSynth` or `MetalSynth` at low volume). Their volumes follow the warm and cold fractions.
2. Arpeggio: a playhead sweeps like T8. At each step, find the cell with the most motion in that column group; pitch from its `y`, voice from its class, pan from x.
3. Mean motion sets how busy the arpeggio is: skip every other step when calm, play every step when active.
4. Ripple colors: one warm and one cool color, consistent with the legend.

**Done when:** the Gulf Stream and Kuroshio regions sound busier than the open ocean, and tropical bands sound different from polar ones.

### T10 — Jukebox screen and keyboard (1.5 hours)

**Objective:** pick a record and play it without a mouse.

1. Record shelf: three real `<button>` elements, each with the record name and a one-line description. Selecting one loads its clip and settings and resets the analysis state.
2. Liner notes panel: what it shows, what you will hear, and the credit line.
3. Controls: Play/Pause, a scrub bar (`<input type="range">`), volume, and the overlay toggle.
4. Keys: Space = play/pause, 1/2/3 = pick record, O = overlay, Escape = stop all sound.
5. Visible focus outline in amber on everything focusable.
6. Footer: "Not an official NASA product."

**Done when:** you can unplug the mouse, pick each record, play, pause, scrub, and stop using only the keyboard.

### T11 — Deploy and check (30 min)

**Objective:** the core works for a stranger.

1. `npm run build`, push, confirm the deploy.
2. Open the live URL in a private window on a laptop and on a phone.
3. Check: all three records load and play; no sound before a click; nothing is painfully loud; ripples line up; keyboard works.
4. Run a first screen-reader pass on the jukebox screen.
5. Tag the commit `core-done`.

**Done when:** a teammate who has not seen the build can open the link and play all three records without help.

---

## Part D — After the core

In this order, per `AGENTS.md` section 6:

1. Explore probe (lightning first), audio legend, captions, liner-note polish.
2. Visual polish: record discs, typefaces, first-play fade-in.
3. Listening test and screen-reader pass.
4. Feature freeze, demo video, project page, submit.
5. Only then: aerosols, B-sides, EONET alerts, Earth Today.
