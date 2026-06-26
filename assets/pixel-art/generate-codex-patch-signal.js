const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const size = 128;
const pixels = new Uint8Array(size * size * 4);

const palette = {
  skyTop: [15, 20, 42, 255],
  skyMid: [20, 35, 59, 255],
  skyGlow: [55, 70, 80, 255],
  waterA: [12, 70, 88, 255],
  waterB: [10, 52, 72, 255],
  board: [23, 111, 83, 255],
  trace: [90, 211, 164, 255],
  traceDim: [47, 151, 124, 255],
  gold: [252, 196, 74, 255],
  goldDim: [201, 128, 48, 255],
  white: [236, 242, 218, 255],
  red: [218, 72, 77, 255],
  dark: [6, 14, 22, 255],
  rock: [62, 75, 86, 255],
  patch: [143, 231, 228, 255],
};

function putPixel(x, y, color) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const index = (y * size + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      putPixel(xx, yy, color);
    }
  }
}

function line(x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    putPixel(x0, y0, color);
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

function ditherRect(x, y, w, h, a, b) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      putPixel(xx, yy, (xx + yy) % 2 === 0 ? a : b);
    }
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function writePng(outputPath) {
  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    scanlines[rowOffset] = 0;
    scanlines.set(pixels.subarray(y * size * 4, (y + 1) * size * 4), rowOffset + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(outputPath, png);
}

for (let y = 0; y < size; y += 1) {
  const band = y < 36 ? palette.skyTop : y < 70 ? palette.skyMid : palette.skyGlow;
  rect(0, y, size, 1, band);
}

for (let y = 70; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const wave = ((x * 3 + y * 5) % 17) < 5;
    putPixel(x, y, wave ? palette.waterA : palette.waterB);
  }
}

for (let i = 0; i < 32; i += 1) {
  const x = (i * 37 + 11) % 124;
  const y = (i * 23 + 7) % 42;
  rect(x, y, 1 + (i % 2), 1, i % 3 === 0 ? palette.gold : palette.white);
}

rect(0, 104, 128, 24, palette.board);
ditherRect(0, 112, 128, 16, palette.board, [18, 90, 72, 255]);
line(2, 118, 31, 118, palette.trace);
line(31, 118, 31, 106, palette.traceDim);
line(31, 106, 63, 106, palette.trace);
line(74, 118, 123, 118, palette.trace);
line(82, 109, 117, 109, palette.traceDim);
for (const [x, y] of [
  [16, 118],
  [31, 106],
  [63, 106],
  [82, 109],
  [117, 109],
]) {
  rect(x - 1, y - 1, 3, 3, palette.gold);
}

rect(16, 92, 42, 16, palette.rock);
rect(22, 86, 30, 6, [74, 88, 98, 255]);
rect(28, 80, 18, 6, [82, 98, 108, 255]);

rect(34, 45, 16, 42, palette.white);
rect(36, 49, 12, 6, palette.red);
rect(36, 61, 12, 6, palette.red);
rect(36, 73, 12, 6, palette.red);
rect(31, 39, 22, 8, palette.dark);
rect(34, 35, 16, 4, palette.goldDim);
rect(37, 29, 10, 6, palette.gold);
rect(38, 31, 8, 3, palette.white);
rect(39, 87, 6, 7, palette.dark);

for (let i = 0; i < 30; i += 1) {
  line(47, 32 + Math.floor(i / 8), 121 - i, 18 + Math.floor(i * 0.72), [252, 196, 74, 84]);
}
line(48, 32, 118, 20, palette.gold);
line(48, 35, 124, 43, palette.goldDim);
rect(116, 19, 4, 4, palette.gold);
rect(120, 41, 3, 3, palette.gold);

for (let i = 0; i < 6; i += 1) {
  const x = 71 + i * 8;
  const y = 82 + (i % 2) * 5;
  rect(x, y, 6, 4, palette.patch);
  rect(x + 1, y - 2, 3, 2, palette.white);
  rect(x - 1, y + 4, 8, 1, palette.dark);
}

rect(78, 57, 15, 10, palette.dark);
rect(80, 59, 11, 6, [31, 46, 60, 255]);
rect(82, 61, 3, 2, palette.trace);
rect(87, 61, 2, 2, palette.gold);
line(92, 62, 108, 52, palette.traceDim);
line(92, 64, 115, 65, palette.trace);
rect(107, 51, 3, 3, palette.gold);
rect(114, 64, 3, 3, palette.gold);

rect(8, 8, 18, 11, [26, 38, 55, 255]);
rect(10, 10, 14, 7, [36, 55, 72, 255]);
rect(12, 12, 3, 3, palette.trace);
rect(17, 12, 5, 1, palette.gold);

const output = path.join(__dirname, "codex-patch-signal-lighthouse.png");
writePng(output);
console.log(`Wrote ${output} (${size}x${size})`);
