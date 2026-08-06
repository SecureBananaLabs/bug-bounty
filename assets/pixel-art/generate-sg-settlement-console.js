#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const width = 128;
const height = 128;
const outputPath = path.join(__dirname, "sg-settlement-console.png");
const pixels = Buffer.alloc(width * height * 4);

const colors = {
  night: [13, 18, 34, 255],
  deep: [20, 28, 50, 255],
  haze: [31, 41, 70, 255],
  tower: [40, 50, 76, 255],
  towerLit: [67, 82, 115, 255],
  glass: [74, 137, 168, 255],
  glassHot: [114, 220, 215, 255],
  mint: [83, 222, 145, 255],
  gold: [245, 187, 87, 255],
  amber: [214, 109, 70, 255],
  coral: [240, 91, 113, 255],
  white: [231, 241, 250, 255],
  shadow: [8, 12, 24, 255],
  console: [28, 37, 61, 255],
  rail: [53, 69, 99, 255],
  floor: [18, 25, 42, 255],
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = (y * width + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function fill(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function outline(x, y, w, h, color) {
  fill(x, y, w, 1, color);
  fill(x, y + h - 1, w, 1, color);
  fill(x, y, 1, h, color);
  fill(x + w - 1, y, 1, h, color);
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

function drawPacket(x, y, color) {
  fill(x, y, 5, 5, color);
  fill(x + 1, y + 1, 3, 3, colors.white);
  setPixel(x + 4, y + 4, colors.shadow);
}

function drawWindows(x, y, w, h, gap, color) {
  for (let yy = y; yy < y + h; yy += gap) {
    for (let xx = x; xx < x + w; xx += gap) {
      fill(xx, yy, 1, 2, color);
    }
  }
}

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const table = crcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, crc]);
}

function encodePng() {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawScene() {
  fill(0, 0, width, height, colors.night);
  for (let y = 0; y < 62; y += 1) {
    const shade = [13 + Math.floor(y / 12), 18 + Math.floor(y / 8), 34 + Math.floor(y / 5), 255];
    fill(0, y, width, 1, shade);
  }

  [
    [9, 11],
    [20, 24],
    [40, 14],
    [58, 8],
    [80, 22],
    [101, 12],
    [116, 28],
    [72, 36],
  ].forEach(([x, y], index) => fill(x, y, index % 3 === 0 ? 2 : 1, 1, colors.white));

  fill(0, 58, 128, 24, colors.deep);
  fill(6, 47, 12, 35, colors.tower);
  fill(21, 42, 10, 40, colors.towerLit);
  fill(34, 51, 15, 31, colors.tower);
  fill(55, 36, 9, 46, colors.towerLit);
  fill(67, 36, 9, 46, colors.towerLit);
  fill(79, 36, 9, 46, colors.towerLit);
  fill(53, 32, 37, 5, colors.haze);
  fill(97, 48, 12, 34, colors.tower);
  fill(113, 55, 8, 27, colors.towerLit);
  line(49, 82, 94, 82, colors.shadow);
  drawWindows(9, 51, 7, 27, 5, colors.gold);
  drawWindows(23, 45, 6, 33, 6, colors.glassHot);
  drawWindows(57, 39, 29, 39, 7, colors.glass);
  drawWindows(99, 52, 7, 26, 5, colors.gold);

  fill(0, 82, 128, 46, colors.floor);
  for (let y = 86; y < 128; y += 8) {
    line(0, y, 127, y + 9, colors.deep);
  }

  fill(17, 87, 94, 24, colors.console);
  outline(17, 87, 94, 24, colors.rail);
  fill(22, 92, 84, 8, colors.shadow);
  fill(24, 94, 17, 4, colors.mint);
  fill(46, 94, 17, 4, colors.gold);
  fill(68, 94, 17, 4, colors.glassHot);
  fill(90, 94, 12, 4, colors.coral);

  line(13, 116, 47, 101, colors.rail);
  line(48, 115, 62, 101, colors.rail);
  line(81, 115, 67, 101, colors.rail);
  line(118, 116, 89, 101, colors.rail);
  line(13, 117, 47, 102, colors.mint);
  line(48, 116, 62, 102, colors.gold);
  line(81, 116, 67, 102, colors.glassHot);
  line(118, 117, 89, 102, colors.coral);

  drawPacket(18, 111, colors.mint);
  drawPacket(48, 108, colors.gold);
  drawPacket(75, 106, colors.glassHot);
  drawPacket(105, 111, colors.coral);

  fill(59, 72, 10, 17, colors.shadow);
  fill(61, 74, 6, 13, colors.glassHot);
  fill(62, 75, 4, 3, colors.white);
  fill(60, 69, 8, 3, colors.gold);
  fill(58, 67, 12, 2, colors.amber);

  fill(51, 105, 27, 4, colors.shadow);
  fill(55, 104, 19, 2, colors.white);
  fill(61, 101, 7, 7, colors.gold);
  outline(61, 101, 7, 7, colors.amber);

  fill(9, 88, 5, 5, colors.mint);
  fill(114, 88, 5, 5, colors.gold);
  fill(9, 100, 5, 5, colors.coral);
  fill(114, 100, 5, 5, colors.glassHot);
}

drawScene();
fs.writeFileSync(outputPath, encodePng());
console.log(`Wrote ${path.relative(process.cwd(), outputPath)} (${width}x${height})`);
