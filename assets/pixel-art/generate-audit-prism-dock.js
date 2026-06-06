const fs = require("fs");
const zlib = require("zlib");

const SIZE = 128;
const SCALE = 1;
const pixels = Buffer.alloc(SIZE * SIZE * 4);

const palette = {
  bg0: [9, 12, 28, 255],
  bg1: [18, 27, 52, 255],
  water: [20, 55, 76, 255],
  platform: [59, 75, 98, 255],
  platformLight: [89, 108, 133, 255],
  rail: [217, 185, 96, 255],
  railDark: [121, 94, 56, 255],
  prism: [107, 217, 255, 255],
  prismDeep: [67, 132, 218, 255],
  proof: [238, 216, 143, 255],
  crate: [137, 91, 64, 255],
  green: [90, 224, 148, 255],
  red: [238, 92, 95, 255],
  white: [242, 248, 255, 255],
  shadow: [5, 7, 16, 255],
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const idx = (Math.floor(y) * SIZE + Math.floor(x)) * 4;
  pixels[idx] = color[0];
  pixels[idx + 1] = color[1];
  pixels[idx + 2] = color[2];
  pixels[idx + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += SCALE) {
    for (let xx = x; xx < x + w; xx += SCALE) setPixel(xx, yy, color);
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

function circle(cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(cx + x, cy + y, color);
    }
  }
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuf.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length);
  return out;
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const band = Math.floor((x + y) / 16) % 2;
    setPixel(x, y, band ? palette.bg1 : palette.bg0);
  }
}

rect(0, 92, 128, 36, palette.water);
for (let x = 0; x < 128; x += 8) line(x, 98, x + 6, 96, palette.bg1);
rect(14, 80, 100, 24, palette.platform);
rect(20, 76, 88, 8, palette.platformLight);
rect(10, 101, 108, 5, palette.shadow);

rect(23, 70, 8, 34, palette.railDark);
rect(96, 70, 8, 34, palette.railDark);
rect(26, 58, 76, 5, palette.rail);
rect(28, 64, 72, 3, palette.railDark);

rect(43, 48, 42, 28, palette.shadow);
rect(47, 45, 34, 28, palette.platformLight);
rect(51, 49, 26, 20, palette.bg0);
rect(54, 53, 20, 3, palette.green);
rect(54, 59, 12, 3, palette.red);
rect(67, 59, 7, 3, palette.green);
rect(54, 65, 20, 2, palette.white);

rect(55, 25, 18, 22, palette.prismDeep);
line(64, 18, 55, 25, palette.prism);
line(64, 18, 73, 25, palette.prism);
line(55, 25, 73, 25, palette.white);
line(64, 18, 64, 47, palette.prism);
circle(64, 34, 4, palette.white);

for (let i = 0; i < 5; i++) {
  const x = 16 + i * 18;
  rect(x, 86 - (i % 2) * 4, 12, 10, palette.crate);
  rect(x + 2, 84 - (i % 2) * 4, 8, 3, palette.proof);
  rect(x + 4, 88 - (i % 2) * 4, 4, 4, palette.rail);
}

line(18, 105, 41, 84, palette.rail);
line(110, 105, 87, 84, palette.rail);
line(36, 105, 56, 76, palette.railDark);
line(92, 105, 72, 76, palette.railDark);

for (const [x, y, r, color] of [
  [28, 38, 3, palette.green],
  [99, 39, 3, palette.red],
  [22, 60, 2, palette.white],
  [106, 61, 2, palette.white],
  [64, 12, 2, palette.prism],
]) circle(x, y, r, color);

fs.writeFileSync("assets/pixel-art/audit-prism-dock.png", png(SIZE, SIZE, pixels));
