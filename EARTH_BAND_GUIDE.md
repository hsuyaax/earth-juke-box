# EARTH_BAND_GUIDE.md — Full band, harmony, and all nine NASA visualizations

Extends the Earth Band on `feature/earth-band` (commit b26dcc1). Read `AGENTS.md` first; its rules win.
This guide turns the three-piece band into a nine-member ensemble that follows music theory while the data stays in charge.

---

## 1. The principle

**Data decides when, where, how much, and which harmonic direction. Music theory decides which exact notes are allowed.**

- No member plays a note unless a feature from its own video frames caused it.
- Theory is a filter and a guide, never a source of notes. There are no backing loops.
- Same frames in, same music out. The chord engine and every mapping are deterministic.
- The page must say this in plain words, and keep the line that the visualizations cover different years and are played together as an artistic remix.

## 2. The ensemble

Nine members, one per visualization NASA listed for the challenge. (The other two listed resources are the EIC gallery, which is the source of all clips, and the Caldwell 73 sonification, which is a concept reference.)

| # | Visualization | SVS | Role | Instrument (Tone.js) | Driven by |
|---|---|---|---|---|---|
| 1 | Lightning from the ISS | 5011 | Drum kit | Kick: `MembraneSynth`. Snare: `NoiseSynth` + bandpass. Hat: `NoiseSynth` + highpass, very short | Flash events |
| 2 | Sea Surface Currents and Temperature | 3912 | Bass | `MonoSynth`, saw or square, lowpass | Motion, warm share |
| 3 | Night Lights | 5313 | Lead melody | `PluckSynth` or triangle `Synth` | Sweep of lit cells |
| 4 | DYAMOND CO2 | 5196 | Harmony pad | `PolySynth`, sine/triangle, slow attack | Overall density |
| 5 | GEOS Aerosols | as in repo | Shaker and atmosphere | Existing dust, smoke, sea-salt noise voices | Class densities |
| 6 | Perpetual Ocean 2 | 5425 | Arpeggio | `FMSynth` bell, short | Motion, brightness |
| 7 | GEDI Forest Height | 4950 | Marimba | Sine `Synth` with fast decay plus a short FM click | Strongest color, brightness |
| 8 | Atmospheric River | 4960 | Strings | `PolySynth` saw + lowpass + chorus, slow attack, portamento | Moisture density, hue |
| 9 | Air Quality Model Runs | 5533 | Drone | Two sustained oscillators (root and fifth) through a filter with tremolo | Pollution intensity |

All sound is synthesized. No audio samples, so no new assets or licenses.

**Positional vs global members.** Members 1, 2, 3, and 5 use flat maps, so they keep the AGENTS.md sound language: pan from left-right position. Members 4, 6, 7, 8, and 9 have moving cameras, so they use whole-frame features only (density, hue, motion) and sit at fixed pan positions. Label them on the page as "artistic, not geographic."

## 3. The musical system

### 3.1 Key, time, tempo
- Key: **A natural minor** (A B C D E F G). Melodic instruments are limited to **A minor pentatonic** (A C D E G), which is a subset and is consonant over every chord below.
- Time: 4/4. Grid: 16th notes. Tempo: 96 bpm.
- Phrase: 4 bars. Every decision about harmony happens on a bar line.

### 3.2 Chords
All chords are diatonic to A natural minor, so nothing can clash with the scale.

| Numeral | Chord | Notes | Diatonic 7th | 9th allowed |
|---|---|---|---|---|
| i | A minor | A C E | G | B, yes |
| III | C major | C E G | B | D, yes |
| iv | D minor | D F A | C | E, yes |
| v | E minor | E G B | D | **No** (F# is outside the key) |
| VI | F major | F A C | E | G, yes |
| VII | G major | G B D | F | A, yes |

### 3.3 The harmony conductor (data chooses the chords)
Compute **tension T** (0 to 1) once per bar: the smoothed average of how active the *currently switched-on* members are, each normalized to its own measured quiet-to-busy range (flash rate for lightning, mean motion for currents, and so on). Members that are off do not count.

Each 4-bar phrase:

| Bar | T below 0.33 | T 0.33 to 0.66 | T above 0.66 |
|---|---|---|---|
| 1 | i | i | i |
| 2 | VI | III | iv |
| 3 | III | VII | v |
| 4 | VII if T < 0.5, otherwise v | | |

Bar 1 is always home (i). Bar 4 always leads back to it (VII to i or v to i). A calm planet gives Am–F–C–G; a busy one gives Am–Dm–Em–Em. Every combination is a valid progression.

Normalization ranges must be **measured** with `tools/engine_run.mjs` on the band clips and written next to the numbers, as in the rest of the repo.

### 3.4 Registers (so parts do not blur)

| Member | Range (MIDI) | Notes |
|---|---|---|
| Kick | tuned to A1 (33) | Unpitched feel, tuned to the key root |
| Bass | 28–52 (E1–E3) | The only pitched part below 110 Hz |
| Drone | 45 and 52 (A2, E3) | Root and fifth only |
| Pad | 45–64 (A2–E4) | |
| Strings | 52–69 (E3–A4) | |
| Marimba | 57–69 (A3–A4) | Off-beats only |
| Lead | 60–76 (C4–E5) | |
| Arpeggio | 76–88 (E5–E6) | |

High-pass every part except bass and kick at about 150 Hz. Low-pass the pad at 2–4 kHz.

### 3.5 Voice leading (pad and strings)
When the chord changes, choose the inversion closest to the previous voicing: for each new chord tone, pick the octave nearest the previous voicing's notes, keep common tones in place, and stay inside the member's range. Total movement should be as small as possible. No parallel jumps of the whole chord.

### 3.6 Melody rules (lead and marimba)
- Notes come from A minor pentatonic only.
- **Strong beats (1 and 3): snap to the nearest chord tone** of the current chord that is also in the pentatonic. If none is within 2 scale steps, keep the pentatonic note.
- Weak beats: any pentatonic note (these act as passing tones).
- Largest leap between consecutive notes: one octave. Fold larger leaps back by an octave.
- **Breathing space:** the lead rests on beat 4 of every fourth bar. Skipping a note is allowed; inventing one is not.
- Pitch height still comes from the data (up-down position for the lead), mapped onto the member's range before snapping.

### 3.7 Bass rules
- Beat 1 of every bar: the chord root. Always.
- Other notes: root, third, or fifth of the current chord, chosen by the warm share (scaled to its measured 35.7–40.0% range).
- Busyness from motion: low = one or two long notes per bar; medium = root on 1, fifth on 3; high = eighth notes with the octave on off-beats.
- Approach note: when motion is high, the last eighth before a chord change may be the scale step leading into the next root.

### 3.8 Drum kit rules
- Quantize each flash to the nearest 16th slot. A slot with no flash is silent.
- Slot on beat 1 or 3: **kick**. Slot on beat 2 or 4: **snare**. Any other slot: **hat**.
- One hit per voice per slot. Velocity from flash power.
- Kick is always centered. Snare and hat pan from the flash's left-right position.
- Sparse mode keeps the 2 strongest hits per beat (as now).

### 3.9 The other members
- **Pad (CO2):** holds the current chord, re-voiced on each chord change. Density below 0.33 = triad; 0.33–0.66 = add the 7th; above 0.66 = add the 9th where the table allows it. Density also opens the filter.
- **Shaker and atmosphere (aerosols):** dust = shaker on 16ths with velocity from dust density; sea salt = hiss on off-beats; smoke = slow low swell.
- **Arpeggio (Perpetual Ocean 2):** chord tones only, up-then-down pattern. Motion picks the rate (eighths when calm, 16ths when busy). Brightness picks the span (one or two octaves).
- **Marimba (forest height):** plays on the off-beat eighths only, so it never collides with the lead. Strongest color sets the pitch height; brightness sets the velocity.
- **Strings (atmospheric river):** one long note per bar, changing only on bar lines with a glide. Moisture density sets the swell; hue selects which chord tone is on top.
- **Drone (air quality):** A and E held continuously. Pollution intensity opens the filter and speeds the tremolo. It never changes pitch, which anchors the key.

### 3.10 Mix
- One master chain with the limiter. One gain per member.
- Starting levels (dB): kick −6, snare −10, hat −16, bass −8, lead −10, pad −16, arpeggio −16, marimba −14, strings −16, drone −20, shaker −18.
- One shared reverb send (decay about 2.5 s, low wet level). Bass and kick send nothing; drums send little.
- Fixed pan for global members: pad center, drone center, strings −0.3, marimba +0.3, arpeggio ±0.5 alternating.
- Voice cap: about 24 simultaneous voices overall; drop the quietest new note when over.

## 4. Performance

Nine videos cannot decode at once on a phone.

- A member's video loads and plays **only while its pad is on**. Off means paused and its worker idle.
- **At most 4 members on at once** on phones. On desktop, allow more only if measured frame rates hold (target: 12+ analyses per second per member, no late beats).
- Turning on a member past the cap is refused with a short message naming the cap.
- Band clips are made per member at the smallest size where the engine's output matches the full clip (flash rate, class shares, or mean features within 10%). The last build found 480, 640, and 960 px for the first three; measure the other six the same way. Total budget: under 20 MB, lazy-loaded.
- Keep the existing slow-down behavior: skip frames, never let the beat slip.

## 5. Screen

- **3×3 pad grid, one pad per member.** Tap = on/off. Hold = solo. Each pad shows the role and visualization name, glows with live activity, and pulses on the beat while sounding.
- A **Sparse** toggle applies to the focused or last-touched pad.
- Video strips appear only for members that are on (up to 4), each with its own ripple layer.
- A **chord display** shows the current chord name and the tension level, so people can see the harmony follow the planet.
- Three **scene buttons** for quick starts:
  - Storm: drums, bass, shaker, strings.
  - City night: lead, pad, bass, drone.
  - Ocean: bass, arpeggio, marimba, pad.
- Start state: bass only.
- Accessibility as in the current band: real toggle buttons with names like "Marimba, forest height, on", arrow keys in the grid, Escape stops everything, throttled announcements (including chord changes at most once per bar), reduced-motion support, no sound before Play.

## 6. Tests to add

Pure-function tests for a new `src/band/theory.js`, runnable in `npm test`:

- Every lead and marimba note is in A minor pentatonic.
- Every strong-beat lead note is a chord tone when one is within 2 scale steps.
- The bass plays the chord root on beat 1 of every bar.
- Every voicing stays inside its member's range, and consecutive voicings move less than a fixed total.
- Bar 1 of each phrase is i; bar 4 is VII or v; the v chord never gets a 9th.
- A member that is off produces zero notes.
- Same feature input twice gives identical note output.

## 7. Build order and cut lines

Each phase must sound good and pass tests before the next starts. Stop at any phase boundary when time runs out; every phase is shippable.

1. **Theory core and the first four members.** `theory.js`, the harmony conductor, the drum-kit split, bass on chord roots, lead with chord-tone targeting, and the CO2 pad. This phase alone delivers melody, harmony, bass, and drums.
2. **Three more members.** Shaker and atmosphere, arpeggio, marimba. Add the 3×3 grid and the 4-member cap.
3. **Last two members and polish.** Strings, drone, scene buttons, chord display, mix balance.
4. **Phone test, then link.** Add the "Earth Band (beta)" link from the jukebox only if a real mid-range phone runs four members for two minutes without stutter.

After each phase, report: what works, measured frame rates, clip sizes and why, anything cut, and what to check by ear and by hand.

## 8. Constraints carried over

- Own branch, own page. Do not change the jukebox, the engine's behavior, existing record data files, or existing tests.
- Do not edit existing records' `onBeat` functions; band mappings live in `src/band/`.
- No WebGL. Match the dark "record" surface in `DESIGN.md`.
- NASA credits and "Not an official NASA product" on the page.
- No claims in the UI or README that are not true of the running app.
