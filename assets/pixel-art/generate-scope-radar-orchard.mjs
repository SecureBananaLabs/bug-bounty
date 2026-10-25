import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const WIDTH = 128;
const HEIGHT = 128;
const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "scope-radar-orchard.png");

const palette = {
  void: [9, 14, 25, 255],
  night: [13, 24, 41, 255],
  grid: [24, 45, 61, 255],
  blue: [46, 146, 211, 255],
  mint: [96, 232, 180, 255],
  leaf: [47, 178, 105, 255],
  lime: [164, 245, 92, 255],
  gold: [246, 194, 86, 255],
  amber: [226, 125, 53, 255],
  pink: [218, 94, 161, 255],
  white: [232, 244, 238, 255],
  shadow: [5, 8, 15, 255],
};

const data = new Uint8Array(WIDTH * HEIGHT * 4);

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const index = (y * WIDTH + x) * 4;
  data[index] = color[0];
  data[index + 1] = color[1];
  data[index + 2] = color[2];
  data[index + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) setPixel(xx, yy, color);
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
    setPixel(x0 + 1, y0, color);
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
      const distance = x * x + y * y;
      if (distance <= radius * radius && distance >= (radius - 2) * (radius - 2)) {
        setPixel(cx + x, cy + y, color);
      }
    }
  }
}

function fillCircle(cx, cy, radius, color) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) setPixel(cx + x, cy + y, color);
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
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(xx, yy, ((xx >> 2) + (yy >> 2)) % 2 === 0 ? a : b);
    }
  }
}

function writeUInt32(buffer, value, offset) {
  buffer.writeUInt32BE(value >>> 0, offset);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const typeBuffer = Buffer.from(type, "ascii");
  const payload = Buffer.concat([typeBuffer, body]);
  const result = Buffer.alloc(12 + body.length);
  writeUInt32(result, body.length, 0);
  typeBuffer.copy(result, 4);
  body.copy(result, 8);
  writeUInt32(result, crc32(payload), 8 + body.length);
  return result;
}

function encodePng() {
  const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * (WIDTH * 4 + 1);
    raw[rowStart] = 0;
    Buffer.from(data.slice(y * WIDTH * 4, (y + 1) * WIDTH * 4)).copy(raw, rowStart + 1);
  }

  const ihdr = Buffer.alloc(13);
  writeUInt32(ihdr, WIDTH, 0);
  writeUInt32(ihdr, HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (let y = 0; y < HEIGHT; y += 1) {
  for (let x = 0; x < WIDTH; x += 1) {
    const haze = Math.floor((x + y) / 64) % 2 === 0 ? palette.void : palette.night;
    setPixel(x, y, haze);
  }
}

for (let x = 0; x < WIDTH; x += 8) line(x, 18, x, 113, palette.grid);
for (let y = 24; y < 114; y += 8) line(10, y, 117, y, palette.grid);

checkerRect(14, 98, 100, 14, [14, 32, 36, 255], [17, 40, 40, 255]);
rect(0, 116, WIDTH, 12, palette.shadow);
rect(10, 110, 108, 6, [21, 54, 50, 255]);
rect(18, 113, 92, 3, [32, 83, 58, 255]);

circle(64, 63, 47, palette.blue);
circle(64, 63, 34, [34, 101, 141, 255]);
circle(64, 63, 21, [30, 72, 91, 255]);
line(64, 63, 103, 43, palette.mint);
line(65, 64, 104, 44, palette.leaf);

for (const [x, y, size, color] of [
  [24, 40, 3, palette.gold],
  [40, 78, 4, palette.mint],
  [77, 31, 3, palette.pink],
  [94, 83, 4, palette.lime],
  [58, 101, 3, palette.gold],
  [102, 52, 2, palette.white],
]) {
  diamond(x, y, size, color);
  setPixel(x + size + 2, y, palette.white);
}

rect(58, 56, 13, 25, [77, 47, 30, 255]);
rect(60, 53, 9, 30, [113, 68, 37, 255]);
fillCircle(64, 49, 13, palette.leaf);
fillCircle(55, 55, 8, palette.mint);
fillCircle(74, 56, 8, palette.lime);
rect(62, 38, 4, 18, palette.gold);
rect(54, 48, 4, 4, palette.gold);
rect(74, 51, 4, 4, palette.gold);

for (const [x, y, w, color] of [
  [19, 96, 17, palette.mint],
  [43, 96, 14, palette.gold],
  [70, 96, 20, palette.pink],
  [98, 96, 12, palette.lime],
]) {
  rect(x, y, w, 4, color);
  rect(x + 2, y - 6, 3, 6, color);
  rect(x + w - 5, y - 8, 3, 8, color);
}

line(22, 92, 47, 84, palette.mint);
line(50, 84, 65, 71, palette.gold);
line(68, 71, 85, 83, palette.pink);
line(88, 83, 105, 91, palette.lime);

for (const [x, y, labelColor] of [
  [18, 17, palette.gold],
  [36, 15, palette.mint],
  [84, 15, palette.pink],
  [103, 18, palette.lime],
]) {
  rect(x, y, 7, 7, labelColor);
  rect(x + 2, y + 2, 3, 3, palette.void);
}

rect(7, 7, 38, 5, palette.blue);
rect(7, 14, 24, 3, palette.mint);
rect(84, 7, 35, 5, palette.gold);
rect(96, 14, 23, 3, palette.amber);

for (let x = 17; x < 113; x += 12) {
  rect(x, 121, 5, 3, x % 24 === 5 ? palette.gold : palette.blue);
}

mkdirSync(__dirname, { recursive: true });
writeFileSync(outPath, encodePng());
console.log(`wrote ${outPath} (${WIDTH}x${HEIGHT})`);
