/**
 * Generates the pixel art PNG file and saves it to assets/pixel-art/
 * This fulfills the issue #80 acceptance criteria.
 */
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const OUT_DIR = `${ROOT}/assets/pixel-art`;

// PICO-8 palette
const palette: number[][] = [
  [0x00, 0x00, 0x00], [0x1d, 0x2b, 0x53], [0x7e, 0x25, 0x53],
  [0x00, 0x87, 0x51], [0xab, 0x52, 0x36], [0x5f, 0x57, 0x4f],
  [0xc2, 0xc3, 0xc7], [0xff, 0xf1, 0xe8], [0xff, 0x00, 0x4d],
  [0xff, 0xa3, 0x00], [0xff, 0xec, 0x27], [0x00, 0xe4, 0x36],
  [0x29, 0xad, 0xff], [0x83, 0x76, 0x9c], [0xff, 0x77, 0xa8],
  [0xff, 0xcc, 0xaa],
];

const w = 64;
const h = 64;

// Seeded RNG
function createRNG(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  s = Math.abs(s) + 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const rand = createRNG("SecureBanana-pixel-art-v1");
const pixels = new Uint8Array(w * h * 4);
const cx = w >> 1;
const cy = h >> 1;

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let ci = 0;

    // Shield / emblem pattern: circular center, ground, stars
    if (dist < 8) ci = 6;           // light grey core
    else if (dist < 14) ci = 3;     // green ring
    else if (dist < 18) ci = 9;     // orange accent ring
    else if (y > h * 0.72) ci = 7;  // light ground
    else if (y > h * 0.66) ci = 4;  // brown ground line
    else if (rand() > 0.97) ci = 1; // dark blue star
    else if (rand() > 0.95) ci = 2; // magenta sparkle
    else if (rand() > 0.93) ci = 10; // yellow star
    else ci = 0;                     // black sky

    const idx = (y * w + x) * 4;
    pixels[idx] = palette[ci][0];
    pixels[idx + 1] = palette[ci][1];
    pixels[idx + 2] = palette[ci][2];
    pixels[idx + 3] = 255;
  }
}

function buildPNG(pixels: Uint8Array, w: number, h: number): Buffer {
  const raw = new Uint8Array(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    const rowStart = y * w * 4;
    const scanStart = y * (1 + w * 4) + 1;
    for (let x = 0; x < w * 4; x++) raw[scanStart + x] = pixels[rowStart + x];
  }
  const compressed = zlib.deflateSync(raw);

  const u32 = (v: number) => {
    const b = new Uint8Array(4);
    b[0] = (v >>> 24) & 0xff; b[1] = (v >>> 16) & 0xff;
    b[2] = (v >>> 8) & 0xff; b[3] = v & 0xff;
    return b;
  };
  const crc = (d: Uint8Array) => {
    let c = 0xffffffff;
    for (let i = 0; i < d.length; i++) { c ^= d[i]; for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; }
    return u32(~c >>> 0);
  };

  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrBody = new Uint8Array(13);
  ihdrBody.set(u32(w), 0); ihdrBody.set(u32(h), 4);
  ihdrBody[8] = 8; ihdrBody[9] = 6;
  const ihdrP = new Uint8Array([...new TextEncoder().encode("IHDR"), ...ihdrBody]);
  const ihdr = new Uint8Array([...u32(13), ...ihdrP, ...crc(ihdrP)]);
  const idatP = new Uint8Array([...new TextEncoder().encode("IDAT"), ...compressed]);
  const idat = new Uint8Array([...u32(compressed.length), ...idatP, ...crc(idatP)]);
  const iendP = new TextEncoder().encode("IEND");
  const iend = new Uint8Array([...u32(0), ...iendP, ...crc(iendP)]);

  const out = new Uint8Array(sig.length + ihdr.length + idat.length + iend.length);
  let off = 0;
  out.set(sig, off); off += sig.length;
  out.set(ihdr, off); off += ihdr.length;
  out.set(idat, off); off += idat.length;
  out.set(iend, off);
  return Buffer.from(out);
}

const png = buildPNG(pixels, w, h);
mkdirSync(OUT_DIR, { recursive: true });
const outPath = `${OUT_DIR}/secure-banana-shield.png`;
writeFileSync(outPath, png);
console.log(`✅ Pixel art saved to ${outPath}`);
console.log(`   Size: ${png.length} bytes (${w}x${h})`);
console.log(`   SHA256: ${require("crypto").createHash("sha256").update(png).digest("hex")}`);
