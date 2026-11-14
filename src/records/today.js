// "Earth Today": yesterday's global true-color image from NASA GIBS, through the same engine (AGENTS.md §14).
// The image is CORS-enabled, drawn to a canvas, and streamed into the <video> so analysis reads it like any clip.
import { bside } from "./bside.js";

const LAYER = "MODIS_Terra_CorrectedReflectance_TrueColor"; // VIIRS returned blank tiles in testing; MODIS works
const url = (date) =>
  "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0" +
  `&LAYERS=${LAYER}&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=1280&HEIGHT=640&FORMAT=image/jpeg&TIME=${date}`;

function loadImage(src) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });
}

const today = bside({
  id: "today", title: "Earth Today (live)", blurb: "Yesterday's whole planet from the Terra satellite.",
  svs: null, credit: "NASA Worldview / GIBS, MODIS on Terra", clip: null, lonlat: true, grid: [96, 48],
  shows: "The whole Earth as seen by the MODIS camera on NASA's Terra satellite, stitched from yesterday's passes. The dark diagonal gaps are places the satellite did not see. Fetched live from NASA GIBS.",
});
today.link = "https://worldview.earthdata.nasa.gov/";
const BASE_SHOWS = today.notes.shows;
let cached = null; // load once per page; the stream keeps running

// Tries yesterday, then up to 3 earlier days. Resolves to { stream, date }.
today.live = async () => {
  if (cached) return cached;
  let img, date;
  for (let n = 1; n <= 4 && !img; n++) {
    date = new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
    try { const i = await loadImage(url(date)); if (i.naturalWidth >= 1000) img = i; } catch { /* try an earlier day */ }
  }
  if (!img) throw new Error("NASA GIBS image unavailable");
  const c = document.createElement("canvas");
  c.width = 1280; c.height = 640;
  const g = c.getContext("2d");
  const paint = () => g.drawImage(img, 0, 0, 1280, 640);
  paint();
  const stream = c.captureStream(5);
  setInterval(() => { if (today.active) paint(); }, 500); // keep frames flowing only while on screen
  today.notes.shows = `${BASE_SHOWS} Image date: ${date}.`;
  return (cached = { stream, date });
};

export default today;
