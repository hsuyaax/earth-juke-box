// Ambient glow behind the jukebox stage (DESIGN_PASS_2 3.5). No second video: it reads the colors the engine already
// computes (HSV of each cell's mean color) and paints the mean color of the left, centre and right thirds of the grid as
// three large soft gradients. At most 4 updates a second, eased, so it drifts and never flickers. Never touches the engine.
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}

export function createGlow(deck, state) {
  const cur = [[13, 27, 61], [13, 27, 61], [13, 27, 61]]; // start at the night blue
  setInterval(() => {
    if (document.hidden || !state.ready || !state.v) return;
    const { W, H, v, h, s } = state;
    for (let t = 0; t < 3; t++) {
      const x0 = Math.floor((t * W) / 3), x1 = Math.floor(((t + 1) * W) / 3);
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) { const i = y * W + x; const c = hsvToRgb(h[i], s[i], v[i]); r += c[0]; g += c[1]; b += c[2]; n++; }
      r /= n; g /= n; b /= n;
      // NASA frames are dark on average; keep the hue but lift it to a fixed glow brightness.
      const lift = 0.62 / Math.max(r, g, b, 0.05);
      const target = [r * lift * 255, g * lift * 255, b * lift * 255];
      for (let k = 0; k < 3; k++) cur[t][k] += 0.35 * (target[k] - cur[t][k]); // ease toward the new color
      deck.style.setProperty(`--g${t + 1}`, `rgb(${cur[t].map(Math.round).join(" ")})`);
    }
  }, 250);
  return {
    setInk(color) { deck.style.setProperty("--ink", color); },
    breathe() { // on each bar line while playing: a few percent brighter, then back
      if (reduced.matches) return;
      deck.classList.add("breathe");
      setTimeout(() => deck.classList.remove("breathe"), 260);
    },
  };
}
