// Analysis settings for "aerosols", kept free of imports so the browser and Node (tests, calibration) share them.
export default {
  id: "aerosols",
  clip: "clips/aerosols.mp4",
  mapArea: null, // full frame is a 2:1 world map, -180..180
  lonlat: true,
  grid: [96, 48],
  // Colorbar: black carbon red-orange, dust lavender, sea salt grey-teal, sulfate green (sulfate has no voice in §8).
  // Sampled at 96x48: the pale bright plumes carry the color; dark teal ocean swirls (v < 0.35) are background.
  classes: [
    { name: "dust", label: "dust", colorRange: { h: [245, 300], s: [0.12, 0.5], v: [0.35, 1] }, soundFamily: "dust", kind: "sustained" },
    { name: "smoke", label: "smoke", colorRange: { h: [345, 35], s: [0.4, 1], v: [0.25, 1] }, soundFamily: "smoke", kind: "sustained" },
    { name: "salt", label: "sea salt", colorRange: { h: [150, 210], s: [0.12, 0.42], v: [0.35, 1] }, soundFamily: "salt", kind: "sustained" },
  ],
};
