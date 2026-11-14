import { useLayoutEffect, useRef, useState } from "react";

/* Four hand-written figures (DESIGN.md section 8.3). One ink (violet) on a pale panel, small-caps callouts.
   Each is role="img" with a title and description, has a visible caption, and the same content as ordered text below,
   so nothing lives only in the picture.

   Legibility rule: no figure text renders below 16 px. Each figure has a wide layout drawn at a fixed width (WIDE) and a
   tall layout drawn at 320. The figure measures the room it really has and picks the wide layout only when it fits at
   1:1 or larger, so the text is never scaled down. Text sizes in the drawings are 16 to 18 units for that reason. */

const INK = "#0d1b3d", INK2 = "#4b5878", LINE = "#4b2fcf", PANEL = "#eae3d6", PAPER = "#f4efe6", FLASH = "#fff3b0", MAP = "#0d1b3d";
const WIDE = 840, TALL = 320;

function Figure({ n, side, title, desc, caption, steps, wide = true, tallMax = 380, wideH, tallH, children }) {
  const id = `fig${n}`;
  const box = useRef(null);
  const [room, setRoom] = useState(() => (typeof window === "undefined" ? 0 : Math.min(window.innerWidth, 900)));
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setRoom(e.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const narrow = !wide || room < WIDE;
  const vb = narrow ? `0 0 ${TALL} ${tallH}` : `0 0 ${WIDE} ${wideH}`;
  return (
    <figure className="fig" id={id}>
      <div className="fig-panel">
        <span className="fig-side mono" aria-hidden="true">FIG.00{n} · {side}</span>
        <div ref={box} className="fig-inner">
          <svg viewBox={vb} style={narrow ? { maxWidth: tallMax } : undefined} role="img" aria-labelledby={`${id}-t ${id}-d`}>
            <title id={`${id}-t`}>{title}</title>
            <desc id={`${id}-d`}>{desc}</desc>
            <defs>
              <marker id={`${id}-a`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M1 1L9 5L1 9" fill="none" stroke={LINE} strokeWidth="1.6" />
              </marker>
            </defs>
            {children(`url(#${id}-a)`, narrow)}
          </svg>
        </div>
      </div>
      <figcaption><span className="mono">Fig. 00{n}</span> {caption}</figcaption>
      <ol className="fig-steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
    </figure>
  );
}

// Small-caps callout (16 units) and plain sub-label (16 units); titles inside boxes are 17.
const Label = ({ x, y, children, anchor = "start" }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize="16" fill={LINE} fontFamily="var(--mono)" letterSpacing="0.05em" style={{ textTransform: "uppercase" }}>{children}</text>
);
const Sub = ({ x, y, children }) => <text x={x} y={y} textAnchor="middle" fontSize="16" fill={INK2}>{children}</text>;
const Arrow = ({ x1, y1, x2, y2, m, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth="2" markerEnd={m} strokeDasharray={dash} />;

/* FIG.001  Architecture */
export function Fig1() {
  const T = {
    a: ["Video frame", "about 15 a second"], b: ["Analysis engine", "reads each frame"], c: ["Features", "smoothed, cached"],
    d1: ["Music clock", "reads each beat"], d2: ["Explore probe", "own clock"],
    e1: ["Notes", "pan, pitch, ripple"], e2: ["Probe voice", "pan, pitch, pulse"],
  };
  const edges = [["a", "b"], ["b", "c"], ["c", "d1"], ["c", "d2"], ["d1", "e1"], ["d2", "e2"]];
  return (
    <Figure n={1} side="ARCHITECTURE" wideH={300} tallH={470}
      title="Architecture: from video frame to sound"
      desc="A video frame goes to the analysis engine, which writes features. Two readers use the features: the music clock, which plays notes on each beat, and the explore probe, which plays a voice for the spot you point at. Every note or probe voice carries a position that sets pan, pitch, and where its ripple is drawn."
      caption="The whole pipeline. The engine writes; two readers read."
      steps={[
        "The browser plays the NASA video; about 15 times a second the analysis engine reads the newest frame.",
        "It writes what it found into a set of smoothed features and keeps them.",
        "The music clock reads the features on every beat; the explore probe reads them whenever you point at the map.",
        "Each note carries a map position. That position sets its stereo pan, its pitch, and where its ripple is drawn.",
      ]}>
      {(m, nar) => {
        const w = nar ? 300 : 147, h = nar ? 60 : 64;
        const N = nar
          ? { a: [10, 10], b: [10, 100], c: [10, 190], d1: [10, 290, 145], d2: [165, 290, 145], e1: [10, 400, 145], e2: [165, 400, 145] }
          : { a: [0, 118], b: [173, 118], c: [346, 118], d1: [519, 50], d2: [519, 186], e1: [692, 50], e2: [692, 186] };
        const box = (k) => { const [x, y, bw] = N[k]; return { x, y, w: bw || w, h }; };
        const edge = (f, t) => {
          const A = box(f), B = box(t);
          return nar ? [A.x + A.w / 2, A.y + A.h, B.x + B.w / 2, B.y] : [A.x + A.w, A.y + A.h / 2, B.x, B.y + B.h / 2];
        };
        return (
          <>
            {edges.map(([f, t]) => { const [x1, y1, x2, y2] = edge(f, t); return <Arrow key={f + t} x1={x1} y1={y1} x2={x2} y2={y2} m={m} />; })}
            {Object.keys(T).map((k) => {
              const b = box(k);
              return (
                <g key={k}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={PAPER} stroke={LINE} strokeWidth="2" />
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 4} textAnchor="middle" fontSize="17" fontWeight="700" fill={INK}>{T[k][0]}</text>
                  <Sub x={b.x + b.w / 2} y={b.y + b.h / 2 + 17}>{T[k][1]}</Sub>
                </g>
              );
            })}
          </>
        );
      }}
    </Figure>
  );
}

/* FIG.002  Data flow: one frame becomes cells */
export function Fig2() {
  const SH = 190;
  const grey = ["#3a4255", "#2c3345", "#4a5266", "#2c3345", "#3a4255", "#2c3345", "#59617a", "#2c3345", "#2c3345", "#4a5266", FLASH, "#3a4255", "#2c3345", "#3a4255", "#2c3345", "#4a5266"];
  const stages = [
    ["ONE FRAME", (
      <g>
        <rect width="170" height="85" fill={MAP} />
        {[[30, 30], [90, 22], [120, 52], [60, 62]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={FLASH} />)}
      </g>)],
    ["DRAWN AT 4× GRID", (
      <g>
        <rect width="170" height="85" fill={MAP} />
        {Array.from({ length: 7 }, (_, i) => <line key={"v" + i} x1={(i + 1) * 21.25} y1="0" x2={(i + 1) * 21.25} y2="85" stroke="#5a6a99" strokeWidth="0.8" />)}
        {Array.from({ length: 3 }, (_, i) => <line key={"h" + i} x1="0" y1={(i + 1) * 21.25} x2="170" y2={(i + 1) * 21.25} stroke="#5a6a99" strokeWidth="0.8" />)}
        <rect x="85" y="21.25" width="21.25" height="21.25" fill="none" stroke="#ffc25c" strokeWidth="2" />
      </g>)],
    ["AVERAGE BLOCKS", (
      <g transform="translate(45 0)">
        {grey.map((c, i) => <rect key={i} x={(i % 4) * 20} y={Math.floor(i / 4) * 20} width="20" height="20" fill={c} stroke={PANEL} strokeWidth="1" />)}
      </g>)],
    ["TWO KEPT PER CELL", (
      <g>
        <rect x="10" y="0" width="64" height="64" fill="#3a4255" />
        <rect x="96" y="0" width="64" height="64" fill={FLASH} stroke={INK} strokeWidth="1" />
        <text x="42" y="88" textAnchor="middle" fontSize="16" fill={INK}>mean</text>
        <text x="128" y="88" textAnchor="middle" fontSize="16" fill={INK}>brightest</text>
      </g>)],
  ];
  return (
    <Figure n={2} side="DATA FLOW" wideH={SH + 30} tallH={4 * (SH + 40)}
      title="Data flow: one frame becomes cells"
      desc="A video frame is drawn at four times the grid size. Each four-by-four block of pixels is averaged into one cell. Each cell keeps two things: its mean colour and its single brightest pixel."
      caption="Why a one-pixel lightning dot is never averaged away: every cell keeps its brightest pixel as well as its mean."
      steps={[
        "The map area of the frame is drawn at four times the grid (96 by 48 cells for lightning).",
        "Our own code averages each 4×4 block, so a cell's colour is the true mean in every browser.",
        "Each cell also keeps its brightest pixel, so a one-pixel flash survives the averaging.",
        "Cells then become classes (colour ranges measured from the real clip), flashes (the brightest pixel jumps above its running average), and motion.",
      ]}>
      {(m, nar) => {
        const pos = (i) => (nar ? [10, 10 + i * (SH + 40)] : [i * 210, 10]);
        return (
          <>
            {stages.map(([label, art], i) => {
              const [x, y] = pos(i);
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <Label x={0} y={16}>{label}</Label>
                  <g transform="translate(0 38)">{art}</g>
                </g>
              );
            })}
            {[0, 1, 2].map((i) => {
              const [x, y] = pos(i);
              return nar
                ? <Arrow key={i} x1={x + 85} y1={y + SH - 4} x2={x + 85} y2={y + SH + 28} m={m} />
                : <Arrow key={i} x1={x + 178} y1={y + 80} x2={x + 204} y2={y + 80} m={m} />;
            })}
          </>
        );
      }}
    </Figure>
  );
}

/* FIG.003  The two clocks */
export function Fig3() {
  const ticks = [0.3, 1.1, 1.8, 2.9, 3.4, 4.6, 5.3, 5.9, 7.2, 7.7]; // uneven on purpose
  const beats = [0.8, 2.4, 4.0, 5.6, 7.2];
  const latest = (t) => ticks.filter((k) => k <= t).pop();
  return (
    <Figure n={3} side="THE TWO CLOCKS" wideH={300} tallH={500}
      title="The two clocks"
      desc="Two timelines. The analysis clock ticks unevenly, about fifteen times a second, whenever a new video frame arrives. The music clock beats steadily. On every beat an arrow points back to the most recent analysis tick: the beat reads the latest features."
      caption="Analysis writes whenever a frame arrives; the music reads on its own steady beat."
      steps={[
        "Analysis ticks arrive unevenly, whenever a new frame is decoded (about 15 a second at most).",
        "The music clock beats steadily, on every eighth note, no matter what the video does.",
        "Each beat reads the newest features the engine has written. The two never wait for each other.",
        "So the music stays steady when frames stutter, and a slow phone gives the same sound, only with fewer readings.",
      ]}>
      {(m, nar) => {
        const P = (lane, t) => (nar ? [lane === 0 ? 70 : 250, 50 + t * 50] : [60 + t * 94, lane === 0 ? 70 : 230]);
        const [lx0, ly0] = P(0, 0), [lx1, ly1] = P(1, 0);
        const end0 = nar ? P(0, 8.2)[1] : P(0, 8.2)[0], end1 = nar ? P(1, 8.2)[1] : P(1, 8.2)[0];
        return (
          <>
            {nar
              ? (<><line x1={lx0} y1={ly0} x2={lx0} y2={end0} stroke={LINE} strokeWidth="2" /><line x1={lx1} y1={ly1} x2={lx1} y2={end1} stroke={LINE} strokeWidth="2" /></>)
              : (<><line x1={lx0} y1={ly0} x2={end0} y2={ly0} stroke={LINE} strokeWidth="2" /><line x1={lx1} y1={ly1} x2={end1} y2={ly1} stroke={LINE} strokeWidth="2" /></>)}
            {ticks.map((t) => { const [x, y] = P(0, t); return nar ? <line key={t} x1={x - 10} y1={y} x2={x + 10} y2={y} stroke={LINE} strokeWidth="2" /> : <line key={t} x1={x} y1={y - 10} x2={x} y2={y + 10} stroke={LINE} strokeWidth="2" />; })}
            {beats.map((t) => { const [x, y] = P(1, t); return <circle key={t} cx={x} cy={y} r="8" fill={LINE} />; })}
            {beats.map((t) => {
              const [bx, by] = P(1, t), [ax, ay] = P(0, latest(t));
              return nar
                ? <Arrow key={t} x1={bx - 10} y1={by} x2={ax + 14} y2={ay} m={m} dash="5 4" />
                : <Arrow key={t} x1={bx} y1={by - 12} x2={ax} y2={ay + 14} m={m} dash="5 4" />;
            })}
            {nar
              ? (<><Label x={lx0} y={24} anchor="middle">Analysis</Label><Label x={lx1} y={24} anchor="middle">Music clock</Label><Label x={160} y={488} anchor="middle">Time runs down</Label></>)
              : (<><Label x={60} y={36}>Analysis · uneven, when a frame arrives</Label><Label x={60} y={278}>Music clock · steady beats</Label><Label x={830} y={278} anchor="end">Each beat reads the latest tick</Label></>)}
          </>
        );
      }}
    </Figure>
  );
}

/* FIG.004  One frame, one sound (one layout; drawn at 320 wide and never shown smaller than that) */
export function Fig4() {
  const mx = 44, my = 40, mw = 264, mh = 132;
  const fx = mx + 0.8 * mw, fy = my + 0.25 * mh;
  const dots = [[0.15, 0.4], [0.2, 0.55], [0.38, 0.25], [0.42, 0.8], [0.62, 0.62], [0.74, 0.9], [0.52, 0.15], [0.9, 0.38]];
  return (
    <Figure n={4} side="ONE FRAME, ONE SOUND" wide={false} tallMax={480} tallH={252}
      title="One flash becomes one sound"
      desc="A world map with one flash found a quarter of the way down and four fifths of the way across. A ring is drawn on that spot. A bar under the map shows that its horizontal position sets the stereo pan, to the right. A bar beside the map shows that its height sets a high note."
      caption="A worked example on the lightning map: where the flash is decides how it sounds."
      steps={[
        "Suppose the engine finds a flash 80% of the way across the map and 25% of the way down.",
        "Across sets pan: 0.8 across means 0.6 to the right in the stereo field.",
        "Down sets pitch: this high on the map is a high note, snapped to the record's scale (minor pentatonic for lightning).",
        "Strength sets loudness: a brighter jump is a louder drum hit.",
        "The ripple is drawn at the same spot, so where you see it is where you hear it.",
      ]}>
      {() => (
        <>
          <rect x={mx} y={my} width={mw} height={mh} fill={MAP} stroke={LINE} strokeWidth="2" />
          {dots.map(([x, y], i) => <circle key={i} cx={mx + x * mw} cy={my + y * mh} r="2.5" fill="#7d7a52" />)}
          <circle cx={fx} cy={fy} r="5" fill={FLASH} />
          <circle cx={fx} cy={fy} r="16" fill="none" stroke={FLASH} strokeWidth="2" opacity="0.8" />
          <line x1={fx} y1={my + mh} x2={fx} y2={fy + 19} stroke={LINE} strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1={mx} y1={fy} x2={fx - 19} y2={fy} stroke={LINE} strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1={mx} y1={208} x2={mx + mw} y2={208} stroke={LINE} strokeWidth="2" />
          <line x1={mx + mw / 2} y1={200} x2={mx + mw / 2} y2={216} stroke={LINE} strokeWidth="2" />
          <circle cx={fx} cy={208} r="7" fill={LINE} />
          <Label x={mx} y={242}>Left</Label>
          <Label x={mx + mw / 2} y={242} anchor="middle">Pan</Label>
          <Label x={mx + mw} y={242} anchor="end">Right</Label>
          <line x1={22} y1={my} x2={22} y2={my + mh} stroke={LINE} strokeWidth="2" />
          <circle cx={22} cy={fy} r="7" fill={LINE} />
          <Label x={4} y={my - 12}>High · pitch</Label>
          <Label x={4} y={my + mh + 22}>Low</Label>
        </>
      )}
    </Figure>
  );
}
