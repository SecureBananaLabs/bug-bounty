#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const GRID = 128;
const SCALE = 4;
const WIDTH = GRID * SCALE;
const HEIGHT = GRID * SCALE;

const palette = {
  clear: [0, 0, 0, 0],
  bg0: [12, 14, 27, 255],
  bg1: [18, 22, 43, 255],
  grid: [35, 49, 78, 255],
  gridDim: [25, 34, 58, 255],
  moon: [75, 94, 132, 255],
  peelShadow: [126, 82, 30, 255],
  peelDark: [188, 123, 33, 255],
  peelMid: [235, 178, 47, 255],
  peelLight: [255, 216, 86, 255],
  peelTip: [91, 55, 25, 255],
  gold: [255, 202, 82, 255],
  goldHot: [255, 238, 153, 255],
  trace: [86, 218, 190, 255],
  traceDim: [41, 122, 132, 255],
  spark: [255, 248, 203, 255],
  purple: [118, 91, 210, 255],
  red: [234, 75, 95, 255],
  white: [236, 241, 255, 255],
  ink: [6, 7, 12, 255],
};

const pixels = new Uint8Array(WIDTH * HEIGHT * 4);

function putScaled(x, y, color) {
  if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
  for (let sy = 0; sy < SCALE; sy++) {
    for (let sx = 0; sx < SCALE; sx++) {
      const px = x * SCALE + sx;
      const py = y * SCALE + sy;
      const idx = (py * WIDTH + px) * 4;
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = color[3];
    }
  }
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) putScaled(xx, yy, color);
  }
}

function line(x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    putScaled(x0, y0, color);
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

function ellipse(cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) putScaled(x, y, color);
    }
  }
}

function drawBackground() {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const checker = (x + Math.floor(y / 2)) % 11 === 0;
      putScaled(x, y, checker ? palette.bg1 : palette.bg0);
    }
  }

  for (let x = 8; x < GRID; x += 16) line(x, 12, x, 116, palette.gridDim);
  for (let y = 16; y < GRID; y += 16) line(8, y, 120, y, palette.gridDim);
  for (let x = 16; x < 118; x += 24) {
    for (let y = 24; y < 112; y += 28) {
      rect(x, y, 2, 2, palette.grid);
    }
  }

  ellipse(96, 27, 13, 13, palette.moon);
  ellipse(91, 25, 12, 13, palette.bg0);

  line(17, 111, 111, 111, palette.traceDim);
  line(17, 112, 111, 112, palette.ink);
  rect(23, 104, 18, 5, palette.grid);
  rect(86, 104, 17, 5, palette.grid);
  rect(46, 106, 8, 3, palette.traceDim);
  rect(64, 106, 13, 3, palette.traceDim);
}

function drawBananaBody() {
  const body = [
    [36, 70, 47, 18, palette.peelShadow],
    [34, 65, 56, 18, palette.peelDark],
    [36, 60, 61, 17, palette.peelMid],
    [40, 55, 61, 15, palette.peelLight],
    [47, 51, 56, 12, palette.peelLight],
    [57, 47, 48, 10, palette.peelMid],
    [70, 44, 37, 8, palette.peelDark],
    [87, 41, 22, 7, palette.peelShadow],
  ];

  for (const [x, y, w, h, color] of body) {
    ellipse(x + w / 2, y + h / 2, w / 2, h / 2, color);
  }

  ellipse(55, 59, 21, 7, palette.goldHot);
  ellipse(70, 53, 25, 6, palette.peelLight);
  ellipse(85, 49, 17, 4, palette.gold);

  rect(31, 70, 7, 7, palette.peelTip);
  rect(30, 73, 4, 4, palette.ink);
  rect(108, 40, 7, 5, palette.peelTip);
  rect(113, 39, 3, 3, palette.ink);

  line(38, 77, 89, 48, palette.peelDark);
  line(42, 79, 96, 51, palette.peelShadow);
  line(45, 59, 101, 45, palette.goldHot);
}

function drawKintsugiRepairs() {
  const cracks = [
    [[55, 59], [58, 64], [55, 69], [61, 74], [59, 80]],
    [[72, 52], [75, 58], [81, 60], [79, 66], [85, 70]],
    [[91, 47], [88, 53], [93, 57], [90, 63]],
  ];

  for (const crack of cracks) {
    for (let i = 0; i < crack.length - 1; i++) {
      const [x0, y0] = crack[i];
      const [x1, y1] = crack[i + 1];
      line(x0, y0, x1, y1, palette.gold);
      putScaled(x0 + 1, y0, palette.goldHot);
    }
  }

  rect(57, 63, 3, 3, palette.goldHot);
  rect(78, 58, 3, 3, palette.goldHot);
  rect(89, 53, 2, 3, palette.goldHot);
}

function drawCircuitDetails() {
  const nodes = [
    [50, 82],
    [65, 80],
    [80, 75],
    [95, 66],
    [101, 55],
  ];

  for (let i = 0; i < nodes.length - 1; i++) {
    const [x0, y0] = nodes[i];
    const [x1, y1] = nodes[i + 1];
    line(x0, y0, x1, y1, palette.traceDim);
  }

  for (const [x, y] of nodes) {
    rect(x - 2, y - 2, 5, 5, palette.trace);
    rect(x, y, 1, 1, palette.white);
  }

  rect(24, 92, 20, 14, palette.ink);
  rect(26, 94, 16, 10, palette.grid);
  rect(29, 97, 3, 4, palette.trace);
  rect(34, 97, 3, 4, palette.gold);
  rect(39, 97, 2, 4, palette.red);
  line(44, 99, 52, 83, palette.traceDim);

  rect(102, 83, 14, 14, palette.ink);
  rect(104, 85, 10, 10, palette.grid);
  rect(106, 87, 6, 5, palette.purple);
  rect(108, 84, 2, 3, palette.gold);
  line(101, 82, 95, 66, palette.traceDim);
}

function drawSparksAndFrame() {
  const sparks = [
    [38, 44],
    [51, 39],
    [73, 36],
    [112, 59],
    [24, 61],
    [90, 91],
    [69, 101],
  ];

  for (const [x, y] of sparks) {
    putScaled(x, y, palette.spark);
    putScaled(x - 1, y, palette.gold);
    putScaled(x + 1, y, palette.gold);
    putScaled(x, y - 1, palette.gold);
    putScaled(x, y + 1, palette.gold);
  }

  rect(7, 7, 114, 2, palette.grid);
  rect(7, 119, 114, 2, palette.grid);
  rect(7, 7, 2, 114, palette.grid);
  rect(119, 7, 2, 114, palette.grid);
  rect(10, 10, 8, 2, palette.gold);
  rect(110, 116, 8, 2, palette.trace);
}

function crcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function pngBuffer() {
  const scanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    const rowStart = y * (WIDTH * 4 + 1);
    scanlines[rowStart] = 0;
    for (let x = 0; x < WIDTH * 4; x++) {
      scanlines[rowStart + 1 + x] = pixels[y * WIDTH * 4 + x];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function main() {
  drawBackground();
  drawBananaBody();
  drawKintsugiRepairs();
  drawCircuitDetails();
  drawSparksAndFrame();

  const outDir = path.join(process.cwd(), "assets", "pixel-art");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "kintsugi-circuit-banana.png");
  fs.writeFileSync(outPath, pngBuffer());
  console.log(`Wrote ${outPath}`);
  console.log(`Canvas: ${WIDTH}x${HEIGHT} rendered from ${GRID}x${GRID} pixel grid`);
}

main();
