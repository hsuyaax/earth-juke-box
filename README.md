# Earth Jukebox

Hear the planet. A website that turns NASA Earth visualizations into live music, generated in the browser from the video frames, at the place each thing happens. Built for the NASA Space Apps Challenge 2026, "The Earth Information Jukebox."

**Not an official NASA product.** This is a sonification of the visualizations, not of the raw data; values read from colors are approximate.

## Records

| Key | Record | SVS | What the engine reads | What you hear |
|---|---|---|---|---|
| 1 | Lightning from the ISS 2017–2023 (flat map) | [5011](https://svs.gsfc.nasa.gov/5011/) | New yellow lightning dots (brightness jump above a running average) | A drum hit per flash; a low rumble that grows with the flash rate |
| 2 | Night Lights 2012–2023 | [5313](https://svs.gsfc.nasa.gov/5313/) | Lit cells and their color: violet (more light), orange (less light), plain lights | A west-to-east sweep of plucks; bright pluck = light / more light, soft pluck = less light; a pad that follows overall brightness |
| 3 | Sea Surface Currents and Temperature | [3912](https://svs.gsfc.nasa.gov/3912/) | Warm vs cold water by hue; motion between frames | Warm pad and cold bell that follow how much of each is on screen; a sweep that plays the fastest water, busier when the sea is busier |

### More records (P2)

| Key | Record | Notes |
|---|---|---|
| 4 | GEOS Aerosols ([SVS 5552](https://svs.gsfc.nasa.gov/5552/)) | Dust = gritty noise, smoke = low breathy rush, sea salt = airy hiss |
| 5–9 | B-sides: DYAMOND CO2 (5196), Air Quality (5533), Perpetual Ocean 2 (5425), Atmospheric River (4960), GEDI Forest Height (4950) | Default mapping: brightness → loudness, strongest color → chord, motion → tempo. Moving cameras, so artistic, not geographic |
| 0 | Earth Today (live) | Yesterday's MODIS true-color Earth from NASA GIBS, through the same engine |

Also: live natural events from [NASA EONET](https://eonet.gsfc.nasa.gov/) as map markers the probe can touch (not a warning system), experimental raga scale presets, "Save 20 s as WAV", and phone vibration on probe class changes.

## One sound language

- Instrument = what it is. Left/right = position on the map. Pitch = height on the map, snapped to a pentatonic scale. Loudness and pulse speed = how much.
- Every note draws a ripple on the map at its source, in that voice's color.

## Accessibility

- Everything works by keyboard: `Space` play/pause, `1`–`9` and `0` pick a record, `O` show what the engine sees, `Esc` stop all sound.
- **Explore by touch:** move a mouse or finger over the map, or focus the map and use the arrow keys (Shift = 5 cells). You hear what is under the square; `D` describes it. Large on-screen arrow buttons for phone screen readers. Works while playing and paused.
- "Learn the sounds" plays each instrument with its label. Captions describe the music every few seconds. No sound before you press something. Reduced-motion settings are respected.

## Testing status

Not yet done: listening test and screen-reader pass. Scripts: `tests/LISTENING_TEST.md`, `tests/SCREEN_READER_TEST.md`. Results will be added here exactly as they happen.

## Run it

```
npm install
npm run dev        # open the URL it prints (5173, or the next free port)
npm run build      # static site in dist/
npm test           # fast self-checks (see Tests)
```

`calibrate.html` lets you click any point of a clip to see its pixel values, grid cell, and assigned class. Every color range in `src/records/` was measured from the clips, not guessed.

## How it works

Static site (Vite, Tone.js, Canvas 2D), no backend, no API keys. The only outside requests are to NASA EONET and NASA GIBS (both CORS-enabled, keyless).

```
<video> ──decoded frame──▶ analysis (src/analysis.js) ──writes──▶ features ◀──reads on each beat── music clock (Tone.Transport)
                                    ▲                                 │                                      │
                          same engine in Node                        ▼                                      ▼
                    (tools/engine_run.mjs, tests)              explore probe                  notes ──▶ pan, pitch, ripple
```

Each record is one data file (`src/records/<id>.data.js`: grid, map area, color classes, flash settings) plus one `onBeat` function that turns features into notes.

## Engineering of the core

- **One engine, browser and Node.** `createEngine(rec)` in `src/analysis.js` is pure: an RGBA buffer and a time step go in, features come out. No DOM, no allocation per frame. The browser wrapper feeds it video frames; `tools/engine_run.mjs` feeds it the same clips decoded by ffmpeg. Calibration and tests run the exact code the app runs.
- **Exact, browser-independent downscaling.** The map area is drawn at 4x the grid, then each 4x4 block is box-averaged by our own code. A cell's color is the true mean of its block in every browser, so the same frame gives the same sound everywhere. Each cell also keeps its brightest pixel (`peak`), so a one-pixel lightning dot is never averaged or aliased away.
- **Driven by real frames.** Analysis runs on each decoded video frame (`requestVideoFrameCallback`, capped at about 15 per second), with a timer fallback. A paused or hidden video costs nothing; results stay cached for the probe.
- **Frame-rate independent.** Every smoothing step uses `alpha = 1 - exp(-dt / tau)` and cooldowns are in seconds, so a slow phone, a throttled tab, or a 60 fps clip gives the same result as the 15 Hz the constants were calibrated at. Motion is a rate, normalised to that tick.
- **Flash detection.** Brightest-pixel luma (Rec. 709) jumps above a per-cell running average; the cell must be the local maximum of its 3x3 neighbourhood (one flash, one hit), match the lightning color class, and then rests for a cooldown. At most 6 hits per beat, snapped to the beat grid.
- **Context-aware classes.** A class can require another to be on screen (`requires`). Measured on the clip, violet appears only on the night-lights change map, so orange counts as "less light" only there; during the yearly series, orange-hued city lights stay "light" (orange during the series fell from 1–2.3% of the map to under 0.1%).
- **Probe.** Reads a 3x3 neighbourhood each tick on its own clock (works while paused). Sustained classes need 2 ticks to switch (hysteresis); events fire at once. While paused, lightning uses a spatial detector (brightest cell above its 5x5 ring by a measured 0.04). Spoken updates are throttled but never dropped.
- **Audio.** One master chain with a limiter; pitch always snapped to the scale; each note carries its map position, which drives pan, pitch, and its ripple together. Only the current record's instruments exist; the previous record's are freed on switch.
- **Measured, not guessed.** Every threshold comes from running the real clips through the engine, and the reason is written next to the number. Example: flash jump 0.25 gives a quiet start (~2 flashes/s), a busy peak (~14/s), and only 16% of beats at the 6-hit cap (0.15 would cap 77%).

## Tests

```
npm test            # fast, no ffmpeg: color math, class matching (hue wrap), 1-px dot survives downscale,
                    # frame-rate independence, context gates, WAV encoder
npm run test:clips  # real clips through the real engine (needs ffmpeg): lightning quiet-vs-busy and cap,
                    # night lights orange/violet only on the change map, currents warm tropics and no land
node tools/engine_run.mjs <record> [start] [duration] [fps]   # calibration statistics for any record
```

Project page: `notes.html` (liner notes: how it works, who it helps, test status, sources). The landing page is `index.html`; the jukebox is `play.html`.

## Credits

- Visualizations: NASA's Scientific Visualization Studio (5011, 5313); NASA/Goddard Space Flight Center Scientific Visualization Studio (3912). Clips trimmed and re-encoded for the browser. Aerosols: SVS 5552 / 5669. B-sides: SVS 5196, 5533, 5425, 4960, 4950. Live: NASA GIBS (MODIS/Terra), NASA EONET.
- Fonts: Atkinson Hyperlegible and Atkinson Hyperlegible Mono (Braille Institute), Instrument Serif, via Fontsource (all SIL OFL).
- Built with help from an AI coding assistant (Claude).

## License

MIT for the code. NASA imagery is subject to NASA's media usage guidelines.
