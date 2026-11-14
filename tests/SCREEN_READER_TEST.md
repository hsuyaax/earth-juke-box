# Screen-reader test (NVDA, Windows) — AGENTS.md §12

Setup: install NVDA from nvaccess.org. Start it (Ctrl+Alt+N). Open Chrome at the jukebox (`npm run dev`, then the URL it prints). Wear headphones. Insert = NVDA key. Stop speech: Ctrl.

Mark each step Pass / Fail and write exactly what NVDA said when it failed.

| # | Do this | Expected | Result | What NVDA said / notes |
|---|---|---|---|---|
| 1 | Load the page, press H repeatedly | Hears headings: Earth Jukebox, Records, (record title), Explore by touch, Live: natural events | | |
| 2 | Tab from the top | "Skip to controls" link first; then the map ("Map. Explore by touch, application") | | |
| 3 | Tab to Play, press Enter | Music starts; hears "Playing Lightning from the ISS" | | |
| 4 | Press Space anywhere (not in a text field) | Pauses / resumes; hears "Paused." / "Playing …" | | |
| 5 | Press 2, then 1 | Hears "Night Lights 2012–2023 selected", then lightning | | |
| 6 | Tab to the map; arrow keys | NVDA lets arrows through (no "blank" or reading mode). The probe moves; sound follows; class changes are spoken (e.g. "lightning, faint") | | |
| 7 | On the map, press D | Hears a description, e.g. "lightning, medium, middle center." | | |
| 8 | Shift+Arrow | Moves 5 cells | | |
| 9 | Tab to "Learn the sounds", Enter | Each sound plays and its label is read | | |
| 10 | Play for 30 s, do nothing | Captions read at most every few seconds, not constantly | | |
| 11 | Tab to Position slider, arrows | Hears time as "0:12 / 0:40"; sound changes at once | | |
| 12 | Tab to Volume, arrows | Volume changes; value read out | | |
| 13 | Press Escape | Sound stops; hears "Stopped all sound." | | |
| 14 | Tab to the arrow buttons under "Explore by touch" | Each named ("Move left" …); pressing moves the probe | | |
| 15 | Press 0 (Earth Today), Play, arrows onto a red diamond | Hears the event name ("severe storm: …") | | |
| 16 | Overall: was any spoken update too chatty or missing? | | | |

Phone (after deploy): repeat 3, 6 (using the on-screen arrow buttons), 7, 9 with Android TalkBack.

Report the result in README "Testing status" and notes.html "How it was measured" exactly as it happened.
