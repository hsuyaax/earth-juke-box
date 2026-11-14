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
