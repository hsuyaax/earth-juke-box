# POLISH_PASS_3.md — Jukebox redesign, audible ragas, and the full guide

For the coding agent. Read `AGENTS.md`, `DESIGN.md`, and `DESIGN_PASS_2.md` first; their accessibility and honesty rules win.
Work on a new branch from `feature/design-pass-2`. One commit per part. `npm test` must pass before and after each part.

Three parts, in this order:

- **Part A — Jukebox page redesign** (`play.html`, the page with all ten records). It still looks weak.
- **Part B — Raga presets.** Right now switching them makes no audible difference. Fix it within 90 minutes or hide the feature.
- **Part C — Turn the liner notes page into the complete guide** to the project.

---

## Part A — Jukebox page redesign

The liner notes and landing pages now look good; the jukebox does not match them. This is the page judges will use, so it gets the most care. Visual and layout work only: keep every element id, control, keyboard shortcut, accessible name, and behaviour.

### A0. Look before changing
Take screenshots at 1440 px and 375 px. Write a short critique in the commit message against these questions, then fix what you find:

- Where does the eye go first? It should be the NASA footage.
- Is there one clear primary action (Play)?
- Do ten records feel like a curated shelf or a wall of equal boxes?
- Are tools scattered, or grouped by purpose?
- Is there a clear type hierarchy (one large title, one body size, one caption size)?
- Is spacing doing the grouping, or are borders and boxes?

### A1. Layout: a turntable, three zones

```
┌────────────────────────────────────────────────────────────┐
│  STAGE  full-width NASA footage + ripples, ambient glow    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  ▶  ───────●──────────  0:12 / 0:40   🔊 ───   [Explore]   │  transport bar
├───────────────────────────┬────────────────────────────────┤
│  NOW PLAYING              │  LINER NOTES                   │
│  sleeve + disc            │  What it shows                 │
│  01  Lightning            │  What you'll hear              │
│  from the ISS             │  What to listen for            │
│  SVS 5011 · 2017–2023     │  [Learn the sounds]            │
├───────────────────────────┴────────────────────────────────┤
│  THE CRATE   Featured ▸ 3 large sleeves                    │
│              B-sides  ▸ smaller sleeves, one row           │
│              Live     ▸ Earth Today                        │
└────────────────────────────────────────────────────────────┘
```

- **Stage:** the widest, tallest thing on the page. Footage edge to edge inside the page margin, on the grooved deck, with the ambient glow. Nothing else competes with it above the fold.
- **Transport bar:** one continuous strip directly under the stage: Play/Pause (the largest control, amber), scrub, time, volume. Explore-by-touch toggle sits at its right end. No other buttons here.
- **Now playing:** the selected sleeve with its disc out, the record number in large mono, the title in the display face, and one mono caption line (SVS number, years, credit).
- **Liner notes:** three short labelled paragraphs, then "Learn the sounds". Line length 45–70 characters.
- **The crate:** records grouped under three small headings (Featured, B-sides, Live). Featured sleeves are about 1.5× the size of B-sides. B-sides carry an "artistic, not geographic" caption once, on the group, not on every card.
- **Tools:** everything secondary (what the engine sees, scale/raga, save WAV, vibration, captions) moves into one "Tools" row or disclosure below the liner notes, grouped and labelled. Same controls, same ids, new home.

### A2. Hierarchy and detail
- Type: display face only for the record title and group headings; body in Atkinson Hyperlegible at 18 px or more; captions in mono. Three sizes on the page, no more.
- Remove boxes around groups; separate with space and thin rules. Keep visible borders on real controls (3:1 contrast or better).
- The selected sleeve is obvious without colour alone: disc out, a rule under it, and "Now playing" text.
- Each record's ink colour drives the Play button's ring, the scrub fill, the glow, and the sleeve accent.
- Give the page a loading state (sleeve skeletons, "Loading clip…") and a friendly failure state for a clip or live source that does not load.
- Footer: credits and "Not an official NASA product", small but readable.

### A3. Phone
- Stage pinned at the top while scrolling the rest.
- Transport bar directly under it, thumb-sized targets (44 px or more).
- Below: three tabs or stacked sections in this order: Now playing and notes, The crate, Tools. The crate becomes a horizontal scroll row per group with visible scroll affordance.
- The large on-screen arrow buttons for the probe stay reachable.

### A4. Do not
- No new video decode, no WebGL, nothing that steals focus or changes tab order unexpectedly. If DOM order changes, re-check that keyboard order still reads: stage, transport, now playing, notes, crate, tools.
- Update `AGENTS.md` §11 to allow the ambient glow, since the previous pass already overrides it.

### A5. Done when
Before and after screenshots at both sizes; keyboard walk-through of every control still works; no horizontal overflow from 320 to 1440 px; AA contrast holds.

---

## Part B — Raga presets you can actually hear

### B1. Diagnose first (15 minutes)
1. Confirm the selected preset really reaches the pitch function for every pitched voice.
2. For Night Lights, run 30 seconds per preset through the engine and print a pitch-class histogram. Report it.

### B2. The likely cause
Several presets are the **same five notes rotated**. Bhupali is exactly the major pentatonic that is already the default. Megh, Malkauns, and Durga are other rotations of that same set. Rotations only sound different when the ear knows where the home note is, and nothing currently states it. Unpitched drums and a melody whose pitch comes from map position hide the rest.

### B3. The fix
- **A drone that states the home note.** When a raga preset is on, hold a quiet tanpura-style drone: the tonic and the fifth, low and soft (tonic and fourth for Malkauns, which has no fifth). Its volume may follow overall brightness. Say plainly in the UI and notes that the drone is a fixed reference tone, not data.
- **One shared tonic** for all presets, so the only thing that changes is the pattern of intervals.
- **Four presets with clearly different colours**, replacing near-duplicates:

| Preset | Degrees from the tonic | Strong notes (vadi, samvadi) | Character |
|---|---|---|---|
| Bhupali | 1 2 3 5 6 | 3, 6 | Open, bright |
| Yaman | 1 2 3 #4 5 6 7 | 3, 7 | Evening; the raised 4th is the tell |
| Bhairav | 1 b2 3 4 5 b6 7 | b6, b2 | Dawn; the flat 2nd and flat 6th are the tell |
| Malkauns | 1 b3 4 b6 b7 | 4, 1 | Dark, deep; no 5th |

- **Lean on the strong notes.** On strong beats, if the data's note is within one scale step of the preset's vadi or samvadi, snap to it. The last note before a rest resolves to the tonic when it is within one step.
- **Glide.** On sustained voices, a short slide (60–120 ms) between consecutive melody notes.
- **Only where there is melody.** Show the switcher only on records with pitched melodic voices. On drum-led records it is hidden.
- **Switching** takes effect on the next bar, is announced once in the live region, and plays the scale once up and down ("Hear this scale") on request so the difference can be compared directly.

### B4. Tests
- Relative to the tonic, every pair of presets differs by at least two notes.
- For a fixed feature input, the strong-beat histogram's most common note is the vadi or samvadi.
- Same input twice gives the same notes.

### B5. Honesty and the cut line
- Label the feature "Scales inspired by ragas (experimental)". A raga is more than a scale, and nobody trained in Hindustani music has reviewed this. Keep that sentence in the notes.
- **If, after 90 minutes, a listener cannot tell Yaman from Bhairav from Malkauns on Night Lights within ten seconds each, hide the switcher** and leave the default scales. Report which happened.

---

## Part C — The liner notes page becomes the complete guide

Keep the page's current look, figures, strips, and plate numbering. Expand the content so a judge, a teacher, or a developer can understand the whole project from this one page.

### C1. Structure
A sticky contents list (a plain list of anchor links; collapses to a "Contents" disclosure on phones). Each part opens with two or three plain-language sentences, then a "Details" block for the technical reader. Parts:

1. **Start here: a 60-second walkthrough.** Numbered steps: open the jukebox, press Play, listen for left and right, turn on "what the engine sees", touch the map, try another record. One small screenshot or figure per step.
2. **Tour of the site.** What each page is for: landing, jukebox, Earth Band, this guide.
3. **The sound language.** The table of what instrument, pan, pitch, loudness, and pulse mean. The sound families.
4. **The records.** One row per record: source and SVS link, what the engine reads, what you hear, and whether it is geographic or artistic.
5. **Architecture.** The existing figure plus the module map: which file does what, the two clocks, the workers on the band page, and why the engine is one pure function used in the browser, in Node, and in tests.
6. **Feature engineering.** One subsection per feature, each with: what it is, how it is computed, why it is built that way, and the measured constants with their reasons.
   - Map area and the exact 4× box downscale
   - Brightness (Rec. 709 luma) and the per-cell peak
   - Hue and saturation, and colour classes measured from the clips
   - Context-aware classes (the violet/orange gate on Night Lights)
   - Motion as a rate between frames
   - Flash detection: running average, local maximum, cooldown, the 6-per-beat cap
   - Column profiles and the west-to-east sweep
   - Frame-rate independent smoothing
7. **From features to music.** The beat clock, scales and snapping, voices and the limiter, how each note carries its position to pan, pitch, and ripple.
8. **Explore by touch.** How the probe works playing and paused, hysteresis, the two lightning detectors, keyboard and phone paths.
9. **Earth Band.** Members and roles, and whatever harmony logic actually exists in the code today.
10. **Accessibility.** Every keyboard shortcut in one table, screen-reader behaviour, captions, reduced motion, Pause motion.
11. **What this is and is not.** Sonification of rendered visuals, approximate values, moving-camera records, EONET is not a warning system, the drone is a reference tone.
12. **Testing.** What the automated tests cover, and the listening test and screen-reader pass with their true current status.
13. **Run it yourself.** Install, dev, build, test, the calibration page, the engine_run tool.
14. **Data and credits.** Every NASA source with its link and credit line; fonts; AI assistance disclosure.
15. **Glossary.** Sonification, frame, cell, feature, pan, scale, tonic, hysteresis, and similar terms, one line each.

### C2. Content rules
- **Everything comes from the code and existing docs.** Copy constants from the data files; do not restate them from memory. If a section describes something not built, leave it out.
- Do not invent test results, user quotes, or numbers. Sections 12's status stays exactly as true today.
- Figures keep their title, description, caption, and list equivalent. Add at most three new figures: the walkthrough, the module map, and flash detection.
- Tables scroll inside their own container on phones.
- Heading order is strict (one h1, then h2, then h3). The contents list is a `nav` with a label.
- Pull quotes stay hidden from screen readers as now.
- Link to this guide from the jukebox's Tools area and the landing footer as "How it works".

### C3. Done when
Every part above exists or is explicitly listed as omitted with the reason; the contents links work by keyboard; the page reads in order with a screen reader; screenshots at 1440 and 375 px.

---

## Report when finished

- Per part: what changed, what was cut, and why.
- Part B: the before and after pitch histograms, and whether the switcher was kept or hidden.
- Anything to check by hand on a phone, by ear, and with a screen reader.
