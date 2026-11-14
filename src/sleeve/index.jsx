import { createRoot } from "react-dom/client";
// Self-hosted fonts (no runtime calls to font CDNs, AGENTS.md section 18).
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "../tokens.css";
import "./sleeve.css";
import App from "./App.jsx";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) document.documentElement.classList.add("js-reveal"); // line reveals exist only when motion is welcome

createRoot(document.getElementById("root")).render(<App />);

// Smooth scrolling on this page only, and never under reduced motion. Lenis smooths native scroll; it does not replace it.
if (!reduced) import("lenis").then(({ default: Lenis }) => new Lenis({ autoRaf: true, anchors: true }));
