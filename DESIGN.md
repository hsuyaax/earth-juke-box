# DESIGN.md — Earth Jukebox redesign

Status: **approved 14 Nov 2026 (all recommendations A-G). Built: sleeve, record reskin, liner notes, logo.** Deviation: `display-xl` is clamp(3.5rem, 11vw, 10rem), not 14vw/13rem, so the Play button sits beside the headline above the fold at 1440x900.
AGENTS.md and README.md win over anything here; where this document changes something AGENTS.md §11 says, it is listed under "Decisions I need from you" and AGENTS.md gets edited in the same commit as the code.

Three surfaces, one idea: **a record you can read (the sleeve), a record you can play (the record), and the notes inside it (the liner notes).**

---

## 1. What I looked at

Every frame in the team's design reference folder, kept outside the repository (six priority sites, four galleries, four tools), plus the six exported design guides.

Three things you should know about the pack:

- **Your "what I like" notes are blank** in the README table and in every `design-guide.md`. So the screenshots are my only evidence of your taste. Section 2 says what I took from each; correct me where I read you wrong.
- `3-tools/rareui.com` captured a "Failed to verify your browser" page, so there is nothing to learn from it. The "liquid logo" link was never captured.
- `danilodemarco.com/fullpage.png` is one viewport tall (smooth-scroll site), so I used its frames. I used the exported guides only for numbers the screenshots confirm (type sizes, gaps).

## 2. Principles, and where each came from

| # | Principle | From | How we use it |
|---|---|---|---|
| 1 | **One oversized statement per screen.** Tight leading (0.88–1.0), lines staggered left and right instead of centred blocks. | bleibtgleich.dev (90 px / 88% leading, stepped lines), 2xa.studio (144 px), danilodemarco.com | Sleeve hero and each story section open with one sentence set huge. Nothing else competes on that screen. |
| 2 | **Big type needs a small companion.** A hairline rule and a two-line caption in small type sit beside the giant line and give it scale. | bleibtgleich.dev (vertical rule, "Designer & Developer", "© '26") | Every display line gets a mono eyebrow or side caption: section number, source, or a live number from the engine. |
| 3 | **Sections hand off by flipping the surface.** Not fades between similar screens: paper to black, black to colour field. | 2xa.studio (black to white), danilodemarco.com (white to charcoal to blue) | The sleeve is paper; the "Hear it" band and the footer flip to vinyl. The flip is the cue that you are now near the sound. |
| 4 | **The manual look.** Numbered figures (`FIG.001`), a vertical side label on each figure, one-ink line art on a pale tinted panel, leader-line callouts in small caps, serif-toned editorial text, a contents list with dotted leaders, dashed rules between parts. | makingsoftware.com | The whole liner notes page. Four figures, each with a number, a vertical label, and callouts. |
| 5 | **On a dark stage, light only the object.** Everything around it stays near-black and quiet. | thibaut.cool | The record page: footage and ripples are the only bright things. Controls recede. |
| 6 | **Quiet, small, fixed navigation.** Three or four words, no bar, no burger on desktop. | thibaut.cool (four links, top left), bleibtgleich.dev (one "Menu" pill), 2xa.studio (one mono row) | One row on all three surfaces: logo disc, wordmark, three links. |
| 7 | **A status line made of real data.** 2xa's header shows live clocks in mono. | 2xa.studio | Ours shows numbers the engine is really producing (flashes per second, beat count). Never a decorative fake. |
| 8 | **Spaced-out word rows as dividers.** One sentence spread across the full width in tiny mono caps. | 2xa.studio ("MADE WITH CARE AND A LOT OF CODE") | Section dividers on the sleeve: `EVERY · SOUND · COMES · FROM · THE · PICTURE`. Read by screen readers as one normal sentence. |
| 9 | **Cards: label, title, one line, one picture.** Flat, thin edge, lots of air. | olivers-portfolio.webflow.io | The record shelf: number, title, one line of what you hear, cover. |
| 10 | **Generative covers by family.** Grid, radial, flow, noise as a visual vocabulary. | bookofshapes.com (categories only) | One pattern per record, matched to its subject (section 7). Our own code, see licence note there. |
| 11 | **One saturated accent on a neutral field.** The strongest gallery pieces use near-monochrome plus one colour. | recent.design, inspora.design (dither and blueprint pieces) | Paper + ink + violet ink on the sleeve; night blue + amber on the record. Voice colours appear only in ripples and covers. |

## 3. What I chose not to follow, and why

| From the references | Why not |
|---|---|
| WebGL scenes, 3D objects, shader gradients (2xa, bleibtgleich, thibaut, shadergradient.co) | Your decision: no decorative gradient, no WebGL on the record page. I extend it to all three: the hero's "effect" is our real engine drawing real ripples. |
| Space-agency look: dark hero with a planet (most of the dribbble "nasa website" shots) | Your decision (no globe), and it is what every other team will ship. Paper is the differentiator. |
| Headings overlapping body text (2xa) | Unreadable for low vision; fails our own audience. |
| Split-letter scramble and blur-in text (2xa, makingsoftware) | Letter-split text is read letter by letter by screen readers unless hidden and duplicated. Reveals here move whole lines only. |
| Body text at 14–16 px, weight 300 (bleibtgleich, olivers, makingsoftware) | Our floor is 18 px, regular weight. |
| Custom cursors, pinned horizontal scroll, scroll-jacking (bleibtgleich, danilodemarco) | Nothing may hijack scrolling or pointer. Lenis only smooths native scroll, and only on the two reading pages. |
| Pixel/bitmap display type (makingsoftware's title, 2xa's dot wordmark) | Striking, but hard to read for low vision at any size. |
| Skeuomorphic hardware (thibaut's keyboard footer) | Lovely, heavy, and off-subject. The vinyl disc logo is our one object. |

## 4. Type system

| Role | Typeface | Source and licence | Used for |
|---|---|---|---|
| Display | **Instrument Serif** 400 and 400 italic | `@fontsource/instrument-serif` 5.3.0, SIL OFL 1.1 (free for web use, self-hosted) | Titles only, never below 32 px |
| Body | **Atkinson Hyperlegible** 400 / 700 (unchanged) | `@fontsource/atkinson-hyperlegible`, SIL OFL 1.1 | All body text, buttons, controls |
| Labels | **Atkinson Hyperlegible Mono** 400 | `@fontsource/atkinson-hyperlegible-mono` 5.3.0, SIL OFL 1.1 | Eyebrows, figure numbers, callouts, status line |

Why Instrument Serif: a record sleeve and a printed manual both want a serif with some drama at large sizes; it sets "paper" apart from "app" instantly; and its italic gives us one expressive move (one italic word per headline, as thibaut.cool does with "it *move*"). It replaces Bricolage Grotesque, which is then removed. The mono is the same family as the body face, so I count it as part of "keep Atkinson", not as a second display face. If you disagree, see Decision A and E.

Scale (fluid, one ratio, no in-between sizes):

| Token | Size | Leading | Tracking | Use |
|---|---|---|---|---|
| `display-xl` | clamp(3.5rem, 11vw, 10rem) | 0.88 | -0.02em | Sleeve hero only |
| `display-l` | clamp(2.75rem, 8vw, 7rem) | 0.92 | -0.015em | Section statements |
| `display-m` | clamp(2rem, 4.5vw, 3.5rem) | 1.0 | -0.01em | Page titles, record titles |
| `title` | 1.5rem (24 px) | 1.2 | 0 | Card titles (Atkinson 700) |
| `body-l` | 1.25rem (20 px) | 1.5 | 0 | Lead paragraphs |
| `body` | 1.125rem (18 px) | 1.55 | 0 | Everything else. **Floor.** |
| `label` | 0.875rem (14 px) mono, uppercase | 1.3 | 0.06em | Eyebrows, figure labels. Never sentences. |

Measure: 60–68 characters for body. Display lines break by hand at set points, not by the browser.

## 5. Colour tokens

Every text pair below was computed; the number is the WCAG contrast ratio.

**Paper surface (sleeve, liner notes)**

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--paper` | `#F4EFE6` | Page (the warm white already in AGENTS.md) | |
| `--paper-2` | `#EAE3D6` | Figure panels, cards | |
| `--ink` | `#0D1B3D` | Text (the night blue already in AGENTS.md) | 14.8 on paper, 13.3 on paper-2 |
| `--ink-2` | `#4B5878` | Secondary text | 6.2 on paper, 5.6 on paper-2 |
| `--ink-accent` | `#4B2FCF` | Links, figure line art, one italic word | 7.0 on paper, 6.3 on paper-2 |
| `--rule` | `#8C8474` | Rules and borders that carry meaning | 3.2 (non-text, needs 3) |
| `--amber` | `#FFC25C` | Fill of the Play button only, with ink text | ink on amber 10.6 |

**Vinyl surface (the record, dark bands, footers)**

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--vinyl` | `#0D1B3D` | Page (unchanged) | |
| `--groove` | `#081229` | Stage surround, footer | |
| `--text` | `#F4EFE6` | Text | 14.8 on vinyl, 16.2 on groove |
| `--text-2` | `#C9C3BA` | Secondary text | 9.7 |
| `--text-3` | `#9AA3BD` | Labels, status line | 6.7 on vinyl, 7.4 on groove |
| `--amber` | `#FFC25C` | Play, focus ring, logo pulse | 10.6 |
| `--line` | `#5A6A99` | Control borders | 3.2 (non-text) |
| voice colours | unchanged | Ripples, covers, overlay only | |

One real fix hides in this table: today's button borders are `#2A3A63` on `#0D1B3D`, which is 1.5:1 and fails the 3:1 rule for control boundaries. The reskin moves them to `--line`.

Focus ring on both surfaces: 3 px solid, amber on vinyl, ink on paper, 3 px offset.

## 6. Spacing, grid, shape

- Scale: 4, 8, 12, 16, 24, 32, 48, 72, 96, 144, 192 px. Nothing off the scale.
- Grid: 12 columns, 16 px gap (bleibtgleich and 2xa both sit on 16). Page gutter 16 px on phones, 24 px tablet, 40 px desktop. Max content width 1280 px; display lines may run to the full width.
- Section rhythm: `clamp(72px, 12vw, 192px)` above and below each section. A surface flip always sits on a section boundary.
- Shape: 2 px corners on paper (print), 8 px on vinyl controls (unchanged), discs are circles. No shadows on paper; one hairline instead.
- Touch targets: 48 px minimum, 56 px for the probe pad (unchanged).

## 7. Motion rules

1. **Two easings, three durations.** `ease-out-expo` (0.16, 1, 0.3, 1) for things arriving; `ease-in-out` (0.76, 0, 0.24, 1) for surface flips. 200 ms (hover, press), 600 ms (line reveals), 900 ms (surface flip).
2. **Whole lines move, letters never do.** A display line rises 0.6 em from behind a mask, once, when it enters the viewport.
3. **The only looping motion is caused by sound or data:** ripples, the playhead, the disc spinning while playing, the logo pulse on the beat. Nothing loops for decoration.
4. **Lenis** (`lenis` 1.3.27, MIT) on the sleeve and liner notes only. Native scroll on the record page. No pinned or horizontal sections. Anchor links and keyboard scrolling keep working.
5. **Off screen means off.** The hero video, its analysis, and its ripple canvas stop when the hero leaves the viewport or the tab is hidden (IntersectionObserver + the engine's existing behaviour).
6. **Reduced motion:** Lenis is not loaded; line reveals become instant; the disc does not spin; the logo shows its static SVG; ripples become the existing still dots; surface flips cut. Every state is designed, not just "animation: none".
7. Nothing moves focus. Nothing autoplays sound. The hero video is muted, has no audio track, and is decorative until Play.

## 8. Surface outlines

URLs (Decision C): sleeve at `/` (`index.html`), record at `/play.html`, liner notes at `/notes.html`. `about.html` becomes a one-line redirect to `/notes.html`; `calibrate.html` is unchanged.

Shared on all three: skip link; one header row (logo disc, "Earth Jukebox", links: Play, How it works); footer on vinyl with the wordmark set large, NASA credits, **"Not an official NASA product"**, and the AI-use line.

### 8.1 The sleeve (landing, paper) — React entry

| # | Section | Surface | Content |
|---|---|---|---|
| 0 | Header | paper | Logo disc (static here until Play), wordmark, links. |
| 1 | **Hero** | paper | Eyebrow: `NASA SPACE APPS 2026 · THE EARTH INFORMATION JUKEBOX`. Headline `display-xl`, two stepped lines: **"Hear / the *planet*."** Below it, full width, the real lightning clip with **live ripples from our engine, silent**. Under the clip: the amber **Play** button (largest control on the page), the sentence "Every sound comes from the NASA picture, at the place it happened.", and a mono status line of real engine numbers (`FLASHES PER SECOND 12.4`). Credit: "Footage: NASA SVS 5011. Not an official NASA product." |
| 2 | The problem | paper | Statement: **"NASA shows the planet in pictures. Pictures leave people *out*."** Two short paragraphs: who is left out, what the challenge asked. Side caption in mono: `01 — THE PROBLEM`. |
| — | Divider | paper | Spaced word row: `EVERY · SOUND · COMES · FROM · THE · PICTURE`. |
| 3 | Hear it | **flips to vinyl** | Statement: **"Three records. One *language*."** The three featured records as sleeves (generative cover, title, one line of what you hear, "Play this record" link to `/play.html?r=N`). Then the sound language as four big lines: Instrument = what. Left and right = where. Pitch = how high. Loudness = how much. |
| 4 | Touch it | back to paper | Statement: **"Now put your *finger* on it."** The explore probe in three sentences, with one inline SVG figure: the map, the probe square, the arrow keys and D. Facts only: works playing and paused, keyboard first, large on-screen arrows for phone screen readers. |
| 5 | How we know it works | paper | Statement: **"Measured, not *guessed*."** Three measured facts from our own tests (real clips through the real engine; quiet about 2 flashes a second, busy about 14; false "less light" notes cut from 1–2.3% of the map to under 0.1%). Then, in the same size and weight, **what has not been done: the listening test and the screen-reader pass.** No softer wording than the README uses. |
| 6 | Call to action + footer | vinyl | "Play the record" (to `/play.html`), "Read the liner notes" (to `/notes.html`), then the shared footer. |

Hero behaviour (Decision B): pressing Play starts the lightning record's real audio **in place** (Tone.js and the record load on that click, so the page stays light and silent before it). The button becomes Pause; Escape stops. "Open the full jukebox" sits beside it. The clip starts 12 s in for the hero only, because the first 10 s of the full clip are the quiet stretch; this is a start position, not an engine change.

### 8.2 The record (jukebox, vinyl) — plain JavaScript, reskin only

Same elements, same order, same ids, same keyboard map. What changes is skin:

- Header row replaces the big title block: **logo disc pulses on each beat**, wordmark, links to the sleeve and the liner notes, mono status line.
- Stage: surround in `--groove`; the footage and ripples stay the only bright things. No new effects.
- Controls: same controls; borders move to `--line` (contrast fix); Play stays amber.
- Record shelf: each record becomes a small sleeve card with its **generative cover**; the selected record's disc slides half out of its sleeve and spins while playing (the existing spin, moved). Titles in Instrument Serif.
- Liner notes panel, probe pad, EONET list, footer: restyled type and spacing only. All text, labels, live regions, and the "experimental raga" and "not a warning system" notices stay word for word.

Not touched: `analysis.js`, `audio.js` mappings, `explore.js` logic, record data files, shortcuts. Two additive hooks only (Decision F): a beat callback for the logo, and reading `?r=N` to preselect a record.

### 8.3 The liner notes ("How it works", paper) — React entry

An editorial manual in makingsoftware's manner, our palette: violet-ink line art on `--paper-2` panels, mono callouts, serif titles.

| # | Part | Content |
|---|---|---|
| — | Title block | `LINER NOTES` eyebrow; **"How a picture becomes a *song*."**; one-paragraph summary; contents list with dotted leaders and part numbers. |
| 01 | The pipeline | **FIG.001 Architecture.** Video frame, analysis engine, features, music clock and probe, notes, then pan / pitch / ripple. One horizontal blueprint, stacks vertically on phones. |
| 02 | Reading a frame | **FIG.002 Data flow.** One frame drawn at 4× the grid; each 4×4 block averaged; each cell keeps its mean colour and its brightest pixel; cells become classes, flashes, motion. |
| 03 | Two clocks | **FIG.003 The two clocks.** Two timelines: analysis ticks (uneven, about 15 a second) and beats (steady). Arrows show each beat reading the latest features. Why the music stays steady when frames stutter. |
| 04 | One frame, one sound | **FIG.004.** A worked example on the lightning map: a flash at a cell, its x becoming pan, its y becoming a note in the scale, its strength becoming loudness, and the ripple landing on the same spot. |
| 05 | The sound language | The four rules and the sound-family table from AGENTS.md §8. |
| 06 | Exploring by touch | The probe rules in plain language. |
| 07 | How it was measured | Calibration tool, the two test commands, the measured numbers with their reasons. Testing status exactly as README states it. |
| 08 | Honest limits | From `about.html`, unchanged in meaning. |
| 09 | Sources and credits | NASA resources with links, fonts and licences, AI-use line, "Not an official NASA product". |

Figures: the `diagram-design` skill is **not installed** here, so the four figures are hand-written inline SVG. Each has `role="img"`, a `<title>` and `<desc>`, a visible caption, and the same content as ordered text directly below it, so nothing lives only in the picture. Callout text never renders below 14 px; on phones each figure switches to a vertical layout instead of shrinking.

## 9. Components

**Logo.** A vinyl disc, 32 px in the header: outer ring, three grooves, amber centre label. On the record page each beat of the live audio sends one ring outward from the label (one `scheduleRepeat` draw callback; no audio change). Paused, reduced motion, or before any sound: the static SVG. The same SVG is the favicon.

**Record covers.** One generative SVG per record, drawn by our own code (no pattern source is copied, so there is no third-party licence to clear; Book of Shapes was used only as a vocabulary of families). Seeded by record id, so a cover is always the same.

| Record | Pattern | Why |
|---|---|---|
| Lightning | Radial: bursts of short rays from scattered points | Strikes |
| Night Lights | Grid: dots of varying size on a lattice, dense clusters | Cities |
| Currents | Flow: streamlines through a seeded field | Water moving |
| Aerosols | Noise: drifting layered bands | Plumes |
| CO2 | Contour rings | Concentration |
| Air Quality | Four vertical stripe fields | The four pollutant strips |
| Perpetual Ocean 2 | Spiral eddies | Boundary currents |
| Atmospheric River | One long ribbon across the square | The river |
| GEDI Forest Height | Vertical bars of varying height | Canopy height |
| Earth Today | Slanted arcs with gaps | Satellite passes |

Covers are two-colour: the record's voice colour on `--groove`. Decorative, `aria-hidden`; the title carries the meaning.

## 10. Build plan (Step 2, after approval)

Order, one commit each, each checked at 375 px before moving on: **1. sleeve, 2. record reskin, 3. liner notes, 4. logo.** `npm test` and `npm run test:clips` run before the first commit and after each one.

New dependencies, each with its one-line reason for the commit message:

| Package | Licence | Reason |
|---|---|---|
| `react`, `react-dom` | MIT | Sleeve and liner notes only, as separate Vite entries (your decision) |
| `@vitejs/plugin-react` (dev) | MIT | JSX for those two entries |
| `lenis` | MIT | Smooth scroll on the two reading pages (your decision) |
| `@fontsource/instrument-serif` | OFL 1.1 | Display face, self-hosted (AGENTS §18: no font CDNs) |
| `@fontsource/atkinson-hyperlegible-mono` | OFL 1.1 | Labels, same family as body |

Removed: `@fontsource/bricolage-grotesque`.

Performance budget: sleeve JavaScript under 80 KB compressed before Play; Tone.js loads only on Play; hero video `preload="metadata"` with a poster frame; one canvas on the sleeve; no canvas, WebGL, or new animation loops on the record page beyond the logo's one ring per beat.

## 11. Risks I already see

- **Serif display for low-vision readers.** High-contrast serifs are harder to read small. Mitigation: never below 32 px, never for sentences longer than a headline, body stays Atkinson.
- **Smooth scroll and assistive tech.** Lenis can fight screen-reader scrolling. Mitigation: not loaded under reduced motion, native scroll semantics kept, tested with NVDA before the commit is called done.
- **Hero cost on phones.** Video decode + analysis + canvas on the landing page. Mitigation: it is the same engine the record page already runs, paused off screen, and a still poster under reduced motion or Save-Data.
- **Renaming the jukebox URL** to `/play.html` breaks nothing deployed (nothing is deployed yet) but README, AGENTS.md, tests scripts, and the Pages workflow need the new paths.

## 12. Decisions I need from you

| | Decision | My recommendation |
|---|---|---|
| A | Display typeface | **Instrument Serif.** Alternative: keep Bricolage Grotesque (already installed, grotesk, closer to bleibtgleich and 2xa, zero new font). |
| B | What the hero's Play does | **Plays the lightning record in place** on the sleeve. Alternative: it only links to the jukebox (simpler, but the visitor needs a second click before any sound). |
| C | URLs | **Sleeve at `/`, record at `/play.html`, notes at `/notes.html`, `about.html` redirects.** |
| D | Covers vs clip crops | AGENTS.md §11 says each disc label is a circular crop of its clip. **Generative pattern on the sleeve, clip crop kept as the disc's centre label,** so both survive. |
| E | The mono companion | **Use Atkinson Hyperlegible Mono for labels.** Alternative: labels in regular Atkinson, uppercase and tracked (one font fewer). |
| F | Two small additions to the record page | **A beat callback for the logo and `?r=N` to preselect a record.** Neither changes sound, mapping, or shortcuts, but they are new code in `main.js`, so I am asking. |
| G | Headlines | The five statements in section 8.1 are drafts. Change any wording you like. |
