import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const width = 128;
const height = 128;
const pixels = new Uint8Array(width * height * 4);

const palette = {
  night: [14, 18, 38, 255],
  wall: [28, 35, 70, 255],
  wallLight: [42, 54, 98, 255],
  floor: [19, 24, 46, 255],
  grid: [45, 55, 88, 255],
  console: [32, 45, 74, 255],
  consoleDark: [18, 26, 45, 255],
  outline: [8, 12, 24, 255],
  banana: [246, 196, 65, 255],
  amber: [235, 146, 49, 255],
  mint: [91, 220, 170, 255],
  cyan: [77, 185, 237, 255],
  red: [226, 80, 85, 255],
  white: [232, 239, 244, 255],
  dim: [111, 126, 159, 255],
  shadow: [6, 8, 18, 255]
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = (y * width + x) * 4;
  pixels.set(color, offset);
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function line(x1, y1, x2, y2, color) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1;
  let y = y1;

  while (true) {
    setPixel(x, y, color);
    if (x === x2 && y === y2) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function frame(x, y, w, h, color) {
  rect(x, y, w, 1, color);
  rect(x, y + h - 1, w, 1, color);
  rect(x, y, 1, h, color);
  rect(x + w - 1, y, 1, h, color);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

rect(0, 0, width, height, palette.night);
rect(0, 62, width, 66, palette.floor);

for (let y = 8; y < 60; y += 8) line(0, y, width - 1, y, palette.wall);
for (let x = 6; x < width; x += 11) line(x, 0, x - 10, 60, palette.wall);
for (let y = 72; y < height; y += 9) line(0, y, width - 1, y, palette.grid);
for (let x = 2; x < width; x += 14) line(x, 62, x - 40, height - 1, palette.grid);
for (let x = 12; x < width; x += 14) line(x, 62, x + 32, height - 1, palette.grid);

rect(17, 21, 94, 43, palette.outline);
rect(19, 23, 90, 39, palette.wallLight);
rect(23, 27, 20, 12, palette.consoleDark);
rect(53, 27, 20, 12, palette.consoleDark);
rect(83, 27, 20, 12, palette.consoleDark);
frame(23, 27, 20, 12, palette.cyan);
frame(53, 27, 20, 12, palette.mint);
frame(83, 27, 20, 12, palette.banana);

line(29, 33, 35, 33, palette.white);
line(31, 31, 33, 35, palette.cyan);
line(59, 35, 63, 30, palette.mint);
line(63, 30, 69, 36, palette.mint);
line(88, 33, 98, 33, palette.banana);
line(94, 29, 98, 33, palette.banana);
line(94, 37, 98, 33, palette.banana);

rect(26, 46, 76, 12, palette.consoleDark);
for (let x = 30; x <= 96; x += 8) {
  rect(x, 49, 4, 3, x % 16 === 0 ? palette.banana : palette.mint);
}

rect(26, 69, 76, 35, palette.outline);
rect(29, 70, 70, 30, palette.console);
rect(36, 77, 56, 14, palette.consoleDark);
frame(36, 77, 56, 14, palette.cyan);
rect(44, 82, 8, 4, palette.banana);
rect(56, 82, 8, 4, palette.mint);
rect(68, 82, 8, 4, palette.amber);
rect(80, 82, 4, 4, palette.red);
rect(34, 96, 10, 5, palette.dim);
rect(49, 96, 10, 5, palette.mint);
rect(64, 96, 10, 5, palette.banana);
rect(79, 96, 10, 5, palette.cyan);

for (let i = 0; i < 5; i += 1) {
  const x = 17 + i * 23;
  const y = 111;
  rect(x, y, 12, 8, palette.shadow);
  rect(x + 1, y - 1, 10, 8, [palette.cyan, palette.mint, palette.banana, palette.amber, palette.red][i]);
  rect(x + 4, y + 2, 4, 2, palette.white);
}

line(23, 111, 39, 91, palette.cyan);
line(46, 110, 55, 91, palette.mint);
line(69, 110, 67, 91, palette.banana);
line(92, 110, 80, 91, palette.amber);
line(115, 110, 91, 91, palette.red);

for (let i = 0; i < 40; i += 1) {
  const x = (i * 37 + 11) % width;
  const y = (i * 19 + 7) % 58;
  setPixel(x, y, i % 4 === 0 ? palette.banana : palette.dim);
}

const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y += 1) {
  const rowOffset = y * (width * 4 + 1);
  raw[rowOffset] = 0;
  raw.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), rowOffset + 1);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0))
]);

writeFileSync(new URL("./bounty-signal-room.png", import.meta.url), png);
