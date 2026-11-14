import { useEffect, useState } from "react";

/* Four hand-written figures (DESIGN.md section 8.3). One ink (violet) on a pale panel, small-caps callouts.
   Each is role="img" with a title and description, has a visible caption, and the same content as ordered text below,
   so nothing lives only in the picture. On phones each figure re-lays out vertically instead of shrinking. */

const INK = "#0d1b3d", LINE = "#4b2fcf", PANEL = "#eae3d6", PAPER = "#f4efe6", FLASH = "#fff3b0", MAP = "#0d1b3d";

function useNarrow() {
  const q = "(max-width: 720px)";
  const [n, setN] = useState(() => matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const f = () => setN(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return n;
}

function Figure({ n, side, title, desc, viewBox, maxWidth, caption, steps, children }) {
  const id = `fig${n}`;
  return (
    <figure className="fig" id={id}>
      <div className="fig-panel">
        <span className="fig-side mono" aria-hidden="true">FIG.00{n} · {side}</span>
        <svg viewBox={viewBox} style={maxWidth ? { maxWidth } : undefined} role="img" aria-labelledby={`${id}-t ${id}-d`}>
          <title id={`${id}-t`}>{title}</title>
          <desc id={`${id}-d`}>{desc}</desc>
          <defs>
            <marker id={`${id}-a`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M1 1L9 5L1 9" fill="none" stroke={LINE} strokeWidth="1.6" />
            </marker>
          </defs>
          {children(`url(#${id}-a)`)}
        </svg>
      </div>
      <figcaption><span className="mono">Fig. 00{n}</span> {caption}</figcaption>
      <ol className="fig-steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
    </figure>
  );
}

const Label = ({ x, y, children, anchor = "start", size = 14 }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={LINE} fontFamily="var(--mono)" letterSpacing="0.06em" style={{ textTransform: "uppercase" }}>{children}</text>
);
const Sub = ({ x, y, children, size = 15 }) => (
  <text x={x} y={y} textAnchor="middle" fontSize={size} fill="#4b5878">{children}</text>
);
const Arrow = ({ x1, y1, x2, y2, m, dash }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth="2" markerEnd={m} strokeDasharray={dash} />
);

/* FIG.001  Architecture */
export function Fig1() {
  const nar = useNarrow();
  const w = nar ? 300 : 170, h = nar ? 56 : 64;
  const N = nar
    ? { a: [30, 10], b: [30, 100], c: [30, 190], d1: [30, 290, 145], d2: [185, 290, 145], e1: [30, 400, 145], e2: [185, 400, 145] }
    : { a: [10, 118], b: [195, 118], c: [380, 118], d1: [565, 50], d2: [565, 186], e1: [750, 50], e2: [750, 186] };
  const T = {
    a: ["Video frame", "about 15 a second"], b: ["Analysis engine", "reads each frame"], c: ["Features", "smoothed, cached"],
    d1: ["Music clock", "reads each beat"], d2: ["Explore probe", "own clock"],
    e1: ["Notes", "pan, pitch, ripple"], e2: ["Probe voice", "pan, pitch, pulse"],
  };
  const box = (k) => { const [x, y, bw] = N[k]; return { x, y, w: bw || w, h }; };
  const edge = (f, t) => {
    const A = box(f), B = box(t);
    return nar
      ? [A.x + A.w / 2, A.y + A.h, B.x + B.w / 2, B.y]
      : [A.x + A.w, A.y + A.h / 2, B.x, B.y + B.h / 2];
  };
  const edges = [["a", "b"], ["b", "c"], ["c", "d1"], ["c", "d2"], ["d1", "e1"], ["d2", "e2"]];
  return (
    <Figure n={1} side="ARCHITECTURE" viewBox={nar ? "0 0 360 470" : "0 0 940 300"}
      title="Architecture: from video frame to sound"
      desc="A video frame goes to the analysis engine, which writes features. Two readers use the features: the music clock, which plays notes on each beat, and the explore probe, which plays a voice for the spot you point at. Every note or probe voice carries a position that sets pan, pitch, and where its ripple is drawn."
      caption="The whole pipeline. The engine writes; two readers read."
      steps={[
        "The browser plays the NASA video; about 15 times a second the analysis engine reads the newest frame.",
        "It writes what it found into a set of smoothed features and keeps them.",
        "The music clock reads the features on every beat; the explore probe reads them whenever you point at the map.",
        "Each note carries a map position. That position sets its stereo pan, its pitch, and where its ripple is drawn.",
      ]}>
      {(m) => (
        <>
          {edges.map(([f, t]) => { const [x1, y1, x2, y2] = edge(f, t); return <Arrow key={f + t} x1={x1} y1={y1} x2={x2} y2={y2} m={m} />; })}
          {Object.keys(T).map((k) => {
            const b = box(k);
            return (
              <g key={k}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={PAPER} stroke={LINE} strokeWidth="2" />
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 3} textAnchor="middle" fontSize="17" fontWeight="700" fill={INK}>{T[k][0]}</text>
                <Sub x={b.x + b.w / 2} y={b.y + b.h / 2 + 17} size={nar && b.w < 200 ? 14 : 15}>{T[k][1]}</Sub>
              </g>
            );
          })}
        </>
      )}
    </Figure>
  );
}

/* FIG.002  Data flow: one frame becomes cells */
export function Fig2() {
  const nar = useNarrow();
  const SW = 230, SH = 190; // one stage cell
  const pos = (i) => (nar ? [30, 10 + i * (SH + 36)] : [20 + i * (SW + 0), 20]);
  const vb = nar ? `0 0 360 ${4 * (SH + 36)}` : `0 0 ${4 * SW + 40} ${SH + 40}`;
  const grey = ["#3a4255", "#2c3345", "#4a5266", "#2c3345", "#3a4255", "#2c3345", "#59617a", "#2c3345", "#2c3345", "#4a5266", FLASH, "#3a4255", "#2c3345", "#3a4255", "#2c3345", "#4a5266"];
  const stages = [
    ["ONE VIDEO FRAME", (
      <g>
        <rect width="170" height="85" fill={MAP} />
        {[[30, 30], [90, 22], [120, 52], [60, 62]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={FLASH} />)}
      </g>)],
    ["DRAWN AT 4× THE GRID", (
      <g>
        <rect width="170" height="85" fill={MAP} />
        {Array.from({ length: 7 }, (_, i) => <line key={"v" + i} x1={(i + 1) * 21.25} y1="0" x2={(i + 1) * 21.25} y2="85" stroke="#5a6a99" strokeWidth="0.8" />)}
        {Array.from({ length: 3 }, (_, i) => <line key={"h" + i} x1="0" y1={(i + 1) * 21.25} x2="170" y2={(i + 1) * 21.25} stroke="#5a6a99" strokeWidth="0.8" />)}
        <rect x="85" y="21.25" width="21.25" height="21.25" fill="none" stroke="#ffc25c" strokeWidth="2" />
      </g>)],
    ["4×4 BLOCK, AVERAGED", (
      <g transform="translate(45 0)">
        {grey.map((c, i) => <rect key={i} x={(i % 4) * 20} y={Math.floor(i / 4) * 20} width="20" height="20" fill={c} stroke={PANEL} strokeWidth="1" />)}
      </g>)],
    ["ONE CELL, TWO KEPT", (
      <g>
        <rect x="10" y="0" width="64" height="64" fill="#3a4255" />
        <rect x="96" y="0" width="64" height="64" fill={FLASH} stroke={INK} strokeWidth="1" />
        <text x="42" y="86" textAnchor="middle" fontSize="15" fill={INK}>mean</text>
        <text x="128" y="86" textAnchor="middle" fontSize="15" fill={INK}>brightest</text>
      </g>)],
  ];
  const stageArrows = (m) => [0, 1, 2].map((i) => {
    const [x, y] = pos(i);
    return nar
      ? <Arrow key={i} x1={x + 85} y1={y + SH - 6} x2={x + 85} y2={y + SH + 26} m={m} />
      : <Arrow key={i} x1={x + SW - 38} y1={y + 60} x2={x + SW - 4} y2={y + 60} m={m} />;
  });
  return (
    <Figure n={2} side="DATA FLOW" viewBox={vb}
      title="Data flow: one frame becomes cells"
      desc="A video frame is drawn at four times the grid size. Each four-by-four block of pixels is averaged into one cell. Each cell keeps two things: its mean colour and its single brightest pixel."
      caption="Why a one-pixel lightning dot is never averaged away: every cell keeps its brightest pixel as well as its mean."
      steps={[
        "The map area of the frame is drawn at four times the grid (96 by 48 cells for lightning).",
        "Our own code averages each 4×4 block, so a cell's colour is the true mean in every browser.",
        "Each cell also keeps its brightest pixel, so a one-pixel flash survives the averaging.",
        "Cells then become classes (colour ranges measured from the real clip), flashes (the brightest pixel jumps above its running average), and motion.",
      ]}>
      {(m) => (
        <>
          {stages.map(([label, art], i) => {
            const [x, y] = pos(i);
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <Label x={0} y={14}>{label}</Label>
                <g transform="translate(0 34)">{art}</g>
              </g>
            );
          })}
          {stageArrows(m)}
        </>
      )}
    </Figure>
  );
}

/* FIG.003  The two clocks */
export function Fig3() {
  const nar = useNarrow();
  const ticks = [0.3, 1.1, 1.8, 2.9, 3.4, 4.6, 5.3, 5.9, 7.2, 7.7]; // uneven on purpose
  const beats = [0.8, 2.4, 4.0, 5.6, 7.2];
  const P = (lane, t) => (nar ? [lane === 0 ? 70 : 270, 50 + t * 50] : [60 + t * 108, lane === 0 ? 70 : 230]);
  const latest = (t) => ticks.filter((k) => k <= t).pop();
  return (
    <Figure n={3} side="THE TWO CLOCKS" viewBox={nar ? "0 0 360 480" : "0 0 940 300"}
      title="The two clocks"
      desc="Two timelines. The analysis clock ticks unevenly, about fifteen times a second, whenever a new video frame arrives. The music clock beats steadily. On every beat an arrow points back to the most recent analysis tick: the beat reads the latest features."
      caption="Analysis writes whenever a frame arrives; the music reads on its own steady beat."
      steps={[
        "Analysis ticks arrive unevenly, whenever a new frame is decoded (about 15 a second at most).",
        "The music clock beats steadily, on every eighth note, no matter what the video does.",
        "Each beat reads the newest features the engine has written. The two never wait for each other.",
        "So the music stays steady when frames stutter, and a slow phone gives the same sound, only with fewer readings.",
      ]}>
      {(m) => {
        const [lx0, ly0] = P(0, 0), [lx1, ly1] = P(1, 0);
        const end = nar ? [P(0, 8.2)[1] - 0, P(1, 8.2)[1]] : [P(0, 8.2)[0], P(1, 8.2)[0]];
        return (
          <>
            {nar
              ? (<><line x1={lx0} y1={ly0} x2={lx0} y2={end[0]} stroke={LINE} strokeWidth="2" /><line x1={lx1} y1={ly1} x2={lx1} y2={end[1]} stroke={LINE} strokeWidth="2" /></>)
              : (<><line x1={lx0} y1={ly0} x2={end[0]} y2={ly0} stroke={LINE} strokeWidth="2" /><line x1={lx1} y1={ly1} x2={end[1]} y2={ly1} stroke={LINE} strokeWidth="2" /></>)}
            {ticks.map((t) => { const [x, y] = P(0, t); return nar ? <line key={t} x1={x - 10} y1={y} x2={x + 10} y2={y} stroke={LINE} strokeWidth="2" /> : <line key={t} x1={x} y1={y - 10} x2={x} y2={y + 10} stroke={LINE} strokeWidth="2" />; })}
            {beats.map((t) => { const [x, y] = P(1, t); return <circle key={t} cx={x} cy={y} r="8" fill={LINE} />; })}
            {beats.map((t) => {
              const [bx, by] = P(1, t), [ax, ay] = P(0, latest(t));
              return nar
                ? <Arrow key={t} x1={bx - 10} y1={by} x2={ax + 14} y2={ay} m={m} dash="5 4" />
                : <Arrow key={t} x1={bx} y1={by - 12} x2={ax} y2={ay + 14} m={m} dash="5 4" />;
            })}
            {nar
              ? (<><Label x={lx0} y={22} anchor="middle" size={13}>Analysis</Label><Label x={lx1} y={22} anchor="middle" size={13}>Music clock</Label><Label x={180} y={470} anchor="middle" size={13}>Time runs down</Label></>)
              : (<><Label x={60} y={36}>Analysis · uneven, when a frame arrives</Label><Label x={60} y={276}>Music clock · steady beats</Label><Label x={880} y={276} anchor="end">Each beat reads the latest tick</Label></>)}
          </>
        );
      }}
    </Figure>
  );
}

/* FIG.004  One frame, one sound */
export function Fig4() {
  const mx = 40, my = 40, mw = 320, mh = 160;
  const fx = mx + 0.8 * mw, fy = my + 0.25 * mh;
  return (
    <Figure n={4} side="ONE FRAME, ONE SOUND" viewBox="0 0 400 300" maxWidth="600px"
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
      {(m) => (
        <>
          <rect x={mx} y={my} width={mw} height={mh} fill={MAP} stroke={LINE} strokeWidth="2" />
          {[[90, 90], [100, 100], [160, 70], [170, 140], [250, 120], [290, 160], [210, 60], [330, 90]].map(([x, y], i) => <circle key={i} cx={x + 0} cy={y} r="2.5" fill="#7d7a52" />)}
          <circle cx={fx} cy={fy} r="5" fill={FLASH} />
          <circle cx={fx} cy={fy} r="17" fill="none" stroke={FLASH} strokeWidth="2" opacity="0.8" />
          <line x1={fx} y1={my + mh} x2={fx} y2={fy + 20} stroke={LINE} strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1={mx} y1={fy} x2={fx - 20} y2={fy} stroke={LINE} strokeWidth="1.5" strokeDasharray="4 4" />
          {/* pan bar under the map */}
          <line x1={mx} y1={236} x2={mx + mw} y2={236} stroke={LINE} strokeWidth="2" />
          <line x1={mx + mw / 2} y1={228} x2={mx + mw / 2} y2={244} stroke={LINE} strokeWidth="2" />
          <circle cx={fx} cy={236} r="7" fill={LINE} />
          <Label x={mx} y={264} size={13}>Left</Label>
          <Label x={mx + mw} y={264} anchor="end" size={13}>Right</Label>
          <Label x={mx + mw / 2} y={264} anchor="middle" size={13}>Pan</Label>
          {/* pitch bar left of the map */}
          <line x1={22} y1={my} x2={22} y2={my + mh} stroke={LINE} strokeWidth="2" />
          <circle cx={22} cy={fy} r="7" fill={LINE} />
          <Label x={4} y={my + mh + 18} size={13}>Low</Label>
          <Label x={4} y={my - 10} size={13}>High · pitch</Label>
        </>
      )}
    </Figure>
  );
}
