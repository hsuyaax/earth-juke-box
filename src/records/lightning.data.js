// Analysis settings for "lightning", kept free of imports so the browser and Node (tests, calibration) share them.
export default {
  id: "lightning",
  clip: "clips/lightning.mp4", // flat world map version (iss_lightning_sos_yearly), full 100 s
  mapArea: null, // full frame is the 2:1 world map
  grid: [96, 48],
  // Lightning dots sampled at 96x48: hue 40-70, s > 0.4. Grey land and dark ocean never match.
  classes: [
    { name: "flash", label: "lightning", colorRange: { h: [38, 72], s: [0.35, 1], v: [0.12, 1] }, soundFamily: "crack", kind: "event" },
  ],
  // Jump = brightest-pixel luma above the cell's running average. 0.25 via tools/engine_run.mjs on the full clip:
  // quiet start ~2 flashes/s, busy ~14/s, 16% of beats reach the 6-hit cap (0.15 would cap 77%).
  flash: { jump: 0.25, minV: 0.12, full: 0.5, cooldown: 8, avgRate: 0.1, cls: "flash" },
};
