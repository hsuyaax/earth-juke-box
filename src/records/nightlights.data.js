// Analysis settings for "nightlights", kept free of imports so the browser and Node (tests, calibration) share them.
export default {
  id: "nightlights",
  clip: "clips/nightlights.mp4",
  mapArea: null, // clip is pre-cropped to one world map (left half of the EIC frame)
  grid: [128, 72],
  // Sampled from the clip at 128x72 (BUILD_PLAN T4). Dim terrain sits below v 0.10; grey land has s < 0.15.
  classes: [
    { name: "violet", label: "more light", colorRange: { h: [250, 345], s: [0.15, 1], v: [0.1, 1] }, soundFamily: "pluckA", kind: "sustained" },
    { name: "orange", label: "less light", colorRange: { h: [350, 32], s: [0.25, 1], v: [0.1, 1] }, soundFamily: "pluckB", kind: "sustained",
      // Orange-hued city lights (h 20-32) also occur in the yearly series; measured: violet appears only on the change map,
      // so orange counts as "less light" only while violet is on screen. Otherwise these cells fall through to "light".
      requires: { cls: "violet", minFrac: 0.005 } },
    { name: "light", label: "city lights", colorRange: { h: [32, 70], s: [0.15, 1], v: [0.1, 1] }, soundFamily: "pluckA", kind: "sustained" },
    { name: "light", label: "city lights", colorRange: { s: [0, 0.15], v: [0.3, 1] }, soundFamily: "pluckA", kind: "sustained" },
  ],
};
