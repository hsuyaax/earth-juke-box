import { useEffect, useRef, useState } from "react";
import { register, isPaused, setPaused, onPausedChange, stillsOnly } from "../backdrops.js";

/* A moving NASA backdrop. mode "print": a duotone of the record's ink on paper. mode "light": full color, dimmed, on dark.
   Decorative: aria-hidden, muted, not focusable, preload none, with a poster. The controller decides when it may play. */
export function Backdrop({ name, mode = "print", ink, rate = 1, className = "" }) {
  const box = useRef(null), vid = useRef(null), handle = useRef(null);
  useEffect(() => {
    handle.current = register(box.current, vid.current, `bg/${name}.mp4`, { rate });
    return () => handle.current.unregister();
  }, []);
  useEffect(() => { handle.current?.setSource(`bg/${name}.mp4`, `bg/${name}.jpg`); }, [name]);
  return (
    <div ref={box} className={`bd bd-${mode} ${className}`} style={ink ? { "--ink": ink } : undefined} aria-hidden="true">
      <video ref={vid} muted playsInline loop preload="none" poster={`bg/${name}.jpg`} tabIndex={-1} />
    </div>
  );
}

/* "Pause motion": stops every backdrop on the page and holds its poster. Not shown when nothing would move anyway. */
export function MotionToggle() {
  const [paused, set] = useState(isPaused());
  useEffect(() => onPausedChange(set), []);
  if (stillsOnly) return null;
  return (
    <button type="button" className="motion-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)}>
      Pause motion
    </button>
  );
}
