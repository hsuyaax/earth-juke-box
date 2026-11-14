# Listening test — AGENTS.md §3 Impact, §13 honesty

Goal: can people understand the picture by ear? Use stereo headphones. 3–5 people who have not seen the app. Never invent or round up results.

## Before you start
- Volume at a comfortable level (start at 50%). Record anything that is too loud or harsh.
- Do not show the screen to the listener (turn it away or blindfold).

## Tasks (operator runs the app, listener answers)

| # | Record | Operator does | Ask the listener | Correct answer |
|---|---|---|---|---|
| 1 | Lightning | Play 20 s | "Are storms more on the left, middle, or right?" | Compare with the caption / map |
| 2 | Lightning | Scrub to a quiet stretch, then a busy one | "Which part was busier?" | The busy one |
| 3 | Night Lights | Play the change-map section | "How many different instruments do you hear?" | Two plucks |
| 4 | Currents | Play 20 s | "Does it sound warmer near the middle or the top/bottom?" | Middle (tropics) |
| 5 | Aerosols | Play 20 s | "Name the sounds you hear" (after Learn the sounds) | Dust, smoke, sea salt |
| 6 | Any | Listener uses arrow keys on the map for 1 minute, eyes closed | "Find a storm / city lights / warm water and press D" | D confirms |
| 7 | Any | — | "Was anything too loud, annoying, or confusing?" | Free answer |

## Results

| Listener (no names) | Uses a screen reader? | 1 | 2 | 3 | 4 | 5 | 6 | Comments (quote exactly) |
|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | |
| P2 | | | | | | | | |
| P3 | | | | | | | | |

Summary to publish (fill only from the table): "N people, X of N correctly … ". Put it in README "Testing status" and notes.html "How it was measured".

## Tuning notes for the team
- Too loud/quiet layer → change its `volume` in `src/audio.js` FAMILY, or its drone level in the record's `onBeat`.
- Night-lights plain city lights playing the "less light" pluck → narrow the `orange` hue range in `src/records/nightlights.js` (use calibrate.html first).
- Lightning too busy/too sparse → `flash.jump` in `src/records/lightning.js` (measured: 0.10 ≈ 1 flash per tick).
