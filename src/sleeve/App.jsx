import { useEffect, useRef, useState } from "react";
import { createHero } from "./hero.js";
import { coverSVG } from "../covers.js";
import { Line, Header, Closing } from "../shared/Chrome.jsx";


function Hero() {
  const videoRef = useRef(null), stageRef = useRef(null), ctl = useRef(null);
  const [playing, setPlaying] = useState(false), [busy, setBusy] = useState(false), [played, setPlayed] = useState(false);
  const [preview, setPreview] = useState({ available: false, paused: false });
  const [stats, setStats] = useState(null), [offscreen, setOffscreen] = useState(false), [err, setErr] = useState(""), [vol, setVol] = useState(50);

  useEffect(() => {
    ctl.current = createHero({
      video: videoRef.current, stage: stageRef.current,
      onStats: setStats, onPreview: setPreview, onVisible: (v) => setOffscreen(!v),
      onPlaying: (p) => { setPlaying(p); if (p) setPlayed(true); }, onError: setErr,
    });
    return () => ctl.current.destroy();
  }, []);

  const toggle = async () => {
    if (busy) return;
    setErr("");
    if (playing) return ctl.current.stop();
    setBusy(true);
    await ctl.current.start();
    setBusy(false);
  };
  const onVol = (e) => { setVol(+e.target.value); ctl.current?.setVolume(e.target.value / 100); };
  const label = busy ? "Loading sound…" : playing ? "Pause" : "Play";

  return (
    <section className="hero" aria-labelledby="hero-h">
      <p className="eyebrow">NASA Space Apps 2026 · The Earth Information Jukebox</p>
      <div className="hero-head">
        <h1 id="hero-h" className="display-xl">
          <Line>Hear</Line>
          <Line className="indent">the <em>planet</em>.</Line>
        </h1>
        <div className="hero-cta">
          <p className="lead">Every sound comes from the NASA picture, at the place it happened.</p>
          <button type="button" className="play" onClick={toggle} aria-busy={busy} aria-keyshortcuts="Escape">
            <span className="play-glyph" aria-hidden="true">{playing ? "❚❚" : "▶"}</span>{label}
          </button>
          <p className="hint">{playing ? "Press Escape or Pause to stop." : "Silent until you press Play."}</p>
        </div>
      </div>

      <figure className="hero-fig">
        <div className="stage" ref={stageRef}>
        <video ref={videoRef} src="clips/lightning.mp4" poster="hero-poster.jpg" muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
        <canvas id="ripples" aria-hidden="true" />
        </div>
        {preview.available && !playing && (
          <button type="button" className="pause-pic" onClick={() => ctl.current.setPreviewPaused(!preview.paused)}>
            <span aria-hidden="true">{preview.paused ? "▶" : "❚❚"}</span> {preview.paused ? "Resume picture" : "Pause picture"}
          </button>
        )}
        <figcaption>
          <span className="mono">Fig. 0</span> Lightning seen from the International Space Station, 2017–2023, on a flat world map. Each ring is one flash the engine found in the picture.
        </figcaption>
      </figure>

      <div className="hero-foot">
        <p className="status mono" aria-label="Live numbers from the engine">
          Flashes per second {stats?.rate != null ? stats.rate.toFixed(1) : "—"} · Flashes counted {stats?.flashes ?? "—"} · Beats {playing ? stats?.beat ?? 0 : "—"}
        </p>
        <label className="vol-row"><span>Volume</span><input type="range" min="0" max="100" value={vol} onChange={onVol} /></label>
        <a className="link" href="play.html">Open the full jukebox</a>
      </div>
      <p className="credit">Footage: NASA Scientific Visualization Studio, <a href="https://svs.gsfc.nasa.gov/5011/">SVS 5011</a>. Not an official NASA product.</p>
      {err && <p className="error" role="alert">{err}</p>}
      <p className="sr" role="status">{playing ? "Playing lightning from the International Space Station." : played ? "Paused." : ""}</p>

      {playing && offscreen && (
        <div className="pill" role="group" aria-label="Sound">
          <button type="button" onClick={toggle}>Pause</button>
          <label><span className="sr">Volume</span><input type="range" min="0" max="100" value={vol} onChange={onVol} /></label>
        </div>
      )}
    </section>
  );
}

function Problem() {
  return (
    <section className="band" aria-labelledby="problem-h">
      <div className="statement">
        <p className="eyebrow side"><span>01</span> — The problem</p>
        <h2 id="problem-h" className="display-l">
          <Line>NASA shows the planet</Line><Line>in pictures.</Line>
          <Line className="indent">Pictures leave people <em>out</em>.</Line>
        </h2>
      </div>
      <div className="cols">
        <p>NASA's Earth Information Center shows lightning, city lights, ocean currents, smoke, and dust as beautiful moving images. People who are blind or have low vision get, at best, a sentence describing them.</p>
        <p>The challenge asked for a jukebox that pairs those frames with sound made in real time. So every sound here is read from the picture, then placed on the map: left and right for where, pitch for how high, instrument for what.</p>
      </div>
    </section>
  );
}

const Divider = () => (
  <p className="divider mono">
    <span aria-hidden="true">Every · sound · comes · from · the · picture</span>
    <span className="sr">Every sound comes from the picture.</span>
  </p>
);

const RECORDS = [
  { key: 1, id: "lightning", title: "Lightning from the ISS", line: "Every flash is a drum hit you can place by ear." },
  { key: 2, id: "nightlights", title: "Night Lights 2012–2023", line: "Where the world is lit, and where it gained or lost light." },
  { key: 3, id: "currents", title: "Sea Surface Currents and Temperature", line: "Warm and cold water, and how fast the sea is moving." },
];
const LANGUAGE = [
  ["Instrument", "tells you what it is."],
  ["Left and right", "tell you where it is."],
  ["Pitch", "tells you how high it is."],
  ["Loudness", "tells you how much there is."],
];

function HearIt() {
  return (
    <section className="band vinyl" aria-labelledby="hear-h">
      <div className="statement">
        <p className="eyebrow side"><span>02</span> — Hear it</p>
        <h2 id="hear-h" className="display-l">
          <Line>Three records.</Line><Line className="indent">One <em>language</em>.</Line>
        </h2>
      </div>
      <ul className="sleeves">
        {RECORDS.map((r) => (
          <li key={r.id} className="sleeve-card">
            <div className="cover-wrap" dangerouslySetInnerHTML={{ __html: coverSVG(r.id) }} />
            <p className="eyebrow">Record {r.key}</p>
            <h3>{r.title}</h3>
            <p>{r.line}</p>
            <a className="link stretch" href={`play.html?r=${r.key}`} aria-label={`Play this record: ${r.title}`}>Play this record →</a>
          </li>
        ))}
      </ul>
      <p className="eyebrow">The same four rules in every record</p>
      <ul className="language">
        {LANGUAGE.map(([a, b]) => <li key={a} className="display-m"><em>{a}</em> {b}</li>)}
      </ul>
    </section>
  );
}

/* The probe, drawn: a map, the square under the pointer, and the keys. Decorative; the list beside it carries the same facts. */
function ProbeFigure() {
  // Drawn at 360 wide so the key glyphs never render below 16 px on a phone.
  const keys = ["←", "↑", "↓", "→", "D"];
  return (
    <svg className="figure" viewBox="0 0 360 250" role="img" aria-labelledby="probe-t probe-d">
      <title id="probe-t">The explore probe</title>
      <desc id="probe-d">A world map with a small square on it. The square is what you hear. Below the map are the four arrow keys that move the square, and the D key that describes the spot.</desc>
      <rect x="1" y="1" width="358" height="150" fill="#0d1b3d" stroke="#4b2fcf" strokeWidth="2" />
      {[[50, 40], [58, 50], [150, 30], [156, 90], [162, 94], [250, 60], [262, 36], [300, 80], [100, 110], [220, 120]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#fff3b0" />)}
      <rect x="148" y="70" width="34" height="34" fill="none" stroke="#ffc25c" strokeWidth="3" />
      <g transform="translate(20 176)">
        {keys.map((g, i) => (
          <g key={g} transform={`translate(${i * 66} 0)`}>
            <rect width="56" height="56" rx="4" fill="#eae3d6" stroke="#4b2fcf" strokeWidth="2" />
            <text x="28" y="38" textAnchor="middle" fontSize="28" fill="#0d1b3d">{g}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function TouchIt() {
  return (
    <section className="band" aria-labelledby="touch-h">
      <div className="statement">
        <p className="eyebrow side"><span>03</span> — Touch it</p>
        <h2 id="touch-h" className="display-l"><Line>Now put your</Line><Line className="indent"><em>finger</em> on it.</Line></h2>
      </div>
      <div className="cols touch">
        <figure>
          <ProbeFigure />
          <figcaption><span className="mono">Fig. 1</span> The probe: a square you move over the map. The instrument under it says what is there.</figcaption>
        </figure>
        <div>
          <p>Move a mouse or finger over the map, or focus it and use the arrow keys. Shift moves five squares at a time. You hear what is under the square: the instrument says what it is, faster and louder means more, pitch is height, left and right is position.</p>
          <ul className="plain">
            <li>Press <kbd>D</kbd> and the page says, in words, what the square is on.</li>
            <li>It works while the music plays and while it is paused.</li>
            <li>Large arrow buttons on screen are there for phone screen readers, which take over touch gestures.</li>
          </ul>
          <a className="link" href="play.html">Explore by touch</a>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="band" aria-labelledby="proof-h">
      <div className="statement">
        <p className="eyebrow side"><span>04</span> — How we know it works</p>
        <h2 id="proof-h" className="display-l"><Line>Measured,</Line><Line className="indent">not <em>guessed</em>.</Line></h2>
      </div>
      <ol className="facts">
        <li><h3>Real clips, real engine</h3><p>The tests run the actual NASA clips through the same code the site runs: lightning, night lights, and ocean currents.</p></li>
        <li><h3>Lightning</h3><p>The flash threshold was set on the full clip: about 2 flashes a second when it is quiet, about 14 at the busiest. Only 16% of beats reach the six-note cap; a lower threshold would have capped 77%.</p></li>
        <li><h3>Night lights</h3><p>Orange "less light" notes that did not belong dropped from 1 to 2.3% of the map to under 0.1%, once the engine learned that orange means less light only on the change map.</p></li>
      </ol>
      <div className="not-done">
        <h3>Not done yet</h3>
        <p>The listening test with real people, and the screen-reader pass. The scripts are in the repository. Results will be added exactly as they happen.</p>
      </div>
    </section>
  );
}

export default function App() {
  // Reveal each display line once, when it first enters the viewport. (Watch the mask, not the moving line inside it.)
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
      <main id="main">
        <Hero />
        <Problem />
        <Divider />
        <HearIt />
        <TouchIt />
        <Proof />
      </main>
      <Closing />
    </>
  );
}
