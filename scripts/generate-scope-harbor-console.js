#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const width = 128;
const height = 128;
const outputDir = path.join(__dirname, "..", "assets", "pixel-art");
const outputFile = path.join(outputDir, "scope-harbor-console.png");

const rgba = new Uint8Array(width * height * 4);

const palette = {
  deep: [12, 20, 34, 255],
  panel: [26, 39, 59, 255],
  panelDark: [18, 28, 43, 255],
  rail: [82, 101, 130, 255],
  teal: [62, 201, 189, 255],
  tealDark: [32, 132, 139, 255],
  mint: [166, 255, 218, 255],
  gold: [246, 196, 92, 255],
  amber: [221, 132, 53, 255],
  coral: [238, 99, 101, 255],
  violet: [125, 112, 214, 255],
  white: [232, 243, 255, 255],
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (y * width + x) * 4;
  rgba[i] = color[0];
  rgba[i + 1] = color[1];
  rgba[i + 2] = color[2];
  rgba[i + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) setPixel(xx, yy, color);
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
    setPixel(x, y, color);
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

function dot(x, y, r, color) {
  for (let yy = -r; yy <= r; yy += 1) {
    for (let xx = -r; xx <= r; xx += 1) {
      if (xx * xx + yy * yy <= r * r) setPixel(x + xx, y + yy, color);
    }
  }
}

function draw() {
  rect(0, 0, width, height, palette.deep);

  for (let y = 8; y < 52; y += 10) {
    for (let x = (y % 20) + 4; x < width; x += 22) {
      setPixel(x, y, palette.rail);
      if ((x + y) % 3 === 0) setPixel(x + 1, y, palette.tealDark);
    }
  }

  rect(10, 70, 108, 38, palette.panelDark);
  rect(14, 74, 100, 30, palette.panel);
  rect(20, 80, 22, 14, palette.tealDark);
  rect(23, 83, 16, 8, palette.mint);
  rect(52, 80, 22, 14, palette.violet);
  rect(55, 83, 16, 8, palette.white);
  rect(84, 80, 22, 14, palette.amber);
  rect(87, 83, 16, 8, palette.gold);

  rect(8, 110, 112, 8, palette.rail);
  rect(14, 112, 24, 3, palette.teal);
  rect(50, 112, 24, 3, palette.gold);
  rect(86, 112, 24, 3, palette.coral);

  line(24, 75, 24, 57, palette.teal);
  line(64, 75, 64, 47, palette.gold);
  line(96, 75, 96, 57, palette.coral);

  rect(16, 48, 16, 12, palette.panel);
  rect(20, 51, 8, 6, palette.teal);
  rect(56, 38, 16, 12, palette.panel);
  rect(60, 41, 8, 6, palette.gold);
  rect(88, 48, 16, 12, palette.panel);
  rect(92, 51, 8, 6, palette.coral);

  line(28, 54, 60, 44, palette.rail);
  line(68, 44, 92, 54, palette.rail);
  line(24, 57, 64, 47, palette.tealDark);
  line(64, 47, 96, 57, palette.amber);

  dot(24, 57, 3, palette.mint);
  dot(64, 47, 3, palette.gold);
  dot(96, 57, 3, palette.coral);

  for (let i = 0; i < 5; i += 1) {
    rect(18 + i * 19, 99, 8, 4, i % 2 ? palette.teal : palette.gold);
  }

  rect(6, 6, 36, 18, palette.panelDark);
  rect(10, 10, 28, 3, palette.teal);
  rect(10, 16, 18, 3, palette.gold);
  rect(98, 6, 20, 20, palette.panelDark);
  dot(108, 16, 6, palette.violet);
  dot(108, 16, 3, palette.white);
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([len, name, data, crc]);
}

function pngBuffer() {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    Buffer.from(rgba.subarray(y * width * 4, (y + 1) * width * 4)).copy(raw, row + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

draw();
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, pngBuffer());

const written = fs.readFileSync(outputFile);
if (!written.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
  throw new Error("Invalid PNG signature");
}
if (written.readUInt32BE(16) !== width || written.readUInt32BE(20) !== height) {
  throw new Error("Invalid PNG dimensions");
}

console.log(`Generated ${path.relative(process.cwd(), outputFile)} (${width}x${height})`);
