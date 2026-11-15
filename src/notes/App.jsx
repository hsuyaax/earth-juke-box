import { useEffect } from "react";
import { Line, Header, Closing } from "../shared/Chrome.jsx";
import { Fig1, Fig2, Fig3, Fig4 } from "./Figures.jsx";
import { Backdrop } from "../shared/Backdrop.jsx";
import { INK } from "../covers.js";

/* A printed footage strip (DESIGN_PASS_2 section 5): full width, about 30% of the screen tall, in one record's ink. */
const Strip = ({ name, plate, children }) => (
  <figure className="strip-plate">
    <Backdrop name={name} mode="print" ink={INK[name]} rate={0.7} className="bd-fill" />
    <figcaption className="plate-cap"><span className="mono">Plate {plate}</span> {children}</figcaption>
  </figure>
);

const PARTS = [
  ["01", "The pipeline", "p1"], ["02", "Reading a frame", "p2"], ["03", "Two clocks", "p3"], ["04", "One frame, one sound", "p4"],
  ["05", "The sound language", "p5"], ["06", "Exploring by touch", "p6"], ["07", "How it was measured", "p7"],
  ["08", "Honest limits", "p8"], ["09", "Sources and credits", "p9"],
];

const Part = ({ n, id, title, quote, children }) => (
  <section className="part" id={id} aria-labelledby={`${id}-h`}>
    <p className="eyebrow side"><span>{n}</span> — Part {n}</p>
    <h2 id={`${id}-h`} className="display-m">{title}</h2>
    <div className="part-body">
      {quote && <p className="pull" aria-hidden="true">{quote}</p>}
      {children}
    </div>
  </section>
);

const FAMILIES = [
  ["Lightning flash", "Sharp crack or click", "Event"],
  ["Warm water", "Soft pad", "Sustained"],
  ["Cold water", "Glassy bell", "Sustained"],
  ["City lights, more light (violet)", "Pluck A", "Sustained"],
  ["City lights, less light (orange)", "Pluck B", "Sustained"],
  ["Dust", "Gritty filtered noise", "Sustained"],
  ["Smoke", "Muffled low breathy tone", "Sustained"],
  ["Sea salt", "Airy high hiss", "Sustained"],
];

export default function App() {
  useEffect(() => {
    if (!document.documentElement.classList.contains("js-reveal")) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.firstElementChild.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.4 });
    document.querySelectorAll(".line").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="notes-page">
        <Strip name="atmosriver" plate="01">An atmospheric river from a NASA Earth system model (SVS 4960), printed in the strings' ink.</Strip>
        <section className="title-block" aria-labelledby="notes-h">
          <p className="eyebrow">Liner notes</p>
          <h1 id="notes-h" className="display-l"><Line>How a picture</Line><Line className="indent">becomes a <em>song</em>.</Line></h1>
          <div className="title-grid">
            <p className="lead">Earth Jukebox reads each frame of a NASA visualization in your browser, finds what is in it, and plays a note for it, in the place it happened. Nothing is recorded in advance. These are the four pictures that explain how.</p>
            <nav aria-label="Contents" className="toc">
              <p className="eyebrow">Contents</p>
              <ol>
                {PARTS.map(([n, t, id]) => <li key={id}><a href={`#${id}`}><span className="toc-t">{t}</span><span className="toc-dots" aria-hidden="true" /><span className="toc-n">{n}</span></a></li>)}
              </ol>
            </nav>
          </div>
        </section>

        <Part n="01" id="p1" title="The pipeline" quote="Every note comes with a position on the map.">
          <p>Four parts, and none of them is a recording. The browser plays the NASA video. The analysis engine reads each new frame, about 15 times a second, and writes what it finds into a set of features. A music clock, steady on its own, reads those features on every beat and decides which notes to play. The explore probe reads the same features whenever you point at the map.</p>
          <p>Every note comes with a position on the map. That one position sets its stereo pan, its pitch, and where its ripple is drawn, so the sound and the picture cannot drift apart.</p>
          <Fig1 />
        </Part>

        <Part n="02" id="p2" title="Reading a frame" quote="The brightest pixel matters because a flash can be one pixel wide, and an average would wash it out.">
          <p>The engine never looks at the video the way you do. It looks at a small grid: 96 by 48 cells for the lightning map. Each cell is the average of a block of pixels, plus the single brightest pixel in it.</p>
          <p>The brightest pixel matters because a flash can be one pixel wide, and an average would wash it out. Everything the engine knows about a frame is built from those cells.</p>
          <p>Every smoothing step uses time rather than frame counts, so a slow phone, a throttled tab, and a 60-frames-a-second clip all give the same result.</p>
          <Fig2 />
        </Part>

        <Part n="03" id="p3" title="Two clocks" quote="Video frames arrive unevenly. Music cannot.">
          <p>Video frames arrive unevenly. Music cannot. So the analysis and the music run on separate clocks: analysis writes the features whenever a frame arrives, and the music clock reads them on its own steady beat. This is why the rhythm does not stumble when the picture does.</p>
          <p>The explore probe has a third, independent clock, which is why it keeps sounding when the video is paused.</p>
          <Fig3 />
        </Part>

        <Strip name="aerosols" plate="02">Aerosols from NASA's GEOS model (SVS 5552), dust, smoke and sea salt printed in one ink.</Strip>

        <Part n="04" id="p4" title="One frame, one sound" quote="The numbers are an example; the rules are the real ones.">
          <p>Here is one flash on the lightning map, followed all the way from picture to sound. The numbers are an example; the rules are the real ones.</p>
          <Fig4 />
        </Part>

        <Part n="05" id="p5" title="The sound language" quote="The same frame always gives the same sound.">
          <p>The same four rules apply in every record, and to the probe as well.</p>
          <ul className="rules">
            <li><strong>Instrument</strong> says what it is.</li>
            <li><strong>Left and right</strong> say where it is across the map.</li>
            <li><strong>Pitch</strong> says how high it is on the map, snapped to a pentatonic scale.</li>
            <li><strong>Loudness, brightness, and pulse speed</strong> say how much of it there is.</li>
          </ul>
          <div className="table-wrap">
            <table>
              <caption className="sr">Sound families, identical in every record</caption>
              <thead><tr><th scope="col">What the engine finds</th><th scope="col">What you hear</th><th scope="col">Kind</th></tr></thead>
              <tbody>{FAMILIES.map(([a, b, c]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>)}</tbody>
            </table>
          </div>
          <p>The same frame always gives the same sound. Nothing is random. Everything goes through one master chain with a limiter, at a conservative default volume.</p>
        </Part>

        <Part n="06" id="p6" title="Exploring by touch" quote="It works while the video is paused, because the probe has its own clock.">
          <p>Move a mouse or finger over the map, or focus it and use the arrow keys (Shift moves five cells). You hear what is under the square: the instrument says what it is, a faster pulse and a louder sound mean more, pitch is height, and left and right is position.</p>
          <ul className="rules">
            <li>A flash under the square plays at once. A water or light class must hold for two readings before its voice switches, so it does not flicker; a short soft tick marks the change.</li>
            <li>While the music plays, it dips to about half so you can hear the probe, and comes back when you leave.</li>
            <li>Press <kbd>D</kbd> and the page says, in words, what the square is on.</li>
            <li>It works while the video is paused, because the probe has its own clock.</li>
            <li>Large on-screen arrow buttons are there for phone screen readers, which take over touch gestures.</li>
          </ul>
          <h3>Who it helps</h3>
          <p>People who are blind or have low vision, first: everything works by keyboard and screen reader, and the map can be explored by touch on a phone. It also helps anyone who learns better by listening, and visitors to a gallery or classroom who want to hear what a visualization is saying.</p>
        </Part>

        <Strip name="atmosriver" plate="03">The atmospheric river again, further along: moisture reaching the coast.</Strip>

        <Part n="07" id="p7" title="How it was measured" quote="Every colour range and threshold was measured from the real clips with a calibration tool, not guessed">
          <p>Every colour range and threshold was measured from the real clips with a calibration tool, not guessed, and the reason sits next to each number in the code. <a href="calibrate.html">calibrate.html</a> lets you click any point of a clip to see its pixel values, its cell, and the class it was given.</p>
          <ul className="rules">
            <li><strong>Real clips, real engine.</strong> <code>npm run test:clips</code> decodes the actual NASA clips and runs them through the same engine code the site runs.</li>
            <li><strong>Lightning.</strong> The flash threshold was set on the full clip: about 2 flashes a second when it is quiet, about 14 at the busiest. Only 16% of beats reach the six-note cap; a lower threshold would have capped 77%.</li>
            <li><strong>Night lights.</strong> Orange "less light" notes that did not belong fell from 1 to 2.3% of the map to under 0.1%, once orange counted as less light only on the change map.</li>
            <li><strong>Fast checks.</strong> <code>npm test</code> covers colour maths, class matching, that a one-pixel dot survives the downscale, frame-rate independence, and the WAV encoder.</li>
          </ul>
          <div className="not-done">
            <h3>Test results: not done yet</h3>
            <p>The listening test with real people and the screen-reader pass have not been run. The scripts are in the repository. We will report them here exactly as they happen, including how many people took part.</p>
          </div>
        </Part>

        <Part n="08" id="p8" title="Honest limits" quote="The engine reads rendered pictures, not the scientific data, so amounts are approximate.">
          <ul className="rules">
            <li>The engine reads rendered pictures, not the scientific data, so amounts are approximate. This is a sonification of the visualization.</li>
            <li>B-sides with a moving camera are artistic, not geographic: left and right do not stay on one place.</li>
            <li>EONET alerts are not a warning system and can lag by hours or days.</li>
            <li>Raga scale presets are experimental and not yet approved by a musician.</li>
          </ul>
        </Part>

        <Part n="09" id="p9" title="Sources and credits">
          <h3>NASA resources</h3>
          <ul className="rules">
            <li><a href="https://svs.gsfc.nasa.gov/5011/">Lightning from the ISS 2017–2023 (SVS 5011)</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/5313/">Night Lights 2012–2023 (SVS 5313)</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/3912/">Sea Surface Currents and Temperature (SVS 3912)</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/5552/">Aerosols in the Air (SVS 5552)</a>, related to <a href="https://svs.gsfc.nasa.gov/5669/">GEOS Aerosols (SVS 5669)</a></li>
            <li>B-sides: <a href="https://svs.gsfc.nasa.gov/5196/">DYAMOND CO2 (5196)</a>, <a href="https://svs.gsfc.nasa.gov/5533/">Air Quality Model Runs (5533)</a>, <a href="https://svs.gsfc.nasa.gov/5425/">Perpetual Ocean 2 (5425)</a>, <a href="https://svs.gsfc.nasa.gov/4960/">Atmospheric River (4960)</a>, <a href="https://svs.gsfc.nasa.gov/4950/">GEDI Forest Height (4950)</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/gallery/earth-information-center/">Earth Information Center gallery</a></li>
            <li><a href="https://eonet.gsfc.nasa.gov/">NASA EONET</a> and <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api">NASA GIBS</a></li>
            <li>Concept reference: <a href="https://svs.gsfc.nasa.gov/13786/">Data Sonification: Caldwell 73 (SVS 13786)</a></li>
          </ul>
          <h3>Credits</h3>
          <p>Visualizations by NASA's Scientific Visualization Studio and NASA/Goddard Space Flight Center. Earth Today imagery from NASA GIBS (MODIS on Terra). Fonts, all under the SIL Open Font License: Atkinson Hyperlegible and Atkinson Hyperlegible Mono (Braille Institute), and Instrument Serif, self-hosted through Fontsource. Moving strips and covers are made from the same NASA visualization clips (including SVS 4960 and 5552). Built with Vite, Tone.js, React, and Lenis. Built with help from an AI coding assistant (Claude).</p>
          <p><strong>Not an official NASA product.</strong></p>
        </Part>
      </main>
      <Closing />
    </>
  );
}
