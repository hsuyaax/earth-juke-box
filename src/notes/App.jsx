import { useEffect, useState } from "react";
import { Line, Header, Closing } from "../shared/Chrome.jsx";
import { Fig1, Fig2, Fig3, Fig4 } from "./Figures.jsx";
import { Backdrop } from "../shared/Backdrop.jsx";
import { INK } from "../covers.js";

/* The complete guide (POLISH_PASS_3 part C). Every number here is copied from the code (src/records/*.data.js,
   src/analysis.js, src/explore.js, src/audio.js, src/ragas.js, src/band/*). Nothing is described that is not built. */

const Strip = ({ name, plate, children }) => (
  <figure className="strip-plate">
    <Backdrop name={name} mode="print" ink={INK[name]} rate={0.7} className="bd-fill" />
    <figcaption className="plate-cap"><span className="mono">Plate {plate}</span> {children}</figcaption>
  </figure>
);

const PARTS = [
  ["01", "Start here: a 60-second walkthrough", "start"], ["02", "Tour of the site", "tour"], ["03", "The sound language", "language"],
  ["04", "The records", "records"], ["05", "Architecture", "architecture"], ["06", "Feature engineering", "features"],
  ["07", "From features to music", "music"], ["08", "Explore by touch", "touch"], ["09", "Earth Band", "band"],
  ["10", "Accessibility", "access"], ["11", "What this is and is not", "limits"], ["12", "Testing", "testing"], ["13", "Where this goes next", "next"],
  ["14", "Run it yourself", "run"], ["15", "Data and credits", "credits"], ["16", "Glossary", "glossary"],
];

// A part: plain-language opening, then (optionally) a Details block for the technical reader.
const Part = ({ n, id, title, quote, intro, details, children }) => (
  <section className="part" id={id} aria-labelledby={`${id}-h`}>
    <p className="eyebrow side"><span>{n}</span> — Part {n}</p>
    <h2 id={`${id}-h`} className="display-m">{title}</h2>
    <div className="part-body">
      {quote && <p className="pull" aria-hidden="true">{quote}</p>}
      {intro}
      {children}
      {details && <div className="details"><h3>Details</h3>{details}</div>}
    </div>
  </section>
);

const Table = ({ caption, head, rows }) => (
  <div className="table-wrap" tabIndex={0} role="region" aria-label={caption}>
    <table>
      <caption className="sr">{caption}</caption>
      <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, k) => (k === 0 ? <th key={k} scope="row">{c}</th> : <td key={k}>{c}</td>))}</tr>)}</tbody>
    </table>
  </div>
);
const svs = (id, label) => <a href={`https://svs.gsfc.nasa.gov/${id}/`}>{label || `SVS ${id}`}</a>;

const STEPS = [
  ["step-1-play", "Open the jukebox and press Play.", "The jukebox: a world map of lightning above a bar with a large Play button, a position slider, volume and Explore by touch.", <>Open <a href="play.html">the jukebox</a> and press <strong>Play</strong> (or <kbd>Space</kbd>). The sound starts in darkness and the map fades in.</>],
  ["step-2-listen", "Listen for left and right.", "Lightning playing: yellow rings on the map where each drum hit came from.", <>Listen for <strong>left and right</strong>: storms over the Americas are in your left ear, Asia in your right. Each ring on the map is one note, drawn where it came from.</>],
  ["step-3-engine", "Turn on what the engine sees.", "The engine's view: square cells over the map, filled where the engine found lightning-colored dots.", <>Press <kbd>O</kbd> for <strong>What the engine sees</strong>: the grid of cells the engine reads, filled where it found the record's colors.</>],
  ["step-4-touch", "Touch the map.", "A small square on the map over central Africa: the explore probe.", <>Move a finger or mouse over the map, or focus it and use the arrow keys. You hear what is under the square; press <kbd>D</kbd> to hear it described.</>],
  ["step-5-crate", "Try another record.", "The crate: record sleeves for lightning, night lights and ocean currents.", <>Press <kbd>2</kbd> or pick a sleeve from <strong>the crate</strong>. Same rules, different picture: now city lights play.</>],
];

const KEYS = [
  ["Space", "Play or pause", "Jukebox"], ["1 to 9, 0", "Pick a record (0 is Earth Today)", "Jukebox"], ["O", "What the engine sees", "Jukebox"],
  ["Arrow keys (map focused)", "Move the probe one cell; Shift moves five", "Jukebox"], ["D (map focused)", "Describe the cell under the probe", "Jukebox"],
  ["Escape", "Stop all sound", "Every page with sound"], ["Arrow keys (pads)", "Move between pads", "Earth Band"],
  ["Space or Enter (pad)", "Switch the part on or off; hold to solo", "Earth Band"], ["S (pad)", "Solo the focused part (press again to return)", "Earth Band"],
];

export default function App() {
  const [wide, setWide] = useState(() => matchMedia("(min-width: 1100px)").matches);
  useEffect(() => { const m = matchMedia("(min-width: 1100px)"); const f = () => setWide(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  useEffect(() => {
    if (!document.documentElement.classList.contains("js-reveal")) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.firstElementChild.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.4 });
    document.querySelectorAll(".line").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header current="notes" />
      <main id="main" className="notes-page">
        <Strip name="atmosriver" plate="01">An atmospheric river from a NASA Earth system model (SVS 4960), printed in the strings' ink.</Strip>
        <section className="title-block" aria-labelledby="notes-h">
          <p className="eyebrow">Liner notes: the complete guide</p>
          <h1 id="notes-h" className="display-l"><Line>How a picture</Line><Line className="indent">becomes a <em>song</em>.</Line></h1>
          <p className="lead">Earth Jukebox reads each frame of a NASA visualization in your browser, finds what is in it, and plays a note for it, in the place it happened. Nothing is recorded in advance. This page explains the whole project: how to use it, how it works, what it is not, and how to run it yourself.</p>
        </section>

        <div className="guide">
          <details className="toc-wrap" open={wide} key={wide ? "w" : "n"}>
            <summary className="mono">Contents</summary>
            <nav aria-label="Contents" className="toc">
              <ol>
                {PARTS.map(([n, t, id]) => <li key={id}><a href={`#${id}`}><span className="toc-n">{n}</span><span className="toc-t">{t}</span></a></li>)}
              </ol>
            </nav>
          </details>

          <div className="guide-body">
            <Part n="01" id="start" title="Start here: a 60-second walkthrough" intro={<p>Five steps, about a minute. Headphones help: left and right carry meaning.</p>}>
              <ol className="walk">
                {STEPS.map(([img, title, alt, text], i) => (
                  <li key={img}>
                    <figure className="walk-fig">
                      <img src={`guide/${img}.jpg`} alt={alt} width="720" height="250" loading="lazy" decoding="async" />
                    </figure>
                    <h3>{i + 1}. {title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </Part>

            <Part n="02" id="tour" title="Tour of the site" intro={<p>Four pages, one idea. The landing page introduces it, the jukebox plays it, Earth Band remixes it, and this guide explains it.</p>}>
              <Table caption="The pages" head={["Page", "What it is for"]} rows={[
                [<a href="./">Landing page</a>, "The idea in one screen: the live lightning clip with the engine's rings, a Play button, and a short story: the problem, the records, touch, and how it was measured."],
                [<a href="play.html">Jukebox</a>, "The main instrument: ten records, Play, the explore probe, liner notes per record, and tools (what the engine sees, scales, save as WAV)."],
                [<a href="band.html">Earth Band (beta)</a>, "The NASA visualizations together as one band (all nine are members; four at once on a phone, more on a computer that keeps up), with pads, scenes and a chord display. Linked from the jukebox and the landing page; marked beta because it has not been tested on a real phone."],
                [<a href="notes.html">This guide</a>, "How it works, for a judge, a teacher, or a developer."],
                [<a href="calibrate.html">Calibration page</a>, "A developer tool: click any point of a clip to see its pixel values, its cell, and the class it was given."],
              ]} />
            </Part>

            <Part n="03" id="language" title="The sound language" quote="The same frame always gives the same sound."
              intro={<p>The same four rules apply in every record, and to the probe as well. Learn them once and every record makes sense. The same frame always gives the same sound.</p>}
              details={<>
                <p>Pitch is snapped to the record's scale: major pentatonic for calm records (night lights, currents, B-sides), minor pentatonic for tense ones (lightning, aerosols). Each note uses its map position twice: across sets the stereo pan, height sets the pitch.</p>
                <Table caption="Sound families, identical in every record" head={["What the engine finds", "What you hear", "Kind"]} rows={[
                  ["Lightning flash", "Sharp crack or click", "Event"], ["Warm water", "Soft pad", "Sustained"], ["Cold water", "Glassy bell", "Sustained"],
                  ["City lights, more light (violet)", "Pluck A", "Sustained"], ["City lights, less light (orange)", "Pluck B", "Sustained"],
                  ["Dust", "Gritty filtered noise", "Sustained"], ["Smoke", "Muffled low breathy tone", "Sustained"], ["Sea salt", "Airy high hiss", "Sustained"],
                  ["Nothing under the probe", "Faint room tone", "Probe only"],
                ]} />
              </>}>
              <ul className="rules">
                <li><strong>Instrument</strong> says what it is.</li>
                <li><strong>Left and right</strong> say where it is across the map.</li>
                <li><strong>Pitch</strong> says how high it is on the map.</li>
                <li><strong>Loudness, brightness, and pulse speed</strong> say how much of it there is.</li>
              </ul>
            </Part>

            <Part n="04" id="records" title="The records" intro={<p>Ten records: three featured, one aerosols record, five B-sides and one live record. On flat maps, left and right mean a real place; on records with a moving camera they do not, so those are labelled artistic.</p>}>
              <Table caption="The records" head={["Key", "Record and source", "What the engine reads", "What you hear", "Map"]} rows={[
                ["1", <>Lightning from the ISS, 2017–2023 ({svs(5011)})</>, "New yellow lightning dots: the brightest pixel of a cell jumping above its running average", "A drum hit per flash; a low rumble that grows with the flash rate", "Geographic"],
                ["2", <>Night Lights 2012–2023 ({svs(5313)})</>, "Lit cells and their color: violet (more light), orange (less light), plain lights", "A west-to-east sweep of plucks; a pad that follows overall brightness", "Geographic"],
                ["3", <>Sea Surface Currents and Temperature ({svs(3912)})</>, "Warm and cold water by hue; motion between frames", "A warm pad and a cold bell for how much of each; a sweep that plays the fastest water", "Geographic"],
                ["4", <>GEOS Aerosols: the video is {svs(5552)}, a flat, unlabelled version of the same GEOS model as the challenge's {svs(5669)}, which offers stills only</>, "Dust, smoke and sea-salt colors", "Gritty noise, a low breathy rush, an airy hiss", "Geographic"],
                ["5–9", <>B-sides: DYAMOND CO2 ({svs(5196)}), Air Quality ({svs(5533)}), Perpetual Ocean 2 ({svs(5425)}), Atmospheric River ({svs(4960)}), GEDI Forest Height ({svs(4950)})</>, "Brightness, strongest color, motion (one default mapping)", "Loudness, chord, tempo", "Artistic, not geographic"],
                ["0", "Earth Today (live): yesterday's MODIS true-color Earth from NASA GIBS", "The same default mapping as the B-sides, on a still image", "Loudness and chord; no motion", "Geographic"],
              ]} />
            </Part>

            <Part n="05" id="architecture" title="Architecture" quote="Every note comes with a position on the map."
              intro={<p>Four parts, and none of them is a recording. The browser plays the NASA video; an engine reads each new frame and writes features; a steady music clock reads those features on every beat; the explore probe reads them whenever you point. Every note comes with a position on the map.</p>}
              details={<>
                <p>One position per note sets its stereo pan, its pitch, and where its ripple is drawn, so the sound and the picture cannot drift apart.</p>
                <Fig1 />
                <h3>The two clocks</h3>
                <p>Video frames arrive unevenly. Music cannot. Analysis writes features whenever a frame arrives (at most about 15 times a second); the music clock (Tone.Transport) reads them on every eighth note. The probe has a third clock of its own (every 66 ms), which is why it keeps sounding while the video is paused.</p>
                <Fig3 />
                <h3>One engine, everywhere</h3>
                <p><code>createEngine</code> in <code>src/analysis.js</code> is a pure function: pixels and a time step in, features out. No page, no audio. The browser feeds it video frames, <code>tools/engine_run.mjs</code> feeds it the same clips decoded by ffmpeg, and the tests feed it both. Calibration and tests therefore run exactly the code the site runs. On the Earth Band page each member runs its own copy of the engine in a Web Worker, so reading several videos does not crowd the main thread that schedules the music.</p>
                <h3>Module map</h3>
                <Table caption="Which file does what" head={["File", "What it does"]} rows={[
                  ["src/analysis.js", "The pure engine (createEngine) and the browser wrapper that feeds it video frames"],
                  ["src/records/<id>.data.js", "Engine settings per record: grid, color classes, flash settings, with the measurement behind each number"],
                  ["src/records/<id>.js", "Voices, the onBeat function that turns features into notes, captions and liner notes"],
                  ["src/audio.js", "Master chain and limiter, scales, sound families, voice pools, drones, WAV export"],
                  ["src/ragas.js", "Scales inspired by ragas (pure)"],
                  ["src/explore.js", "The explore probe and Learn the sounds"],
                  ["src/ripples.js, src/overlay.js, src/glow.js", "See the sound: ripples, what the engine sees, the ambient glow"],
                  ["src/main.js, play.html", "The jukebox page"],
                  ["src/band/*", "Earth Band: members, theory, score, per-member workers and ripple layers"],
                  ["src/sleeve/*, src/notes/*, src/shared/*", "The landing page and this guide (React)"],
                  ["tools/engine_run.mjs", "Runs a real clip through the real engine and prints calibration statistics"],
                ]} />
              </>} />

            <Strip name="aerosols" plate="02">Aerosols from NASA's GEOS model (SVS 5552), dust, smoke and sea salt printed in one ink.</Strip>

            <Part n="06" id="features" title="Feature engineering" quote="The brightest pixel matters because a flash can be one pixel wide, and an average would wash it out."
              intro={<p>The engine never looks at the video the way you do. It looks at a small grid of cells and keeps a few numbers for each. The brightest pixel matters because a flash can be one pixel wide, and an average would wash it out. Every number below was measured from the real clips, not guessed.</p>}
              details={<>
                <Fig2 />
                <h3>Map area and the exact 4× box downscale</h3>
                <p><strong>What:</strong> the part of the frame that is the map, cut into a grid. <strong>How:</strong> the browser draws the map area at 4 times the grid (supersampling factor 4), then the engine averages each 4×4 block itself. <strong>Why:</strong> browsers scale images differently; averaging in our own code gives every browser the same cell colors, so the same frame gives the same sound everywhere. <strong>Constants:</strong> grid 96×48 for lightning, currents, aerosols and Earth Today; 128×72 for night lights; 96×54 for the B-sides. Every clip is already cropped to its map, so the map area is the whole frame.</p>
                <h3>Brightness and the per-cell peak</h3>
                <p><strong>What:</strong> each cell's brightness, plus its single brightest pixel. <strong>How:</strong> brightness of a pixel is Rec. 709 luma, 0.2126 R + 0.7152 G + 0.0722 B; the cell keeps the largest. <strong>Why:</strong> the peak lets a one-pixel lightning dot register at full strength instead of being averaged away; a test checks exactly that.</p>
                <h3>Hue, saturation, and colour classes measured from the clips</h3>
                <p><strong>What:</strong> each cell's mean color as hue, saturation and value, and a class when the color falls in a measured range. Also a 12-bin hue histogram weighted by saturation. <strong>How:</strong> ranges were sampled on the calibration page and checked with <code>tools/engine_run.mjs</code>. <strong>Constants:</strong> lightning: hue 38–72°, saturation 0.35 or more, value 0.12 or more. Currents: warm hue 345–70°, cold hue 70–250°, saturation 0.4 or more, value 0.04 or more (grey land has saturation under 0.15). Night lights: violet hue 250–345°, orange hue 350–32°, lights hue 32–70°, plus white lights (saturation 0.15 or less, value 0.3 or more). Aerosols: dust hue 245–300°, smoke hue 345–35°, sea salt hue 150–210°. B-sides: one class, any color with value 0.25 or more.</p>
                <h3>Context-aware classes</h3>
                <p><strong>What:</strong> a class that only counts while another is on screen. <strong>Why:</strong> on Night Lights, orange means "less light" only on the change map; during the yearly series some city lights are orange too. Measured on the clip, violet appears only on the change map. <strong>Constant:</strong> orange counts as "less light" only while violet covers at least 0.5% of the map. With the gate, orange "less light" notes during the yearly series fell from 1 to 2.3% of the map to under 0.1%.</p>
                <h3>Motion as a rate between frames</h3>
                <p><strong>What:</strong> how much each cell's brightness changes. <strong>How:</strong> the change from the previous frame, divided by the time between frames and expressed per 1/15 s, then smoothed. <strong>Why:</strong> as a rate, motion means the same thing at 15 or 60 frames a second.</p>
                <h3>Flash detection</h3>
                <ol className="rules">
                  <li>For each cell, a running average of its brightest pixel (per-tick rate 0.1).</li>
                  <li>A flash candidate is a jump of the brightest pixel above that average of at least 0.25, with the pixel at 0.12 or brighter and the cell in the lightning color class. (Earth Band's smaller clip uses 0.23, measured to match the full clip's rate.)</li>
                  <li>The cell must be the largest jump in its 3×3 neighbourhood, so one flash makes one hit.</li>
                  <li>The cell then rests for 8 ticks (about half a second).</li>
                  <li>Power is the jump divided by 0.5, at most 1. At most 6 flashes are kept per beat, the strongest.</li>
                </ol>
                <p><strong>Why these numbers:</strong> on the full clip, a jump of 0.25 gives about 2 flashes a second when quiet and about 14 at the busiest, with 16% of beats at the six-hit cap; 0.15 would have capped 77%.</p>
                <h3>Columns and the west-to-east sweep</h3>
                <p>There is no separate column-profile feature. Instead, records with a playhead read one vertical strip of cells per beat and move east: 32 strips per sweep (four bars of eighth notes) for night lights, currents and aerosols, 16 for the B-sides. In each strip the brightest or fastest cells play.</p>
                <h3>Frame-rate independent smoothing</h3>
                <p>Every smoothing step uses α = 1 − e<sup>−dt/τ</sup>, so results depend on time, not on how many frames arrived. Time constants: about 0.63 s for slow features, 0.096 s for motion, 2.0 s for the flash rate. A step is clamped between 1/120 s and 0.5 s, and analysis runs at most about 15 times a second.</p>
              </>} />

            <Part n="07" id="music" title="From features to music" quote="The numbers are an example; the rules are the real ones."
              intro={<p>On every beat each record turns the newest features into a few notes. Here is one flash on the lightning map, followed all the way from picture to sound. The numbers are an example; the rules are the real ones.</p>}
              details={<>
                <Fig4 />
                <h3>Clock, scales, voices</h3>
                <p>The music clock steps on eighth notes at 96 beats a minute for lightning, night lights and currents, 88 for aerosols and 80 for the B-sides (whose tempo then follows motion, in steps of 4 beats a minute). Height on the map picks a note across three octaves of the record's pentatonic scale. Each instrument is a pool of up to six voices. Everything goes through one master gain (half volume by default) and a limiter at −3 dB. While the probe is in use during playback the music dips to half.</p>
                <h3>Scales inspired by ragas (experimental)</h3>
                <p>On records with a melody, Tools offers four scales inspired by ragas: Bhupali, Yaman, Bhairav and Malkauns, all on one home note (C). On beats 1 and 3, a note one step from the scale's two strong notes moves onto them; the last note of a bar resolves home when it is one step away. A quiet drone holds the home note and its fifth (fourth for Malkauns) while one is on: it is a fixed reference tone, not data; only its loudness follows the picture's brightness. A raga is more than a scale, and nobody trained in Hindustani music has reviewed this.</p>
              </>} />

            <Part n="08" id="touch" title="Explore by touch" quote="It works while the video is paused, because the probe has its own clock."
              intro={<p>Move a mouse or finger over the map, or focus it and use the arrow keys. You hear what is under the square: what it is, how much, and where. It works while the video is paused, because the probe has its own clock.</p>}
              details={<ul className="rules">
                <li>Every 66 ms the probe reads the 3×3 cells under the square and plays that class's voice with the same rules as the music.</li>
                <li>A flash plays at once. A sustained class (water, lights, aerosols) must hold for 2 readings before the voice switches, so it does not flicker; a short soft tick marks the change, and phones that can vibrate give a short buzz.</li>
                <li>Faster pulses and louder sounds mean more of it. Nothing under the square plays a faint room tone.</li>
                <li>Lightning has two detectors with one sound: while playing, the flash detector above; while paused, a bright spot that stands out from the 5×5 ring of cells around it by 0.04 or more.</li>
                <li>While the music plays, it dips to half under the probe and comes back when you leave.</li>
                <li>Keyboard first: arrow keys move one cell, Shift moves five, <kbd>D</kbd> describes the spot in words. Large on-screen arrow buttons (Explore by touch) are there for phone screen readers, which take over touch gestures.</li>
              </ul>} />

            <Strip name="atmosriver" plate="03">The atmospheric river again, further along: moisture reaching the coast.</Strip>

            <Part n="09" id="band" title="Earth Band" intro={<p>All nine NASA visualizations become one band. Each reads its own video at the same time, on one beat and one key. Up to four play at once on a phone; a desktop that keeps up may add more. It is an artistic remix: these visualizations cover different years and are played together, not as simultaneous events.</p>}
              details={<>
                <Table caption="Earth Band members" head={["Member", "Visualization", "Driven by"]} rows={[
                  ["Drums", "Lightning (SVS 5011)", "Flashes: kick on beats 1 and 3, snare on 2 and 4, hi-hat in between"],
                  ["Bass", "Ocean currents (SVS 3912)", "Chord root on each bar line; warm share picks root, third or fifth; motion sets how busy"],
                  ["Lead", "Night lights (SVS 5313)", "West-to-east sweep; height of the brightest light"],
                  ["Pad", "CO2 (SVS 5196)", "Holds the chord; density adds the 7th and 9th"],
                  ["Shaker", "Aerosols (SVS 5552)", "Dust on sixteenths, salt on off-beats, smoke swells"],
                  ["Arpeggio", "Perpetual Ocean 2 (SVS 5425)", "Chord tones up and down; motion sets the speed"],
                  ["Marimba", "GEDI forest height (SVS 4950)", "Off-beats; color strength sets the height"],
                  ["Strings", "Atmospheric river (SVS 4960)", "One gliding note per bar; color picks the chord tone"],
                  ["Drone", "Air quality (SVS 5533)", "A and E held; pollution color opens the filter"],
                ]} />
                <p>Harmony: the key is A natural minor and melodies keep to A minor pentatonic. Chords change on bar lines in four-bar phrases that start on A minor and lead back to it; how busy the switched-on members are decides the direction (calm: A minor, F, C, G; busy: A minor, D minor, E minor, E minor). On beats 1 and 3 the lead moves to a chord tone within two scale steps. The data decides when, where and how much; theory decides which exact notes are allowed. Each member's video plays only while it is on, read by its own Web Worker.</p>
              </>} />

            <Part n="10" id="access" title="Accessibility" intro={<p>Everything works by keyboard and with a screen reader, and nothing makes a sound before you press something.</p>}
              details={<>
                <Table caption="Keyboard shortcuts" head={["Key", "Does", "Where"]} rows={KEYS} />
                <ul className="rules">
                  <li>Spoken updates come through one polite live region: record changes, play and pause, the probe's descriptions, and on Earth Band chord changes (at most once a bar, and they can be switched off).</li>
                  <li>Captions describe the music in words while it plays, at most once every 6 seconds.</li>
                  <li>Learn the sounds plays each instrument with its name before you listen.</li>
                  <li>Reduced motion: no ripple rings (still dots instead), no spinning discs, no line reveals, and no moving backdrops (still pictures only).</li>
                  <li>Pause motion (landing page and this guide) stops every moving backdrop. On the landing page, Pause picture stops the silent lightning preview.</li>
                  <li>Text is at least 18 px, labels at least 16 px, and text contrast meets WCAG AA.</li>
                </ul>
              </>} />

            <Part n="11" id="limits" title="What this is and is not" quote="The engine reads rendered pictures, not the scientific data, so amounts are approximate."
              intro={<p>It is a sonification of NASA's visualizations: the engine reads rendered pictures, not the scientific data, so amounts are approximate.</p>}>
              <ul className="rules">
                <li>The engine reads rendered pictures, not the scientific data, so amounts are approximate. This is a sonification of the visualization.</li>
                <li>B-sides with a moving camera are artistic, not geographic: left and right do not stay on one place.</li>
                <li>EONET alerts are not a warning system and can lag by hours or days.</li>
                <li>The drone that holds the home note under a raga scale is a fixed reference tone, not data.</li>
                <li>Earth Band is an artistic remix of visualizations from different years, not simultaneous events.</li>
                <li>Not an official NASA product.</li>
              </ul>
            </Part>

            <Part n="12" id="testing" title="Testing" quote="Every colour range and threshold was measured from the real clips with a calibration tool, not guessed"
              intro={<p>Every colour range and threshold was measured from the real clips with a calibration tool, not guessed, and the reason sits next to each number in the code. Automated tests guard the engine and the music rules.</p>}
              details={<>
                <ul className="rules">
                  <li><code>npm test</code> (fast, no ffmpeg): color maths, class matching including hue wrap-around, that a one-pixel dot survives the downscale, frame-rate independence, context gates, the WAV encoder (<code>tests/engine_check.mjs</code>, <code>tests/wav_check.mjs</code>); Earth Band's theory and score (<code>tests/band_theory_check.mjs</code>); the raga scales (<code>tests/raga_check.mjs</code>).</li>
                  <li><code>npm run test:clips</code> (needs ffmpeg): the actual NASA clips through the actual engine: lightning quiet against busy and the cap, night lights orange and violet only on the change map, currents warm in the tropics and no land counted as water.</li>
                </ul>
                <div className="not-done">
                  <h3>Test results: not done yet</h3>
                  <p>The listening test with real people and the screen-reader pass have not been run. The scripts are in the repository (tests/LISTENING_TEST.md, tests/SCREEN_READER_TEST.md). We will report them here exactly as they happen, including how many people took part.</p>
                </div>
              </>} />

            <Part n="13" id="next" title="Where this goes next" intro={<p>None of this exists yet. These are directions the project could take next, listed so it is clear what is built and what is only planned.</p>}>
              <ul className="rules">
                <li><strong>Future work: Sound from the data itself.</strong> Read the scientific data behind a visualization, not only its rendered picture, so amounts are exact rather than approximate.</li>
                <li><strong>Future work: Any EIC visualization, with a mapping editor.</strong> Drop in any Earth Information Center visualization and choose, in a simple editor, what its colours and motion should sound like.</li>
                <li><strong>Future work: A kiosk mode for the display walls.</strong> A mode for the Earth Information Center's large screens: big controls, a fixed playlist, and sound that suits a public room.</li>
                <li><strong>Future work: Co-design with blind and low-vision listeners.</strong> Design and review the sound language with blind and low-vision listeners, and have trained Hindustani musicians review the raga-inspired scales.</li>
                <li><strong>Future work: More languages.</strong> Translate the interface, the liner notes and the captions.</li>
                <li><strong>Future work: Classroom use.</strong> Lesson cards for teachers and a 'guess by ear' game: hear a record, name the place or the season.</li>
                <li><strong>Future work: Haptics, and an open engine.</strong> Touch feedback beyond phone vibration, and the engine packaged so other projects can reuse it.</li>
                <li><strong>Future work: Live data as a first-class record.</strong> Near-real-time imagery and events as full records, stating plainly how old each picture is.</li>
              </ul>
            </Part>

            <Part n="14" id="run" title="Run it yourself" intro={<p>It is a static website: no server, no accounts, no keys. You need Node.js, and ffmpeg for the clip tests.</p>}
              details={<pre className="code"><code>{`npm install
npm run dev          # open the URL it prints; the jukebox is play.html
npm run build        # static site in dist/
npm test             # fast checks
npm run test:clips   # real clips through the real engine (needs ffmpeg)
node tools/engine_run.mjs <record> [start] [duration] [fps]   # calibration statistics`}</code></pre>}>
              <p>The calibration page (<a href="calibrate.html">calibrate.html</a>) shows the pixel values, cell and class for any point you click on a clip.</p>
            </Part>

            <Part n="15" id="credits" title="Data and credits" intro={<p>Every picture comes from NASA's Scientific Visualization Studio, NASA GIBS, or NASA EONET.</p>}>
              <h3>NASA resources</h3>
              <ul className="rules">
                <li>{svs(5011, "Lightning from the ISS 2017–2023 (SVS 5011)")}</li>
                <li>{svs(5313, "Night Lights 2012–2023 (SVS 5313)")}</li>
                <li>{svs(3912, "Sea Surface Currents and Temperature (SVS 3912)")}</li>
                <li>{svs(5552, "Aerosols in the Air (SVS 5552)")}, related to {svs(5669, "GEOS Aerosols (SVS 5669)")}</li>
                <li>B-sides: {svs(5196, "DYAMOND CO2 (5196)")}, {svs(5533, "Air Quality Model Runs (5533)")}, {svs(5425, "Perpetual Ocean 2 (5425)")}, {svs(4960, "Atmospheric River (4960)")}, {svs(4950, "GEDI Forest Height (4950)")}</li>
                <li><a href="https://svs.gsfc.nasa.gov/gallery/earth-information-center/">Earth Information Center gallery</a></li>
                <li><a href="https://eonet.gsfc.nasa.gov/">NASA EONET</a> and <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api">NASA GIBS</a></li>
                <li>Concept reference: {svs(13786, "Data Sonification: Caldwell 73 (SVS 13786)")}</li>
              </ul>
              <h3>Credits</h3>
              <p>Visualizations by NASA's Scientific Visualization Studio and NASA/Goddard Space Flight Center. Earth Today imagery from NASA GIBS (MODIS on Terra). Clips, covers, moving strips and Earth Band clips are made from those same visualizations, trimmed and re-encoded for the browser. Fonts, all under the SIL Open Font License: Atkinson Hyperlegible and Atkinson Hyperlegible Mono (Braille Institute), and Instrument Serif, self-hosted through Fontsource. Built with Vite, Tone.js, React, and Lenis. Built with help from an AI coding assistant (Claude).</p>
              <p><strong>Not an official NASA product.</strong></p>
            </Part>

            <Part n="16" id="glossary" title="Glossary" intro={<p>The words this guide uses, one line each.</p>}>
              <dl className="glossary">
                {[
                  ["Sonification", "Turning data, or here a picture of data, into sound."], ["Frame", "One still picture of the video."],
                  ["Cell", "One square of the grid the engine reads a frame through."], ["Feature", "A number the engine computes from a frame, such as brightness or motion."],
                  ["Class", "A kind of thing the engine recognises by color, such as warm water or dust."], ["Pan", "Where a sound sits between your left and right ear."],
                  ["Pitch", "How high or low a note is."], ["Scale", "The set of notes music is allowed to use."], ["Pentatonic", "A five-note scale; any two of its notes sound well together."],
                  ["Tonic", "The home note of a scale."], ["Vadi and samvadi", "The two most important notes of a raga."], ["Drone", "A note held underneath the music."],
                  ["Hysteresis", "Waiting for a change to hold before reacting to it, so a sound does not flicker."], ["Limiter", "A safety stage that keeps the total sound from getting too loud."],
                  ["Live region", "Part of a page a screen reader reads out when it changes."], ["Web Worker", "A separate thread in the browser, used here to read video off the main page."],
                ].map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
              </dl>
            </Part>
          </div>
        </div>
      </main>
      <Closing />
    </>
  );
}
