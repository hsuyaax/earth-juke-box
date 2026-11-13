// Self-check for encodeWav: extract the function source from audio.js (it has no Tone deps) and run it.
import fs from "fs";
const src = fs.readFileSync(new URL("../src/audio.js", import.meta.url), "utf8");
const body = src.slice(src.indexOf("export function encodeWav"));
const encodeWav = new Function(body.replace("export ", "") + "; return encodeWav;")();
const fake = { numberOfChannels: 2, length: 3, sampleRate: 48000, getChannelData: (c) => (c ? [0, -1, 2] : [1, 0.5, -0.5]) };
const buf = Buffer.from(await encodeWav(fake).arrayBuffer());
const assert = (c, m) => { if (!c) throw new Error(m); };
assert(buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 16) === "WAVEfmt ", "header");
assert(buf.length === 44 + 3 * 2 * 2, "size");
assert(buf.readUInt32LE(24) === 48000 && buf.readUInt16LE(22) === 2, "rate/channels");
assert(buf.readInt16LE(44) === 32767 && buf.readInt16LE(46) === 0, "frame0 L=1 R=0");
assert(buf.readInt16LE(50) === -32768, "frame1 R=-1");
assert(buf.readInt16LE(54) === 32767, "frame2 R=2 clamps to 1");
console.log("wav ok");
