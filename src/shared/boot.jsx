import { createRoot } from "react-dom/client";
// Self-hosted fonts (no runtime calls to font CDNs, AGENTS.md section 18).
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "../tokens.css";
import "../sleeve/sleeve.css"; // shared paper surface: header, display type, vinyl footer

// Boot for the two reading pages (sleeve and liner notes): line reveals and smooth scroll, never under reduced motion.
export function boot(App) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) document.documentElement.classList.add("js-reveal");
  createRoot(document.getElementById("root")).render(<App />);
  // Lenis smooths native scroll on these two pages only; it does not replace it.
  if (!reduced) import("lenis").then(({ default: Lenis }) => new Lenis({ autoRaf: true, anchors: true }));
}
