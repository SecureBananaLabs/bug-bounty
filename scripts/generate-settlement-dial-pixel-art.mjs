import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const width = 128;
const height = 128;
const scale = 1;
const pixels = new Uint8Array(width * height * 4);

const palette = {
  bg0: [10, 14, 27, 255],
  bg1: [16, 23, 42, 255],
  grid: [27, 38, 59, 255],
  grid2: [34, 60, 88, 255],
  brass: [232, 181, 90, 255],
  brassDark: [152, 102, 43, 255],
  mint: [78, 227, 163, 255],
  mintDark: [24, 112, 88, 255],
  cyan: [80, 206, 235, 255],
  red: [238, 88, 102, 255],
  ink: [5, 8, 16, 255],
  ivory: [235, 240, 218, 255],
  purple: [129, 112, 255, 255],
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (y * width + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) setPixel(px, py, color);
  }
}

function line(x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function circle(cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r * r && d >= (r - 2) * (r - 2)) setPixel(cx + x, cy + y, color);
    }
  }
}

function fillCircle(cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(cx + x, cy + y, color);
    }
  }
}

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const payload = Buffer.concat([typeBytes, data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBytes.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(payload), 8 + data.length);
  return out;
}

function pngBuffer() {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = row + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width * scale, 0);
  header.writeUInt32BE(height * scale, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const checker = ((x >> 3) + (y >> 3)) % 2 === 0;
    setPixel(x, y, checker ? palette.bg0 : palette.bg1);
  }
}

for (let n = 0; n < width; n += 8) {
  line(n, 0, n, height - 1, n % 16 === 0 ? palette.grid2 : palette.grid);
  line(0, n, width - 1, n, n % 16 === 0 ? palette.grid2 : palette.grid);
}

rect(11, 99, 106, 12, palette.ink);
rect(13, 101, 102, 8, palette.grid2);
rect(18, 104, 11, 2, palette.mint);
rect(40, 104, 11, 2, palette.brass);
rect(63, 104, 11, 2, palette.purple);
rect(87, 104, 11, 2, palette.cyan);

fillCircle(64, 61, 35, palette.ink);
circle(64, 61, 35, palette.brassDark);
circle(64, 61, 29, palette.brass);
circle(64, 61, 20, palette.grid2);
fillCircle(64, 61, 6, palette.ivory);
circle(64, 61, 7, palette.brass);

for (let i = 0; i < 16; i++) {
  const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
  const x0 = Math.round(64 + Math.cos(a) * 24);
  const y0 = Math.round(61 + Math.sin(a) * 24);
  const x1 = Math.round(64 + Math.cos(a) * 31);
  const y1 = Math.round(61 + Math.sin(a) * 31);
  line(x0, y0, x1, y1, i % 4 === 0 ? palette.ivory : palette.brass);
}

line(64, 61, 82, 43, palette.mint);
line(64, 61, 48, 77, palette.red);
fillCircle(82, 43, 3, palette.mint);
fillCircle(48, 77, 3, palette.red);

const checkpoints = [
  [24, 29, palette.cyan],
  [104, 31, palette.mint],
  [100, 86, palette.brass],
  [28, 86, palette.purple],
];
for (const [x, y, color] of checkpoints) {
  rect(x - 5, y - 5, 10, 10, palette.ink);
  rect(x - 3, y - 3, 6, 6, color);
  line(x, y, 64, 61, color);
}

rect(51, 15, 26, 8, palette.ink);
rect(53, 17, 22, 4, palette.mintDark);
rect(56, 18, 4, 2, palette.mint);
rect(62, 18, 4, 2, palette.mint);
rect(68, 18, 4, 2, palette.mint);

rect(48, 92, 32, 5, palette.ink);
rect(51, 93, 26, 2, palette.ivory);
rect(56, 91, 4, 2, palette.mint);
rect(68, 91, 4, 2, palette.brass);

for (let x = 18; x < 111; x += 10) {
  setPixel(x, 116, palette.brass);
  setPixel(x + 1, 116, palette.brass);
  setPixel(x, 117, palette.brassDark);
  setPixel(x + 1, 117, palette.brassDark);
}

const output = "assets/pixel-art/settlement-dial.png";
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, pngBuffer());
console.log(`Wrote ${output} (${width}x${height})`);
