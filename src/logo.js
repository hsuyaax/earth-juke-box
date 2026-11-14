// The Earth Jukebox disc: outer ring, three grooves, amber label. Static markup, shared by every surface.
// (The animated beat ring is added on the record page only; see DESIGN.md section 9.)
export function logoSVG(size = 32) {
  return `<svg class="logo-disc" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">` +
    `<circle cx="16" cy="16" r="15" fill="#081229" stroke="#5A6A99" stroke-width="1"/>` +
    `<circle cx="16" cy="16" r="12" fill="none" stroke="#5A6A99" stroke-width="0.8"/>` +
    `<circle cx="16" cy="16" r="9.5" fill="none" stroke="#5A6A99" stroke-width="0.8"/>` +
    `<circle cx="16" cy="16" r="7" fill="none" stroke="#5A6A99" stroke-width="0.8"/>` +
    `<circle cx="16" cy="16" r="4.5" fill="#FFC25C"/>` +
    `<circle cx="16" cy="16" r="1" fill="#081229"/></svg>`;
}

// One ring out of the label per beat. Only called from the record page's beat clock; skipped under reduced motion,
// where the static disc above is the logo. Purely visual: it touches no audio.
const still = matchMedia("(prefers-reduced-motion: reduce)");
export function pulseLogo(el) {
  const svg = el?.firstElementChild;
  if (!svg || still.matches || document.hidden || !svg.animate) return;
  const NS = "http://www.w3.org/2000/svg";
  const ring = document.createElementNS(NS, "circle");
  ring.setAttribute("cx", "16"); ring.setAttribute("cy", "16"); ring.setAttribute("r", "14.5");
  ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "#FFC25C"); ring.setAttribute("stroke-width", "1.6");
  ring.style.transformBox = "fill-box"; ring.style.transformOrigin = "center";
  svg.append(ring);
  const a = ring.animate([{ transform: "scale(0.3)", opacity: 0.9 }, { transform: "scale(1)", opacity: 0 }], { duration: 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
  a.onfinish = () => ring.remove();
}
