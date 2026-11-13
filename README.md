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

Not yet done: listening test and screen-reader pass. Results will be added here exactly as they happen.

## Run it

```
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm test           # WAV encoder self-check
```

`calibrate.html` lets you click any point of a clip to see its pixel values, grid cell, and assigned class. Every color range in `src/records/` was measured from the clips, not guessed.

## How it works

Static site (Vite, Tone.js, Canvas 2D), no backend. Two clocks: an analysis loop reads each frame into a small grid about 15 times a second and writes features; the music clock reads them on every beat. Each record is one settings file plus an `onBeat` function in `src/records/`.

Project page: `about.html`.

## Credits

- Visualizations: NASA's Scientific Visualization Studio (5011, 5313); NASA/Goddard Space Flight Center Scientific Visualization Studio (3912). Clips trimmed and re-encoded for the browser. Aerosols: SVS 5552 / 5669. B-sides: SVS 5196, 5533, 5425, 4960, 4950. Live: NASA GIBS (MODIS/Terra), NASA EONET.
- Fonts: Atkinson Hyperlegible (Braille Institute), Bricolage Grotesque, via Fontsource.
- Built with help from an AI coding assistant (Claude).

## License

MIT for the code. NASA imagery is subject to NASA's media usage guidelines.
