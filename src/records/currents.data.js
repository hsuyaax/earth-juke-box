// Analysis settings for "currents", kept free of imports so the browser and Node (tests, calibration) share them.
export default {
  id: "currents",
  clip: "clips/currents.mp4",
  mapArea: null, // full frame is the 2:1 world map
  grid: [96, 48],
  // Colorbar: blue 0 °C, green 10–20 °C, yellow ~25 °C, red 32 °C. Sampled: land is grey (s < 0.15), water s > 0.6.
  classes: [
    { name: "warm", label: "warm water", colorRange: { h: [345, 70], s: [0.4, 1], v: [0.04, 1] }, soundFamily: "warm", kind: "sustained" },
    { name: "cold", label: "cold water", colorRange: { h: [70, 250], s: [0.4, 1], v: [0.04, 1] }, soundFamily: "cold", kind: "sustained" },
  ],
};
