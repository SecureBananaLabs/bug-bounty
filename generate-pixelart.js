// Generate a 128x128 pixel art PNG - retro security vault theme
// Pure Node.js, no dependencies

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 128, H = 128;

// Create pixel buffer (RGB)
const pixels = Buffer.alloc(W * H * 3);

function setPixel(x, y, r, g, b) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const idx = (y * W + x) * 3;
  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
}

function getPixel(x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return [0, 0, 0];
  const idx = (y * W + x) * 3;
  return [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
}

// Dark background gradient
for (let y = 0; y < H; y++) {
  const r = Math.floor(10 + (y / H) * 20);
  const g = Math.floor(15 + (y / H) * 30);
  const b = Math.floor(25 + (y / H) * 40);
  for (let x = 0; x < W; x++) {
    setPixel(x, y, r, g, b);
  }
}

const cx = 64, cy = 64;

// Vault door - circular rings
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist >= 38 && dist <= 42) {
      setPixel(x, y, 80, 80, 100);
    } else if (dist >= 35 && dist < 38) {
      setPixel(x, y, 60, 60, 80);
    } else if (dist < 35) {
      setPixel(x, y, 30, 30, 45);
    }
  }
}

// Vault spokes (4 directions)
for (let i = 0; i < 4; i++) {
  const rad = (i * 90) * Math.PI / 180;
  for (let r = 5; r < 33; r++) {
    const px = Math.round(cx + r * Math.cos(rad));
    const py = Math.round(cy + r * Math.sin(rad));
    setPixel(px, py, 100, 100, 120);
    // Add thickness
    for (let off = -1; off <= 1; off++) {
      const px2 = Math.round(cx + r * Math.cos(rad) + off * Math.sin(rad));
      const py2 = Math.round(cy + r * Math.sin(rad) - off * Math.cos(rad));
      setPixel(px2, py2, 90, 90, 110);
    }
  }
}

// Center lock - golden
for (let y = 58; y < 71; y++) {
  for (let x = 58; x < 71; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 6) {
      setPixel(x, y, 200, 170, 50);
    } else if (dist <= 7) {
      setPixel(x, y, 160, 130, 30);
    }
  }
}

// Keyhole
for (let y = 62; y < 67; y++) {
  for (let x = 62; x < 67; x++) {
    setPixel(x, y, 20, 15, 5);
  }
}

// Neon green accent pixels - top (matrix-style)
let seed = 42;
function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

for (let i = 0; i < 50; i++) {
  const x = Math.floor(rand() * W);
  const y = Math.floor(rand() * 20);
  const p = getPixel(x, y);
  if (p[0] < 20) {
    setPixel(x, y, 0, Math.floor(150 + rand() * 105), 0);
  }
}

// Bottom corner - red pixels
for (let i = 0; i < 30; i++) {
  const x = Math.floor(rand() * W);
  const y = H - 1 - Math.floor(rand() * 20);
  const p = getPixel(x, y);
  if (p[0] < 30) {
    setPixel(x, y, Math.floor(150 + rand() * 105), 0, 0);
  }
}

// Border frame
for (let i = 0; i < W; i++) {
  setPixel(i, 0, 40, 40, 60);
  setPixel(i, H - 1, 40, 40, 60);
}
for (let i = 0; i < H; i++) {
  setPixel(0, i, 40, 40, 60);
  setPixel(W - 1, i, 40, 40, 60);
}

// Encode as PNG
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// PNG signature
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // color type (RGB)
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

// IDAT - raw pixel data with filter byte per row
const raw = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0; // filter: none
  pixels.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
}
const idat = zlib.deflateSync(raw);

// IEND
const iend = Buffer.alloc(0);

const png = Buffer.concat([
  sig,
  makeChunk("IHDR", ihdr),
  makeChunk("IDAT", idat),
  makeChunk("IEND", iend),
]);

const outDir = path.join(__dirname, "assets", "pixel-art");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "security-vault.png");
fs.writeFileSync(outFile, png);
console.log(`Saved ${outFile} (${png.length} bytes, ${W}x${H})`);
