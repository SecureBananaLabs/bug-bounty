import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const width = 128;
const height = 128;
const outputPath = resolve("assets/pixel-art/review-forge.png");
const pixels = new Uint8Array(width * height * 4);

const colors = {
  void: [8, 13, 27, 255],
  night: [13, 20, 42, 255],
  steel: [61, 75, 96, 255],
  steelLight: [112, 130, 151, 255],
  ash: [30, 35, 49, 255],
  ember: [230, 88, 49, 255],
  gold: [255, 186, 73, 255],
  hot: [255, 229, 139, 255],
  cyan: [91, 208, 215, 255],
  mint: [117, 229, 167, 255],
  violet: [128, 91, 213, 255],
  ink: [5, 8, 16, 255]
};

function put(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) put(xx, yy, color);
  }
}

function line(x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    put(x0, y0, color);
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
      if (x * x + y * y <= radius * radius) put(cx + x, cy + y, color);
    }
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng() {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      const target = rowStart + 1 + x * 4;
      raw[target] = pixels[source];
      raw[target + 1] = pixels[source + 1];
      raw[target + 2] = pixels[source + 2];
      raw[target + 3] = pixels[source + 3];
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

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND")
  ]);
}

function drawBackground() {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const checker = ((x >> 3) + (y >> 3)) % 2;
      put(x, y, checker ? colors.void : colors.night);
    }
  }

  for (let i = 0; i < 34; i += 1) {
    const x = (i * 37 + 11) % width;
    const y = (i * 23 + 7) % 54;
    put(x, y, i % 3 === 0 ? colors.cyan : colors.steelLight);
  }
}

function drawForge() {
  rect(10, 93, 108, 11, colors.ash);
  rect(13, 104, 102, 7, colors.steel);
  rect(20, 111, 88, 5, colors.ink);

  rect(31, 68, 66, 27, colors.steel);
  rect(35, 72, 58, 20, colors.ash);
  rect(43, 75, 42, 13, colors.ember);
  rect(48, 78, 32, 8, colors.gold);
  rect(55, 80, 18, 4, colors.hot);

  rect(23, 86, 26, 7, colors.steelLight);
  rect(78, 86, 28, 7, colors.steelLight);
  rect(18, 89, 92, 3, colors.ink);

  rect(54, 55, 20, 8, colors.steelLight);
  rect(59, 45, 10, 13, colors.steel);
  rect(63, 26, 5, 22, colors.steelLight);
  rect(66, 24, 30, 5, colors.steelLight);
  rect(91, 27, 8, 7, colors.steel);

  line(27, 99, 45, 91, colors.gold);
  line(101, 99, 82, 91, colors.mint);
  line(19, 101, 109, 101, colors.cyan);
}

function drawPacketsAndSignals() {
  const packets = [
    [18, 78, colors.cyan],
    [30, 72, colors.mint],
    [92, 76, colors.violet],
    [105, 82, colors.gold]
  ];

  for (const [x, y, color] of packets) {
    rect(x, y, 5, 5, color);
    put(x + 1, y + 1, colors.hot);
    line(x + 2, y + 6, x + 9, y + 11, colors.steelLight);
  }

  for (let i = 0; i < 18; i += 1) {
    const x = 39 + ((i * 11) % 50);
    const y = 51 + ((i * 7) % 18);
    put(x, y, i % 2 ? colors.gold : colors.ember);
  }

  rect(14, 24, 28, 26, colors.ash);
  rect(18, 28, 20, 18, colors.night);
  for (let y = 31; y <= 43; y += 6) line(20, y, 36, y, colors.cyan);
  for (let x = 22; x <= 34; x += 6) line(x, 30, x, 44, colors.mint);

  rect(87, 42, 25, 19, colors.ash);
  rect(91, 46, 17, 11, colors.night);
  rect(94, 49, 3, 3, colors.gold);
  rect(100, 49, 3, 3, colors.mint);
  line(87, 65, 109, 83, colors.gold);
}

function drawFrameAndGlow() {
  for (let i = 0; i < 4; i += 1) {
    rect(i, i, width - i * 2, 1, colors.steel);
    rect(i, height - i - 1, width - i * 2, 1, colors.steel);
    rect(i, i, 1, height - i * 2, colors.steel);
    rect(width - i - 1, i, 1, height - i * 2, colors.steel);
  }

  circle(64, 82, 3, colors.hot);
  circle(64, 82, 2, colors.gold);
  put(64, 82, colors.ember);
}

drawBackground();
drawForge();
drawPacketsAndSignals();
drawFrameAndGlow();

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, encodePng());
console.log(`Wrote ${outputPath} (${width}x${height})`);
