# FINAL_SUBMISSION.md — Final pass before submitting Earth Jukebox

For the coding agent. This is the last pass. Follow it in order and do not add features that are not listed here.
Read `AGENTS.md`, `DESIGN.md`, and the earlier pass documents first; their accessibility rules still apply.

Work on a branch from `feature/polish-3`. One commit per part. `npm test` and `npm run test:clips` must pass before and after every part.

**The one rule above all others: nothing on the site or in the repo may say something that is not true.** Judges can open the site, read the code, and ask questions. Where this document needs a fact only the team knows, it tells you which file to read it from. If that file is missing or a field is blank, leave the statement out. Never fill a gap with an estimate, an example, or a plausible number.

---

## Part 0 — Inputs from the team (read these first)

Two files are written by the team, not by you. Read them; do not edit their facts.

1. `tests/RESULTS.md` — what was tested, with whom, and what happened (template at the end of this document).
2. `docs/TEAM.md` — team name, members, the team's own words on why they built this, and the submission deadline.

If either file is absent, stop and ask for it before doing Parts 3, 4, and 8.

---

## Part 1 — Full recheck of everything

Run the whole site as a stranger would and fix what you find. Record every finding and fix in `docs/QA_LOG.md` (what, where, fixed or not).

- **Every page loads with zero console errors:** landing, jukebox, Earth Band, guide, calibration, the `about.html` redirect.
- **Every record plays** (`play.html?r=0` to `r=9`). For the live record and the event feed, block the network once and confirm a friendly message appears and nothing else breaks.
- **Earth Band:** every pad, every scene, solo, sparse, the member cap, the chord display, record to WAV.
- **Every link and anchor** on every page resolves, including all contents links in the guide.
- **Paths work under a sub-folder.** The site will be served from `https://<user>.github.io/<repo>/`. Build it, serve `dist/` from a sub-path, and confirm that every page, clip, cover, font, and worker loads. Fix the Vite `base` setting and any link starting with `/`.
- **Keyboard only:** walk every control on every page. Escape stops all sound everywhere.
- **Reduced motion, Save-Data, Pause motion:** each behaves as documented.
- **Widths 320, 375, 768, 1440 px:** no sideways scroll, no clipped text.
- **No sound before a user action** on any page.
- **Consistency sweep:**
  - The README names fonts that the site may no longer use. Make the README match what ships.
  - The aerosols record cites SVS 5552 while the challenge lists 5669. State the one actually used, and say why if it is not the listed one.
  - Every NASA clip used anywhere (records, band, covers, backdrops) appears in the credits with its SVS link.
  - "Not an official NASA product" appears on every page.
- **Repo hygiene:** track `AGENTS.md` and the pass documents; remove personal file paths, local IP addresses, and temp folders from committed files; confirm no file exceeds hosting limits; `calibrate.html` stays but is not in the public navigation.

## Part 2 — Earth Band becomes a core feature

- Remove "(beta)" **only if** `tests/RESULTS.md` records that the band was run on a real phone without stutter. Otherwise keep the label.
- **One shared header navigation on every page:** Jukebox, Earth Band, How it works. Same order, same names, current page marked with `aria-current="page"`.
- **Landing page:** a dedicated Earth Band section after the records band: what it is in two sentences, the nine members as covers, and a "Play the band" button. Keep the line that the visualizations cover different years and are played together as an artistic remix.
- **Jukebox:** a clear way into the band from the crate ("Play them together").
- **Band page polish to match the jukebox:** same deck, type hierarchy, transport styling, loading and failure states, and phone layout rules as Part A of the previous pass.
- The band gets its own full part in the guide (Part 3).

## Part 3 — The guide becomes the final, complete walkthrough

Keep the page's look. Restructure and extend it to these parts, in this order. Each part opens in plain words, then a Details block.

1. **Start here.** The 60-second walkthrough, now covering the jukebox **and** the band, with real screenshots.
2. **Why we built this.** The team's motive, taken from `docs/TEAM.md` in their words. Then the problem as the challenge states it: Earth science shown only as pictures leaves out people who cannot see them.
3. **Tour of the site.** Landing, **Jukebox (a full section: stage, transport, now playing, the crate and its three groups, tools, explore by touch, scales)**, Earth Band, this guide. One screenshot each.
4. **The sound language.**
5. **The records.** All ten, with source, what is read, what is heard, geographic or artistic.
6. **Earth Band.** Members and roles, the pads and scenes, how the harmony follows the data, the member cap, and the remix caveat. Describe only what the code does.
7. **Architecture.**
8. **Feature engineering.**
9. **From features to music.**
10. **Explore by touch.**
11. **Accessibility.**
12. **How we got here.** See Part 4.
13. **What we learned from testing.** See the rule below.
14. **What this is and is not.**
15. **Where this goes next.** See Part 5.
16. **Run it yourself.**
17. **Data, inspirations, and credits.**
18. **Glossary.**

**Testing rule (part 13).** Remove every "not done yet" statement from the site and README. Replace it with what `tests/RESULTS.md` records, and only that: the date, who took part (counts, no names unless the file gives permission), what they were asked, the scores, what failed, and what was changed afterwards. Report weak results as plainly as strong ones. If a field in the file is blank, omit that statement. If the whole file is blank, omit part 13 entirely and renumber; do not write a general claim such as "tested with users" in its place. No quotes unless they are in the file.

## Part 4 — "How we got here": the record of iterations

Create `docs/JOURNAL.md` and a shorter version as part 12 of the guide.

- **Build the timeline from `git log`,** with dates and commit references, not from memory. One entry per meaningful step: what changed, why, and what was learned.
- Use this outline of the real sequence as a starting skeleton, and correct or delete anything the git history does not support:
  1. Chose the Earth Information Jukebox challenge; decided the sound must come from the video frames themselves.
  2. Core engine: frame analysis, one sound language, three featured records (lightning, night lights, ocean currents), a ripple for every note.
  3. Explore by touch, working while playing and paused; two lightning detectors.
  4. All nine listed visualizations added; live Earth Today record and event markers.
  5. First design pass: paper sleeve, dark record, liner notes.
  6. Earth Band: several visualizations playing together on one clock; analysis moved to workers.
  7. Harmony and the nine-member band.
  8. Second design pass: NASA frames as covers, moving backdrops, the record-player fix.
  9. Raga-inspired scales found to be inaudible, diagnosed (same notes rotated, no home note), and rebuilt with a reference drone.
  10. Jukebox redesign and the complete guide.
  11. Testing and what changed because of it (from `tests/RESULTS.md` only).
- **Include what did not work.** The inaudible scales, clip sizes that lost data at 480 px, analysis that was too slow on the main thread, effects that were rejected for accessibility. These make the record credible.
- **Inspirations,** stated as inspirations and not affiliations: NASA's own data sonification work (the Caldwell 73 example in the challenge resources); the pad-grid style of loop apps such as Groovepad for the band; record sleeves and the jukebox itself for the visual idea; the Braille Institute's Atkinson Hyperlegible typeface; the tanpura drone of Hindustani music for the scales.
- **AI assistance:** state plainly how AI coding and planning tools were used, as the event rules require. Keep the existing disclosure and make it specific.

## Part 5 — "Where this goes next": the vision

Part 15 of the guide and a section of the README. Every item is clearly labelled as future work, never as something that exists.

- Sound from the underlying data, not only from the rendered pictures.
- Any EIC visualization dropped in and played, with a mapping editor.
- A kiosk mode for the Earth Information Center's display walls.
- Co-design and review with blind and low-vision listeners, and review of the scales by trained Hindustani musicians.
- More languages for the interface, notes, and captions.
- Classroom use: lesson cards and a "guess by ear" game.
- Haptics beyond phone vibration; a reusable open engine others can build on.
- Live data as a first-class record, with honest handling of delays.

## Part 6 — Final polish

- One shared header and footer across all pages; identical type scale and spacing tokens.
- Page titles, descriptions, a social preview image, and the favicon are set on every page.
- First paint of the landing page is fast: Tone.js and clips load only when needed; check total transfer on first load.
- Every image has correct alt text; decorative ones are empty-alt or hidden.
- Final before and after screenshots of every page at 1440 and 375 px go in `docs/screenshots/` (these also serve the project page).

## Part 7 — Records to keep in the repo

| File | Contents |
|---|---|
| `README.md` | Live link and one screenshot at the top; what it is; how to use it; records; band; accessibility; testing results; how it works (short, linking to the guide); run it; credits; AI disclosure; what's next |
| `CHANGELOG.md` | Dated list of changes, from git |
| `docs/JOURNAL.md` | The iteration record from Part 4 |
| `docs/QA_LOG.md` | Findings and fixes from Part 1 |
| `docs/DECISIONS.md` | Each major decision with its reason and what was rejected |
| `docs/screenshots/` | Final screenshots |
| `tests/RESULTS.md` | Team-written test record |
| `SUBMISSION.md` | Part 8 |

## Part 8 — Submission pack

Write `SUBMISSION.md` with ready-to-paste text for the Space Apps project page. Check the field names against the live form and adjust.

- **High-level summary** (about 3 sentences).
- **Project demo link** and **final project link** (live site and repo).
- **Detailed description:** the problem, what it does, how picture becomes sound, the band, accessibility, what was tested (from `tests/RESULTS.md` only), limits, and what's next.
- **NASA data and resources used:** every item with its link.
- **Other references:** libraries, fonts, inspirations.
- **Use of AI:** the specific disclosure.
- **Demo video shot list (30 seconds):** sound over black; footage fades in with ripples; two seconds of "what the engine sees"; a finger or arrow keys exploring; the band building up pad by pad; one true closing line.

## Part 9 — Ship

1. Merge the stacked branches into `main` in order: earth-band, design-pass-2, polish-3, this branch. Resolve conflicts in favour of the newest.
2. Push. Enable GitHub Pages if it is not enabled. Wait for the deploy.
3. **Smoke-test the live URL,** not localhost: every page, three records, one band scene, on desktop and at phone width. Record the result in `docs/QA_LOG.md`.
4. Tag the release `v1.0-submission`.
5. Report: the live URL, what shipped, anything that failed the smoke test, and anything left for a person to do by hand.

If the deadline in `docs/TEAM.md` is less than three hours away when you start, do Parts 1, 2 (navigation and labels only), 8, and 9, and list the rest as not done.

---

## Template: tests/RESULTS.md (the team fills this in)

```
# Test results

Date(s):
Where and how (in person / remote, devices, headphones):
Build tested (commit or branch):

## Participants
Total number:
How many are blind or have low vision:
How many use a screen reader daily:
Permission to quote or name anyone: yes / no

## Listening test
Questions asked (exactly as asked):
1.
2.
3.
Correct answers per question (e.g. 12 of 15):
1.
2.
3.
What people found confusing:

## Screen-reader pass
Screen reader and browser:
Who ran it:
What worked:
What failed:
What was fixed afterwards, and was it re-tested:

## Visual and phone checks
Phones tested (models):
Earth Band on a phone: smooth / stuttered (members on, minutes run):
Problems found:

## Changes made because of testing
-

## Quotes (only with permission)
-
```

## Template: docs/TEAM.md (the team fills this in)

```
Project name:
Team name:
Members and roles:
Local event:
Submission deadline (date, time, time zone):
Why we built this (3–5 sentences, in our own words):
```
