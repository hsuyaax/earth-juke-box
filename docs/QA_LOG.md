# QA log

Findings and fixes from the final recheck (FINAL_SUBMISSION.md, Part 1), followed by a record of the mistakes made while building the project and how each was found and fixed. Commit references are from `git log`.

How the recheck was run: the production build (`npm run build`) served from a sub-folder, `/earth-juke-box/`, the way GitHub Pages serves it, by a local server that returns 404 for anything outside that folder (so a root-absolute path would fail). Pages were driven in Chromium by scripts; widths 320, 375, 768 and 1440 px.

## Final recheck: findings

| # | Where | Finding | Status |
|---|---|---|---|
| 1 | All pages | No social preview image (`og:image`) | Fixed in Part 6 |
| 2 | `calibrate.html` | No "Not an official NASA product" line, no description, 16 px body text, 40 px controls | Fixed: line and clip credits added, description added, 18 px text, 48 px controls |
| 3 | `calibrate.html` | Imported whole records (and with them the audio engine) only to read their engine settings, creating an audio context at load | Fixed: imports the `.data.js` settings files only |
| 4 | `about.html` (redirect) | No icon link, so the browser requested `/favicon.ico` outside the sub-folder and logged a 404 | Fixed: icon link added; description and the NASA line added |
| 5 | Jukebox footer | Credited "NASA's Scientific Visualization Studio" without listing the nine clips | Fixed: every clip linked by SVS number, plus GIBS and EONET |
| 6 | README, guide, jukebox | Aerosols cited "SVS 5552 / 5669" without saying which video is used | Fixed: the video is SVS 5552, a flat, unlabelled version of the same GEOS model as the challenge's SVS 5669, which offers stills only |
| 7 | Header navigation | Different on every page (Play / How it works; Home / How it works; Jukebox / How it works), and no page marked as current | Fixed in Part 2 (one shared navigation with `aria-current`) |
| 8 | Repo | `AGENTS.md`, `BUILD_PLAN.md`, `DESIGN.md` were git-ignored, and the pass documents untracked | Fixed: tracked; `DESIGN.md` had a personal folder path, removed first |
| 9 | Jukebox at 320 and 375 px | The sweep flagged "Volume" as clipped text | Not a defect: that label is deliberately visually hidden on phones and still names the slider for screen readers |
| 10 | Earth Band page, jukebox crate, guide | "Up to four play at once" is not what the code does: four is the cap on phones and at the start, and a computer that has kept up for 5 seconds may add more (`src/band/main.js`) | Fixed in Part 6: all three say four on a phone, more on a computer that keeps up |
| 11 | Guide, pages table | Said Earth Band was "not linked from the jukebox yet", untrue after Part 2 | Fixed in Part 6 |
| 12 | Guide description | Said the guide explains the pipeline "in four figures"; it is now a 16-part guide | Fixed in Part 6 |

Part 6 also measured the landing page's first load: 0.6 MB transferred in the first 5 seconds (the lightning preview streams by range requests), and Tone.js is not loaded until Play. Every image on every page has alt text or sits inside an `aria-hidden` element.

## Final recheck: checks that passed

- Every page loads with no console errors and no failed requests under the sub-folder (after fix 4): landing, jukebox, Earth Band, guide, calibration, and the `about.html` redirect, which lands on the guide.
- Every record plays: `play.html?r=0` to `r=9`, each advancing after Play, including Earth Today from NASA GIBS.
- Network blocked for NASA GIBS and NASA EONET: the jukebox says "Could not load today's image from NASA GIBS. Try again later." and "Could not reach NASA EONET. The list may be out of date."; there are no page errors and other records still play.
- Earth Band: pads, hold and keyboard solo, S to solo, Sparse, the member cap, off members pausing their video and worker, scenes, chord display, Escape, and record to WAV; every pitched value in A natural minor.
- Every in-page anchor has a target; every internal link returns 200; all 15 external links return 200; no root-absolute links.
- Keyboard only: every tab stop on the landing page (15), jukebox (23), Earth Band (23) and guide (60) shows a visible focus ring. Escape stops all sound on the landing hero, the jukebox and Earth Band.
- No sound before a user action: the landing page, Earth Band and the guide create no audio context at load. The jukebox creates one at load but the browser keeps it suspended until the first click (checked with the browser's normal autoplay rules), so it is silent.
- Reduced motion and Save-Data: no hero or backdrop video loads; the Pause motion button is hidden because nothing moves. Pause motion itself was checked in the design pass (every backdrop returns to its poster, the choice is kept for the session).
- No sideways scroll on any page at 320, 375, 768 or 1440 px.
- "Not an official NASA product" on every page (after fixes 2 and 4).
- Fonts named in the README match what ships (Atkinson Hyperlegible, Atkinson Hyperlegible Mono, Instrument Serif).
- No personal paths, local IP addresses or temporary folders in tracked files (after fix 8).
- File sizes: the largest file is 42.6 MB (`public/clips/perpetualocean.mp4`), under GitHub's 100 MB limit; the built site is 161 MB, under the 1 GB GitHub Pages limit.
- `calibrate.html` is not in any page's header navigation; the guide links to it from "Run it yourself".
- `npm test` and `npm run test:clips` pass.

## Record of mistakes made during the build

Each of these shipped to a branch, or nearly did, before it was caught. They are listed so the same mistakes are not repeated.

| Mistake | How it was found | Fix |
|---|---|---|
| B-side records changed the music tempo from inside the beat callback; Tone's clock threw "Cannot read properties of undefined (reading 'time')" a few seconds in, and the music stopped | A stress script reproduced it; the old build failed about 4 s into a B-side | The tempo ramp moved out of the clock loop, in steps of 4 bpm at most every 4 s (`6573a1f`) |
| The Sea Surface Currents record had a constant whistle | Recording the output with each layer muted showed the cold pad (an FM tone with a non-musical ratio) was the only source of bright, noise-like sound | Softer pads with an integer ratio and a lower cutoff (`8135567`) |
| The raga presets made no audible difference | Measured pitch classes: Bhupali was identical to the default scale, Durga differed on 6% of notes, and nothing stated the home note | Rebuilt with distinct presets, a shared tonic, strong notes and a reference drone (`01e7292`) |
| The landing page's silent lightning preview played with no way to pause it, against WCAG 2.2.2 | Review of moving content | A visible Pause picture control (`3a11136`) |
| Labels at 14 px, and figure text that shrank to about 9 px on tablets | Measuring every rendered text node at five widths | Labels 16 px, prose 18 px, figures that pick a layout so their text never scales down (`6537a59`) |
| On the jukebox shelf the record disc showed through the sleeve and slid and spun on one element | Review against the sleeve design | An opaque sleeve with a separate sliding track and spinning disc (`3afecce`) |
| Earth Band's first clips at 480 px lost most lightning dots (3.5 instead of 9.2 flashes a second) and half of the night-lights change colours | Running the engine over the small clips and the full clips | Lightning at 640 px with a measured threshold, night lights at 960 px (`b26dcc1`) |
| Earth Band's analysis took about 420 ms of main-thread time each second, too much for a phone | Per-second timing in the browser, with CPU throttling | Analysis moved into one Web Worker per member (`b26dcc1`) |
| A shaker noise centre landed outside A minor; one band test was tautological (it compared notes against the module's own scale, so a wrong scale passed) | The browser pitch check, and deliberately breaking `theory.js` to see if the tests failed | Noise centres snap to pentatonic notes; tests now use their own expected values (`824a88c`, `30e2285`) |
| Several layout passes widened the page on phones (backdrop scale past the edge, long words in the guide, crop marks outside figures) | A sideways-scroll check at 320–1440 px after every change | Each fixed in its own commit (`e528a59`, `77fbcfb`, `08a1655`, `772b319`) |
| Commit messages that overstated a check (one claimed no text was clipped at 320 px while a check still found one; another rounded a contrast figure up) | Re-reading each message against the test output | The code was fixed and the messages corrected before anything was pushed |
| Commits carried an AI co-author line the team did not want | The team asked for it to be removed | History rewritten before the first push to the new repository; no co-author lines since |
| Two screenshots from a test script were written into the repository root | `git status` before a commit | Moved out before committing |
| The "before" screenshots taken at the start of the second design pass showed a different app that was running on the same local port, not Earth Jukebox | Opening them in Part 6 to reuse them | Not used. `docs/screenshots/before/` is taken from the live site instead, which still runs commit `b26dcc1`; scripts now print each page's title next to its screenshot |
| A sentence written in Part 2 ("plays up to four of these visualizations at once") repeated an untrue claim instead of checking the code | Checking each band claim against `src/band/main.js` in Part 6 | Corrected (finding 10) |
