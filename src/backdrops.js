// Moving NASA backdrops (DESIGN_PASS_2 section 3): one controller for every backdrop on a page.
// - A backdrop's video loads only when it is near the viewport, and only the most visible one plays: at most one at a time.
// - Reduced motion or Save-Data: no backdrop video is ever loaded; posters only.
// - "Pause motion" stops every backdrop and holds its poster (the source is dropped, so the poster shows again).
//   The choice is kept for the browser session.
// - While the landing hero plays with sound, every backdrop pauses.
// Backdrops are decorative: the wrappers are aria-hidden and the videos muted, unfocusable, preload="none".
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const stillsOnly = reduced || !!navigator.connection?.saveData;

const KEY = "ej-motion-paused";
let paused = false;
try { paused = sessionStorage.getItem(KEY) === "1"; } catch { /* storage blocked: start unpaused */ }
let heroSound = false;
const items = new Set();
const listeners = new Set();

const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
  for (const e of entries) { const it = e.target.__bd; if (it) it.ratio = e.isIntersecting ? e.intersectionRatio : 0; }
  update();
}, { rootMargin: "120px 0px", threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1] });

function update() {
  let best = null;
  for (const it of items) if (it.ratio > 0 && (!best || it.ratio > best.ratio)) best = it;
  for (const it of items) {
    it.el.classList.toggle("bd-in", it.ratio > 0.05); // arrives with its section
    it.el.classList.toggle("bd-active", it === best); // the only one at full strength
    const play = it === best && !paused && !heroSound && !stillsOnly && !document.hidden;
    if (play) {
      if (!it.video.getAttribute("src")) it.video.src = it.src;
      it.video.playbackRate = it.rate;
      it.video.play().catch(() => {});
    } else if (paused && it.video.getAttribute("src")) {
      it.video.removeAttribute("src"); it.video.load(); // back to the poster
    } else it.video.pause();
  }
}
document.addEventListener("visibilitychange", update);

export function register(el, video, src, { rate = 1 } = {}) {
  const it = { el, video, src, rate, ratio: 0 };
  el.__bd = it; items.add(it); io?.observe(el);
  return {
    // Swap to another clip with a short crossfade (the records band follows the record in focus).
    setSource(nextSrc, poster) {
      if (nextSrc === it.src) return;
      el.classList.add("bd-swap");
      setTimeout(() => {
        it.src = nextSrc; video.poster = poster;
        if (video.getAttribute("src")) { video.src = nextSrc; }
        update();
        el.classList.remove("bd-swap");
      }, 300);
    },
    unregister() { io?.unobserve(el); items.delete(it); },
  };
}
export const isPaused = () => paused;
export function setPaused(p) {
  paused = p;
  try { sessionStorage.setItem(KEY, p ? "1" : "0"); } catch { /* not remembered: fine */ }
  update(); listeners.forEach((fn) => fn(p));
}
export function onPausedChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setHeroSound(on) { heroSound = on; update(); }
