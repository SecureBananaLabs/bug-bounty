#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, "..", "assets", "pixel-art", "audit-sundial.png");

const width = 128;
const height = 128;
const pixels = new Uint8Array(width * height * 4);

const colors = {
  bg: [7, 10, 22, 255],
  bg2: [11, 17, 33, 255],
  grid: [22, 35, 55, 255],
  gridSoft: [15, 25, 42, 255],
  brassDark: [126, 77, 35, 255],
  brass: [211, 148, 64, 255],
  brassLight: [255, 202, 104, 255],
  cyanDark: [25, 128, 150, 255],
  cyan: [62, 218, 226, 255],
  mint: [105, 242, 170, 255],
  pink: [238, 92, 151, 255],
  blue: [70, 107, 246, 255],
  white: [232, 245, 255, 255],
  shadow: [3, 6, 14, 255],
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
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      setPixel(px, py, color);
    }
  }
}

function line(x0, y0, x1, y1, color, thickness = 1) {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    rect(x0 - Math.floor(thickness / 2), y0 - Math.floor(thickness / 2), thickness, thickness, color);
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

function circle(cx, cy, radius, color) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) setPixel(cx + x, cy + y, color);
    }
  }
}

function ring(cx, cy, radius, thickness, color) {
  const inner = radius - thickness;
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      const d = x * x + y * y;
      if (d <= radius * radius && d >= inner * inner) setPixel(cx + x, cy + y, color);
    }
  }
}

function diamond(cx, cy, radius, color) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (Math.abs(x) + Math.abs(y) <= radius) setPixel(cx + x, cy + y, color);
    }
  }
}

function checkerRect(x, y, w, h, a, b) {
  for (let py = y; py < y + h; py += 4) {
    for (let px = x; px < x + w; px += 4) {
      rect(px, py, 4, 4, ((px + py) / 4) % 2 === 0 ? a : b);
    }
  }
}

function writeChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writePng(path) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width * 4; x += 1) {
      raw[rowStart + 1 + x] = pixels[y * width * 4 + x];
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

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    signature,
    writeChunk("IHDR", ihdr),
    writeChunk("IDAT", deflateSync(raw, { level: 9 })),
    writeChunk("IEND", Buffer.alloc(0)),
  ]);

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
}

checkerRect(0, 0, width, height, colors.bg, colors.bg2);

for (let x = 8; x < width; x += 16) line(x, 0, x, height - 1, colors.gridSoft);
for (let y = 8; y < height; y += 16) line(0, y, width - 1, y, colors.gridSoft);
for (let x = 16; x < width; x += 32) line(x, 2, x, height - 4, colors.grid);
for (let y = 16; y < height; y += 32) line(2, y, width - 4, y, colors.grid);

rect(10, 10, 108, 4, colors.grid);
rect(10, 114, 108, 4, colors.grid);
rect(10, 10, 4, 108, colors.grid);
rect(114, 10, 4, 108, colors.grid);
rect(14, 14, 100, 2, colors.cyanDark);
rect(14, 112, 100, 2, colors.cyanDark);

for (const [x, y, color] of [
  [23, 26, colors.white],
  [37, 20, colors.cyan],
  [94, 24, colors.mint],
  [103, 38, colors.pink],
  [22, 89, colors.blue],
  [99, 96, colors.white],
]) {
  rect(x, y, 2, 2, color);
}

rect(23, 91, 82, 12, colors.shadow);
rect(25, 89, 78, 12, colors.grid);
rect(29, 92, 10, 4, colors.cyanDark);
rect(43, 92, 18, 4, colors.blue);
rect(66, 92, 8, 4, colors.pink);
rect(78, 92, 17, 4, colors.mint);
rect(31, 98, 15, 3, colors.brassDark);
rect(50, 98, 27, 3, colors.cyanDark);
rect(81, 98, 12, 3, colors.blue);

circle(64, 68, 28, colors.shadow);
circle(64, 65, 28, colors.brassDark);
circle(64, 65, 23, colors.brass);
ring(64, 65, 29, 3, colors.brassLight);
ring(64, 65, 19, 2, colors.brassLight);
rect(36, 65, 56, 4, colors.brassLight);
rect(62, 37, 4, 56, colors.brassLight);

line(64, 65, 80, 41, colors.shadow, 7);
line(64, 65, 78, 39, colors.brassLight, 5);
line(64, 65, 87, 58, colors.cyan, 2);
line(64, 65, 35, 48, colors.cyan, 2);
line(64, 65, 97, 78, colors.cyan, 2);

diamond(80, 39, 4, colors.white);
diamond(35, 48, 4, colors.mint);
diamond(97, 78, 4, colors.pink);

rect(82, 31, 18, 12, colors.grid);
rect(84, 33, 14, 8, colors.bg);
line(86, 37, 90, 40, colors.mint, 2);
line(90, 40, 97, 34, colors.mint, 2);

rect(23, 39, 18, 12, colors.grid);
rect(25, 41, 14, 8, colors.bg);
line(27, 45, 31, 48, colors.cyan, 2);
line(31, 48, 38, 42, colors.cyan, 2);

rect(91, 82, 18, 12, colors.grid);
rect(93, 84, 14, 8, colors.bg);
line(95, 88, 99, 91, colors.pink, 2);
line(99, 91, 106, 85, colors.pink, 2);

for (let i = 0; i < 6; i += 1) {
  rect(50 + i * 5, 58 + (i % 2), 3, 3, i % 2 === 0 ? colors.blue : colors.cyan);
}

rect(56, 72, 16, 5, colors.brassLight);
rect(60, 77, 8, 5, colors.brassDark);
rect(61, 78, 6, 2, colors.bg);
rect(63, 80, 2, 2, colors.bg);

line(18, 109, 110, 109, colors.cyanDark);
rect(20, 106, 10, 3, colors.mint);
rect(34, 106, 7, 3, colors.cyan);
rect(96, 106, 12, 3, colors.pink);

writePng(outputPath);
console.log(`Wrote ${outputPath}`);
