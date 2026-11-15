# Changelog

Every change, from `git log`, newest first. Times are local (the hackathon ran Sat 14 – Sun 15 Nov 2026). The site deployed to GitHub Pages is built from `main`.

## Sun 15 Nov 2026

### Final submission pass (`FINAL_SUBMISSION.md`)
- Final polish: social preview image and tags on every page; three untrue lines about Earth Band and the guide corrected; before and after screenshots in `docs/screenshots/` (`3e0d05e`, part 6).
- Records: restructured README (live link, how to use it, Earth Band, testing status, use of AI), this changelog, `docs/DECISIONS.md`, a true status table in `AGENTS.md`, every clip credited in the shared footer (part 7).
- Where this goes next: future work in the guide and README, each item labelled as not built (`198e224`, part 5).
- Earth Band as a core feature: one navigation on every page (Jukebox, Earth Band, How it works) with the current page marked; an Earth Band section on the landing page; "Play them together" in the jukebox crate; the band page in the same order as the jukebox (`f441193`, part 2).
- Final recheck: `docs/QA_LOG.md` with findings and the record of mistakes; every clip credited on the jukebox; the calibration page no longer loads the audio engine; the `about.html` redirect fixed; the project's own documents tracked (`82c4ac4`, part 1).

### Polish pass 3 (`POLISH_PASS_3.md`)
- The liner notes become the complete guide: 15 parts with step-by-step screenshots (`772b319`).
- Scales inspired by ragas you can hear: Bhupali, Yaman, Bhairav, Malkauns, each with a shared tonic, strong notes and a reference drone; changes land on the bar line (`01e7292`).
- Jukebox redesign: a turntable in three zones (`08a1655`).

### Design pass 2 (`DESIGN_PASS_2.md`)
- Band pads wear the NASA covers; band glow; paper grain (`77fbcfb`).
- Liner notes: printed footage strips, plates, pull quotes (`3221e7d`).
- Landing: moving NASA backdrops, printed plates, a Pause motion button (`e528a59`).
- Jukebox: ambient glow taken from the picture, ink accent, groove texture (`3253b23`).
- Covers made from NASA frames (`6b61937`).
- Jukebox: the record slides out of the sleeve's edge (`3afecce`).

### Earth Band (`EARTH_BAND_GUIDE.md`)
- Phase 3: strings, drone, scenes, voice cap (`b895fb1`).
- Phase 2: shaker, arpeggio, marimba; one pad per member; the member cap (`30e2285`).
- Phase 1: harmony, drum kit, chord-root bass, chord-targeting lead, CO2 pad (`824a88c`).
- Earth Band (beta): three records as one band on `band.html`; analysis in Web Workers (`b26dcc1`, deployed).

### Fixes
- Sea Surface Currents: the two held pads softened (the unwanted noise) (`8135567`).
- B-side crash fixed; the Scale control made audible (`6573a1f`).

## Sat 14 Nov 2026

### Design
- Legibility: labels 16 px, prose 18 px, figures never scaled below 16 px (`6537a59`).
- Landing hero: a visible Pause picture control for the silent preview (`3a11136`).
- Logo and favicon (`7be209f`).
- Liner notes page, `notes.html` (`b390c70`).
- Jukebox reskin: vinyl surface, record sleeves (`9f70574`).
- Landing page, the sleeve: live lightning hero and scroll story (`977020d`).

### Engine and clips
- Internal documents removed from tracking (`964dde0`; tracked again in part 1 of the final pass).
- `AGENTS.md` status, file map, asset notes, checklist (`f1bf7c5`).
- Core engine rework: one pure engine for browser and Node, exact box downscale, frame-driven, frame-rate independent (`2cd8dfc`).
- Engine self-check; late load events guarded on fast record switches (`24529b6`).
- Full-length clips for all records; idle-cost optimizations (`ed7779c`).
- Full-length lightning (100 s) and currents (67 s); lightning rescaled to measured rates (`9a778dc`).
- Screen-reader and listening test scripts (`29932a9`).

### First build
- Each record's audio nodes freed on switch (`746a21e`).
- Deploy setup: relative asset paths, GitHub Pages workflow (`b8623b5`).
- README: the only outside requests (EONET, GIBS) (`da405f2`).
- P2: aerosols, five B-sides, Earth Today (GIBS), EONET alerts, raga presets, WAV export, vibration; project page (`fc48739`).
- Earth Jukebox: P0 core and P1 explore probe, legend, captions, polish (`88eb14c`).
