# DESIGN_PASS_2.md — Art direction, NASA footage as backdrop, and the record-player fix

For the coding agent. Read `AGENTS.md` and `DESIGN.md` first; their accessibility and honesty rules win.
This is a visual pass only. Do not change the engine, audio mapping, probe, keyboard shortcuts, record data files, or tests. `npm test` must pass before and after.

Problem to solve: only the landing hero looks finished. The rest of the site reads as flat and bland. Fix that by making NASA's own imagery the artwork everywhere, and fix the record-player animation on the jukebox.

Work in the order of section 8. Each step is shippable; stop at any step boundary if time runs out.

---

## 1. Art direction: "printed sleeve, live record"

One idea carries the whole site: **NASA footage is treated like print on the paper pages and like light on the dark pages.**

- **On paper surfaces (landing, liner notes):** footage looks printed. Convert it to a duotone of ink on paper so it sits inside the page like a photograph on a record sleeve, never like a video player dropped onto a web page.
- **On dark surfaces (jukebox, band, dark bands on the landing page):** footage is shown in full colour and glows into its surroundings.

Draw on these traditions as principles only. Do not copy any specific artwork, cover, or layout:

- **Mid-century jazz record sleeves:** one strong photograph in two inks, large confident type, big flat areas of colour, asymmetry.
- **Swiss typographic posters:** a strict grid, generous margins, type as the main graphic element.
- **Scientific atlases and technical manuals:** numbered plates, thin rules, small mono captions, figure labels.

Do not use the NASA insignia, "meatball", or "worm" logotype anywhere. Credit NASA in text only.

### 1.1 Texture (cheap, no images)
- **Paper grain:** one fixed, full-page overlay using an inline SVG `feTurbulence` noise filter at 4–6% opacity, `pointer-events: none`, `aria-hidden`.
- **Vinyl grooves:** `repeating-radial-gradient` on discs and on the jukebox deck.
- **Print registration details:** thin rules, plate numbers ("Plate 03"), and crop-mark corners on framed footage. Decorative marks are `aria-hidden`.

### 1.2 Colour
Keep the tokens in `DESIGN.md`. Add one rule: each record owns one ink colour (its main voice colour from `AGENTS.md`), used for its cover duotone, its ripples, its section accent, and its ambient glow. Colour then tells you which record you are in, everywhere.

## 2. Record covers made from NASA frames

Replace the generative-pattern covers as the main artwork (patterns may stay as a subtle overlay).

- For each record, export one striking still from its own clip with ffmpeg and crop it square.
- Render it as a duotone: grayscale image, then the record's ink colour applied with `mix-blend-mode: multiply` (paper) or `screen` (dark).
- Over it: a large record number, the title in the display face, and a mono caption line with the SVS number. Asymmetric placement, different per record, on a shared grid.
- The same cover is used on the landing page band, the jukebox shelf, and the band pads, so the system reads as one set of sleeves.

```
ffmpeg -ss <t> -i public/clips/<clip>.mp4 -frames:v 1 -vf "crop=ih:ih,scale=800:800" public/covers/<id>.jpg
```

Each cover image needs alt text describing what the frame shows.

## 3. Moving NASA backdrops

### 3.1 Where
| Place | Backdrop | Treatment |
|---|---|---|
| Landing: "the problem" section | DYAMOND CO2 or Perpetual Ocean 2 | Printed duotone, framed as a plate that bleeds off one edge |
| Landing: "Three records" dark band | The clip of the record being hovered or focused | Full colour, dim, behind the covers; crossfades when focus changes |
| Landing: "Touch it" section | Ocean currents | Printed duotone, slow |
| Landing: footer | Night lights | Full colour, very dim |
| Liner notes: page header and section dividers | Aerosols or atmospheric river | Printed duotone strips, about 30vh |
| Jukebox | **No extra video.** See 3.5 | Ambient glow from the playing clip |
| Band page | No extra video; the member strips are the visuals | — |

Use only visualization clips already in the repo. Do not use NASA's produced, narrated videos.

### 3.2 Making the loops
8–12 seconds, 720p at most, 24 fps, no audio, heavily compressed. Pick stretches whose first and last frames are similar.

```
ffmpeg -ss <t> -t 10 -i <source>.mp4 -vf "scale=1280:-2,fps=24" -c:v libx264 -pix_fmt yuv420p -crf 30 -an -movflags +faststart public/bg/<name>.mp4
ffmpeg -ss <t> -i <source>.mp4 -frames:v 1 -vf "scale=1280:-2" public/bg/<name>.jpg
```

Budget: each loop under 1.5 MB, all backdrops under 10 MB total.

### 3.3 Blending
- **No hard rectangle edges.** Fade each backdrop into the page with `mask-image: linear-gradient(...)` on the edges that meet the page.
- **Printed look on paper:** `filter: grayscale(1) contrast(1.1)` on the video, inside a wrapper whose background is the ink colour, with `mix-blend-mode: multiply` against the paper.
- **Loop seam:** crossfade the last 0.6 s into the start using two stacked copies of the video, or choose a stretch that loops cleanly. No visible jump.
- **Enter and exit:** opacity and a small scale (1.04 to 1.0) tied to scroll progress, so backdrops arrive with the section's own reveal and leave with it. Use the same easing and duration tokens as the existing text reveals so everything moves as one.
- **Section handoff:** when one backdrop leaves and the next enters, they crossfade; never show two at full strength.

### 3.4 Text over footage
- Text never sits directly on moving footage. Put it on a solid paper or solid dark panel, or on a scrim that guarantees WCAG AA contrast against the **brightest and darkest** frames of the loop. Check both.
- Body text stays 18 px or larger.

### 3.5 Jukebox ambient glow (no second video)
The jukebox already runs video, analysis, and audio. Do not add another decode.

- Reuse the colours the engine already computes: take the mean colour of the left, centre, and right thirds of the current analysis grid and paint them as three large, heavily blurred radial gradients behind the stage.
- Update at most 4 times a second and ease between values so it drifts, never flickers.
- When a record is chosen, the glow and the deck's accent crossfade to that record's ink colour over about 600 ms.
- Read the values the engine already exposes. Do not change the engine.

### 3.6 Triggers that tie it together
- **Record hover or focus (landing band, shelf):** that record's backdrop fades in and its cover lifts slightly.
- **Play:** the ripple layer and logo pulse already mark the beat. Add one more: the ambient glow breathes by a few percent in brightness on each bar line.
- **Scroll:** backdrops and reveals share one timeline per section.
- **Record change:** ink colour, glow, and cover change together in one crossfade.

No trigger may move focus, block scrolling, or start sound.

### 3.7 Motion safety and performance
- A visible **"Pause motion"** button on every page with a backdrop. It stops all backdrop videos and holds their poster frames. Remember the choice for the session in a variable.
- `prefers-reduced-motion` or Save-Data: show poster images only; no backdrop video is loaded.
- Every backdrop video is `muted`, `playsinline`, `loop`, `preload="none"`, has a `poster`, is `aria-hidden="true"`, and is not focusable.
- Load and play a backdrop only when it is near the viewport (IntersectionObserver). **At most one backdrop video playing at a time.** Pause the rest.
- While the landing hero is playing with sound, pause all other backdrops.
- No WebGL.

## 4. Fix: the record must slide out of the sleeve's edge

**Bug:** on the jukebox, the disc appears to come out of the centre of the square cover and is visible through it.

**Correct behaviour:** the disc lives *behind* an opaque sleeve and slides out sideways through the sleeve's open edge, like pulling a record out of its cover. While idle it is completely hidden.

Structure:

```html
<div class="sleeve">
  <div class="disc-track">            <!-- moves left/right only -->
    <div class="disc"></div>          <!-- spins only -->
  </div>
  <div class="cover">…</div>          <!-- opaque, on top -->
</div>
```

```css
.sleeve      { position: relative; aspect-ratio: 1; isolation: isolate; }
.cover       { position: relative; z-index: 2; inset: 0; height: 100%;
               background-color: var(--sleeve-bg); /* fully opaque, no transparency */ }
.disc-track  { position: absolute; z-index: 1; top: 4%; left: 4%;
               width: 92%; height: 92%;
               transform: translateX(0);
               transition: transform 500ms cubic-bezier(.2,.7,.2,1); }
.sleeve.is-selected .disc-track { transform: translateX(46%); }
.disc        { width: 100%; height: 100%; border-radius: 50%; }
.sleeve.is-playing .disc { animation: spin 4s linear infinite; }
```

Rules:
- The disc is slightly smaller than the cover (92%) and vertically centred, so nothing shows at rest.
- The cover has a solid background behind its image. No opacity, no blend mode that lets the disc show through.
- **Slide and spin are on different elements.** The wrapper translates; the inner disc rotates. Never animate both on one element, and never use `scale` to reveal the disc.
- No `overflow: hidden` on `.sleeve` (it would cut the disc off as it leaves). Give the shelf enough gap, or right padding, for the disc to peek out about 46% without covering the next sleeve; raise the selected sleeve's `z-index` if they touch.
- Add a thin inner shadow along the cover's open edge so the opening reads as a slot.
- Disc artwork: groove rings by `repeating-radial-gradient`, a centre label in the record's ink colour, a small spindle hole.
- On narrow phones, if there is no horizontal room, slide the disc **upward** out of the top edge instead, with the same structure.
- Reduced motion: no slide and no spin. The selected sleeve simply shows the disc already peeking out.
- The disc is decorative: `aria-hidden="true"`. The selected and playing states are already announced by the existing controls; do not add announcements.

Check: at rest no part of the disc is visible; on select it emerges from the edge only; nothing is ever visible through the cover.

## 5. Page-by-page

**Landing.** Keep the hero. Below it, every section gets one of: a framed NASA plate, a backdrop, or a row of covers. No section is text on plain paper alone. Add plate numbers and mono captions to framed footage. Use the covers from section 2 in the dark band.

**Jukebox.** Disc fix (section 4), frame-based covers, ambient glow (3.5), groove texture on the deck, ink colour per record. Controls and layout are otherwise unchanged.

**Liner notes.** A duotone footage strip as the page header and between major parts. Figures get plate numbers and thin frames. Pull one sentence per part out as a large quote in the display face.

**Band.** Pads use the covers as their faces (dimmed when off, full ink colour when on). Same deck texture and glow rule as the jukebox, driven by the members that are on.

## 6. Hard constraints

- No behaviour changes to the engine, audio, probe, shortcuts, or record data. Tests pass before and after.
- Keyboard order, focus visibility, and all accessible names stay as they are.
- AA contrast everywhere; body text 18 px or larger.
- No sound before a user action.
- Keep "Not an official NASA product" and the NASA credits. Add a credit line for every clip newly used as a backdrop or cover.
- No new claims about testing or features.
- Any new dependency needs a one-line reason. Prefer none: everything here is CSS, canvas, and video.

## 7. Report when done

- Before and after screenshots of each page at 1440 px and 375 px.
- Total added bytes (loops, posters, covers).
- Confirmation of: one backdrop playing at a time, Pause motion works, reduced-motion shows stills, the disc is hidden at rest.
- Anything not done, and what to check by hand on a phone and with a screen reader.

## 8. Order of work

1. **Disc fix** (section 4).
2. **Covers from NASA frames** (section 2), used on the shelf and the landing band.
3. **Jukebox ambient glow and deck texture** (3.5, 1.1).
4. **Landing backdrops**, with Pause motion and all safety rules (section 3).
5. **Liner notes strips and plates.**
6. **Band page pads and paper grain.**

Commit after each step.
