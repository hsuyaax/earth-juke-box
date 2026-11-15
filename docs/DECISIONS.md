# Decisions

Each major decision, why it was made, and what was rejected ("Not recorded" where no alternative was written down at the time). D1–D10 are the decisions in `AGENTS.md` section 5; the rest were made during the build and are recorded in `AGENTS.md`, the pass documents, or the commit that made them.

## Product

| # | Decision | Why | Rejected |
|---|---|---|---|
| D1 | Three featured records: Lightning (5011), Night Lights (5313), Sea Surface Currents and Temperature (3912) | Each has a different kind of feature to hear: sudden events, a colour-coded amount, and motion with temperature | Aerosols as a fourth core record (see D8) |
| D2 | All nine listed visualizations appear; six are B-sides with one default mapping | The challenge lists them, and one default mapping covers them without hand-tuning each | Leaving them out; a custom mapping for every one |
| D3 | The engine reads the video frames in the browser, live | The challenge asks for sound generated in real time from the frames | Pre-rendered audio; a data series or weather API standing in for the picture |
| D4 | One sound language everywhere: instrument = what, pan = left-right, pitch = up-down, loudness = how much | A listener learns it once and it holds for every record and for the probe | A different meaning for pitch or pan in each record |
| D5 | The explore probe works while playing and while paused, keyboard first | People who cannot see the screen need to inspect the picture at their own pace | Not recorded |
| D6 | Every note draws a ripple at its source | Sighted listeners can see what they hear, so the mapping is checkable | Not recorded |
| D7 | Scales are data in each record's settings; pentatonic by default | Pentatonic notes do not clash, so live data always sounds musical | Raw frequencies (noise rather than music) |
| D8 | Aerosols is P2 and never a fourth P0 record | Protects the three core records' time | Adding it to the core |
| D9 | Earth Today and EONET alerts are P2, in-app only, labelled "not a warning system" | Live data is useful but not the core, and a hackathon project must not look like a warning service | Presenting EONET as a warning system (AGENTS.md section 13) |
| D10 | Static site, no backend, no API keys | Free to host, nothing to break or leak, works from GitHub Pages | Not recorded |

## Clips

| Decision | Why | Rejected |
|---|---|---|
| Lightning uses the flat-map file (`iss_lightning_sos_yearly_07312023_2048p60.mp4`) | Left-right and up-down must mean where on Earth; a flat map makes that true | The 1080p globe view, whose rotation could cause false flashes |
| Night Lights is cropped to the left half of the EIC frame | The EIC frame holds two copies of the world map | Reading the full 32:9 frame |
| Aerosols uses SVS 5552 (`Aerosols_NoLabels_2048x1024_30fps.mp4`), credited with 5669 | The listed SVS 5669 offers stills only; 5552 is a flat, unlabelled video of the same GEOS model | Stills; a labelled version whose text would be read as colour |
| CO2 uses the `globe_zoom` version | The `globe_tilt` version is too dark to read | `globe_tilt` |
| Earth Today uses GIBS `MODIS_Terra_CorrectedReflectance_TrueColor` | VIIRS tiles came back blank | VIIRS |
| All clips full length, H.264, faststart, streamed by range requests; the two 5-minute B-sides at 960 px | The whole visualization plays, and a stream starts quickly at about 1 Mbps | 40-second excerpts (the first plan) |

## Engine

| Decision | Why | Rejected |
|---|---|---|
| One pure engine (`createEngine`) shared by the browser and Node | Calibration and tests run the exact code the app runs | The earlier browser-only analysis, replaced in `2cd8dfc` |
| Our own 4x box downscale, plus each cell's brightest pixel | The same frame gives the same sound in every browser, and a one-pixel lightning dot survives | The browser's own image scaling, which differs between browsers and averages dots away |
| Analysis driven by decoded frames (`requestVideoFrameCallback`), smoothing by time constants | A slow phone or throttled tab gives the same result; a paused video costs nothing | A fixed timer and per-tick smoothing that changed with frame rate |
| Every threshold measured with `tools/engine_run.mjs` and locked by `npm run test:clips` | Values come from the real clips, with the measurement written next to each number | Guessed thresholds |
| Orange counts as "less light" only while violet is on screen (`requires`) | Measured: violet appears only on the change map; orange city lights during the yearly series are just lights | A fixed orange = less light rule, which mislabelled the yearly series |

## Music

| Decision | Why | Rejected |
|---|---|---|
| The B-side tempo changes outside the beat callback, in small steps (`6573a1f`) | Changing tempo inside Tone's clock callback crashed the music | Ramping inside the callback |
| Currents pads use an integer FM ratio and a lower cutoff (`8135567`) | The non-musical ratio made a constant whistle | The original cold pad |
| Raga-inspired scales with a shared tonic, strong notes and a reference drone; changes on the bar line (`01e7292`) | The first presets were inaudible: one equal to the default scale, one differing on 6% of notes | Scale swaps with no home note; changing scale mid-bar |
| Raga-inspired scales labelled "inspired by", not ragas | A raga is more than a scale (movement, phrasing, time) and no trained musician has reviewed them | Not recorded |

## Earth Band

| Decision | Why | Rejected |
|---|---|---|
| One key, A natural minor, with a chord conductor; the data picks direction and activity, theory picks notes | Nine sources played together must not clash | Not recorded |
| One Web Worker per member (`b26dcc1`) | Main-thread analysis took about 420 ms a second, too much for a phone | Analysing every clip on the main thread |
| Lightning band clip at 640 px, night lights at 960 px | At 480 px most lightning dots and half the night-lights change colours were lost (measured) | 480 px for every band clip |
| Four members at once on phones and at the start; more on a computer that has kept up for 5 seconds | Keeps a phone responsive without limiting a fast computer | Not recorded |
| Labelled "an artistic remix" | The visualizations cover different years, so playing them together is not a record of simultaneous events | Presenting the band as a combined picture of one moment |

## Design and access

| Decision | Why | Rejected |
|---|---|---|
| Atkinson Hyperlegible for reading, 18 px minimum; labels 16 px (`6537a59`) | Designed for low-vision readers; 14 px labels and shrinking figures failed the size check | The 14 px labels |
| The ripples are the one bold element; the only ambient effect is a dim glow from the picture | Keeps attention on the picture and its sound | Decorative gradients and star backgrounds |
| A Pause control for every moving picture; no video under reduced motion or Save-Data (`3a11136`, `e528a59`) | WCAG 2.2.2 and data cost | Autoplaying motion with no control |
| One navigation on every page, current page marked with `aria-current` (part 2 of the final pass) | Each page had its own navigation and none marked the current page | The per-page navigation it replaced |
