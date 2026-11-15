import { logoSVG } from "../logo.js";
import { Backdrop, MotionToggle } from "./Backdrop.jsx";

export const NOTES_URL = "notes.html";

/* A display line: moves as a whole, once, when it enters the viewport (never letter by letter). */
export const Line = ({ children, className = "" }) => (
  <span className={`line ${className}`}><span className="rise">{children}</span></span>
);

function Logo() { return <span className="logo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: logoSVG(32) }} />; }

export function Header() {
  return (
    <header className="top">
      <a className="brand" href="./"><Logo /><span>Earth Jukebox</span></a>
      <nav aria-label="Main">
        <a href="play.html">Play</a>
        <a href={NOTES_URL}>How it works</a>
        <MotionToggle />
      </nav>
    </header>
  );
}

export function Closing() {
  return (
    <footer className="band vinyl closing">
      <Backdrop name="nightlights" mode="light" className="bd-fill bd-footer" />
      <p className="display-l"><Line>Play the <em>record</em>.</Line></p>
      <p className="ctas">
        <a className="play" href="play.html">Play the record</a>
        <a className="link" href={NOTES_URL}>How it works</a>
      </p>
      <p className="wordmark" aria-hidden="true">Earth Jukebox</p>
      <div className="fine">
        <p><strong>Not an official NASA product.</strong> A sonification of NASA visualizations, not of the raw data; values read from colors are approximate.</p>
        <p>Visualizations: NASA's Scientific Visualization Studio (<a href="https://svs.gsfc.nasa.gov/5011/">5011</a>, <a href="https://svs.gsfc.nasa.gov/5313/">5313</a>); NASA/Goddard Space Flight Center Scientific Visualization Studio (<a href="https://svs.gsfc.nasa.gov/3912/">3912</a>). Clips trimmed and re-encoded for the browser. Moving backdrops and covers are made from the same visualization clips, including DYAMOND carbon dioxide (<a href="https://svs.gsfc.nasa.gov/5196/">SVS 5196</a>). Live data: NASA GIBS and NASA EONET.</p>
        <p>Fonts: Atkinson Hyperlegible (Braille Institute) and Instrument Serif, both under the SIL Open Font License. Built with help from an AI coding assistant (Claude).</p>
      </div>
    </footer>
  );
}

