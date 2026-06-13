import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const width = 128;
const height = 128;
const out = "assets/pixel-art/proof-gate-console.png";

const palette = {
  bg0: [15, 23, 42, 255],
  bg1: [30, 41, 59, 255],
  grid: [51, 65, 85, 255],
  frame: [71, 85, 105, 255],
  frameLight: [148, 163, 184, 255],
  panel: [17, 24, 39, 255],
  panel2: [30, 64, 175, 255],
  teal: [45, 212, 191, 255],
  cyan: [34, 211, 238, 255],
  green: [74, 222, 128, 255],
  amber: [251, 191, 36, 255],
  orange: [249, 115, 22, 255],
  red: [248, 113, 113, 255],
  white: [226, 232, 240, 255],
  banana: [250, 204, 21, 255],
  bananaDark: [180, 83, 9, 255],
  shadow: [2, 6, 23, 255]
};

const pixels = new Uint8Array(width * height * 4);

function put(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  pixels.set(color, (y * width + x) * 4);
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) put(xx, yy, color);
  }
}

function line(x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  while (true) {
    put(x, y, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function writePng() {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    for (let x = 0; x < width * 4; x++) {
      scanlines[rowStart + 1 + x] = pixels[y * width * 4 + x];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  writeFileSync(out, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]));
}

rect(0, 0, width, height, palette.bg0);
for (let y = 0; y < height; y += 8) line(0, y, width - 1, y, palette.bg1);
for (let x = 0; x < width; x += 8) line(x, 0, x, height - 1, palette.bg1);

rect(12, 84, 104, 20, palette.shadow);
rect(16, 18, 96, 78, palette.frame);
rect(20, 22, 88, 70, palette.panel);
rect(24, 26, 80, 46, palette.bg0);
rect(28, 30, 72, 38, palette.panel2);

rect(32, 36, 16, 10, palette.cyan);
rect(56, 36, 16, 10, palette.green);
rect(80, 36, 16, 10, palette.amber);
rect(32, 54, 16, 6, palette.green);
rect(56, 54, 16, 6, palette.cyan);
rect(80, 54, 16, 6, palette.orange);

line(48, 41, 56, 41, palette.white);
line(72, 41, 80, 41, palette.white);
line(48, 57, 56, 57, palette.white);
line(72, 57, 80, 57, palette.white);

rect(30, 76, 68, 10, palette.frameLight);
rect(34, 78, 8, 4, palette.teal);
rect(46, 78, 8, 4, palette.green);
rect(58, 78, 8, 4, palette.amber);
rect(70, 78, 8, 4, palette.orange);
rect(82, 78, 8, 4, palette.red);

rect(45, 94, 38, 10, palette.frame);
rect(38, 104, 52, 8, palette.frameLight);
rect(34, 112, 60, 4, palette.shadow);

rect(50, 102, 28, 3, palette.bananaDark);
rect(48, 98, 6, 6, palette.banana);
rect(54, 96, 18, 8, palette.banana);
rect(72, 98, 6, 6, palette.banana);
rect(56, 100, 14, 2, palette.white);

line(24, 116, 104, 116, palette.teal);
line(24, 118, 104, 118, palette.cyan);
rect(22, 112, 8, 8, palette.green);
rect(50, 112, 8, 8, palette.amber);
rect(78, 112, 8, 8, palette.green);
rect(100, 112, 8, 8, palette.amber);

writePng();
