// Generative record covers (DESIGN.md section 9): one pattern per record, matched to its subject.
// Our own code, seeded by record id, so a cover is always the same. Two colors: the record's voice color on the groove.
// Decorative: callers mark the result aria-hidden; the title carries the meaning.

const BG = "#081229";
const COLOR = {
  lightning: "#FFF3B0", nightlights: "#9B7BFF", currents: "#5CC8FF", aerosols: "#C39BDB", co2: "#FFC25C",
  airquality: "#FF8A3D", perpetualocean: "#5CC8FF", atmosriver: "#86AAA8", gedi: "#86AAA8", today: "#F4EFE6",
};

function rng(seed) { // mulberry32 over a string hash
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;
const line = (x1, y1, x2, y2) => `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;

const PATTERNS = {
  // Strikes: bursts of short rays from scattered points.
  lightning(r) {
    let d = "";
    for (let i = 0; i < 9; i++) {
      const cx = 20 + r() * 160, cy = 20 + r() * 160, n = 6 + Math.floor(r() * 5), a0 = r() * Math.PI;
      for (let k = 0; k < n; k++) {
        const a = a0 + (k / n) * Math.PI * 2, r0 = 3 + r() * 3, r1 = r0 + 6 + r() * 16;
        d += line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      }
    }
    return `<path d="${d}" fill="none" stroke-width="1.6" stroke-linecap="round"/>`;
  },
  // Cities: dots of varying size on a lattice, dense clusters.
  nightlights(r) {
    const cl = Array.from({ length: 4 }, () => [r() * 200, r() * 200]);
    let out = "";
    for (let y = 10; y < 200; y += 14) for (let x = 10; x < 200; x += 14) {
      const near = Math.min(...cl.map(([cx, cy]) => Math.hypot(x - cx, y - cy)));
      const s = Math.max(0, 1 - near / 70) * (0.5 + r() * 0.5);
      if (s > 0.06) out += `<circle cx="${x}" cy="${y}" r="${f(0.8 + s * 5)}"/>`;
    }
    return out;
  },
  // Water moving: streamlines through a seeded field.
  currents(r) {
    const a = 0.02 + r() * 0.02, b = 0.02 + r() * 0.02, p = r() * 6, q = r() * 6;
    const ang = (x, y) => Math.sin(x * a * 3 + p) * 1.4 + Math.cos(y * b * 3 + q) * 1.4;
    let d = "";
    for (let i = 0; i < 26; i++) {
      let x = r() * 200, y = r() * 200;
      d += `M${f(x)} ${f(y)}`;
      for (let s = 0; s < 34; s++) { const t = ang(x, y); x += Math.cos(t) * 3.2; y += Math.sin(t) * 3.2; d += `L${f(x)} ${f(y)}`; }
    }
    return `<path d="${d}" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  },
  // Plumes: drifting layered bands.
  aerosols(r) {
    let out = "";
    for (let i = 0; i < 8; i++) {
      const y0 = 15 + i * 24, a1 = 4 + r() * 10, a2 = 2 + r() * 6, p1 = r() * 6, p2 = r() * 6;
      let d = `M0 ${f(y0)}`;
      for (let x = 4; x <= 200; x += 4) d += `L${x} ${f(y0 + Math.sin(x * 0.04 + p1) * a1 + Math.sin(x * 0.11 + p2) * a2)}`;
      out += `<path d="${d}" fill="none" stroke-width="${f(1 + r() * 3)}" stroke-opacity="${f(0.45 + r() * 0.55)}"/>`;
    }
    return out;
  },
  // Concentration: contour rings around an off-centre peak.
  co2(r) {
    const cx = 70 + r() * 60, cy = 70 + r() * 60, wob = 4 + r() * 5, ph = r() * 6;
    let out = "";
    for (let i = 1; i <= 11; i++) {
      let d = "";
      for (let k = 0; k <= 48; k++) {
        const t = (k / 48) * Math.PI * 2, rad = i * 9 + Math.sin(t * 3 + ph + i * 0.4) * wob * (i / 11);
        d += `${k ? "L" : "M"}${f(cx + Math.cos(t) * rad * 1.15)} ${f(cy + Math.sin(t) * rad)}`;
      }
      out += `<path d="${d}Z" fill="none" stroke-width="1.3"/>`;
    }
    return out;
  },
  // Four pollutant strips side by side: vertical fields of dashes.
  airquality(r) {
    let out = "";
    for (let c = 0; c < 4; c++) {
      const x0 = 8 + c * 48, dens = 0.35 + r() * 0.6;
      for (let y = 10; y < 195; y += 6) for (let x = x0; x < x0 + 40; x += 6) {
        if (r() < dens * (0.4 + 0.6 * Math.sin((y / 200) * Math.PI))) out += `<rect x="${x}" y="${y}" width="4" height="2.4"/>`;
      }
    }
    return out;
  },
  // Boundary currents: spiral eddies.
  perpetualocean(r) {
    let out = "";
    for (let i = 0; i < 3; i++) {
      const cx = 40 + i * 60 + (r() - 0.5) * 20, cy = 40 + r() * 120, turns = 3 + r() * 2, big = 24 + r() * 18, dir = r() < 0.5 ? 1 : -1;
      let d = "";
      for (let k = 0; k <= 90; k++) { const t = (k / 90) * turns * Math.PI * 2, rad = (k / 90) * big; d += `${k ? "L" : "M"}${f(cx + Math.cos(dir * t) * rad)} ${f(cy + Math.sin(dir * t) * rad)}`; }
      out += `<path d="${d}" fill="none" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    return out;
  },
  // One long ribbon across the square, with thin parallels.
  atmosriver(r) {
    const a = 14 + r() * 14, p = r() * 6;
    const y = (x, o) => 150 - x * 0.45 + Math.sin(x * 0.03 + p) * a + o;
    let top = "", bot = "";
    for (let x = 0; x <= 200; x += 4) { top += `${x ? "L" : "M"}${x} ${f(y(x, -9))}`; }
    for (let x = 200; x >= 0; x -= 4) { bot += `L${x} ${f(y(x, 9))}`; }
    let thin = "";
    for (const o of [-30, -22, 22, 30, 38]) { let d = ""; for (let x = 0; x <= 200; x += 4) d += `${x ? "L" : "M"}${x} ${f(y(x, o))}`; thin += `<path d="${d}" fill="none" stroke-width="1" stroke-opacity="0.6"/>`; }
    return `<path d="${top}${bot}Z" fill-opacity="0.85"/>${thin}`;
  },
  // Canopy height: vertical bars of varying height.
  gedi(r) {
    let out = "", h = 0.5;
    for (let i = 0; i < 20; i++) {
      h = Math.min(1, Math.max(0.15, h + (r() - 0.5) * 0.5));
      const bh = 20 + h * 150;
      out += `<rect x="${10 + i * 9.5}" y="${f(190 - bh)}" width="6.5" height="${f(bh)}"/>`;
    }
    return out;
  },
  // Satellite passes: slanted arcs with gaps.
  today(r) {
    let out = "";
    for (let i = 0; i < 9; i++) {
      const cx = -40 + i * 28, rad = 120 + r() * 60, gap = 20 + Math.floor(r() * 50);
      out += `<circle cx="${cx}" cy="${f(200 + 40)}" r="${f(rad)}" fill="none" stroke-width="1.4" stroke-dasharray="${60 + Math.floor(r() * 80)} ${gap}" stroke-dashoffset="${Math.floor(r() * 200)}"/>`;
    }
    return out;
  },
};
const FILLED = new Set(["nightlights", "airquality", "gedi", "atmosriver"]); // patterns drawn with fills, the rest with strokes

export function coverSVG(id, size = 200) {
  const draw = PATTERNS[id] || PATTERNS.today;
  const c = COLOR[id] || COLOR.today;
  const paint = FILLED.has(id) ? `fill="${c}" stroke="${c}"` : `fill="none" stroke="${c}"`;
  return `<svg class="cover" viewBox="0 0 200 200" width="${size}" height="${size}" aria-hidden="true" focusable="false">` +
    `<rect width="200" height="200" fill="${BG}"/><g ${paint}>${draw(rng(id))}</g></svg>`;
}
