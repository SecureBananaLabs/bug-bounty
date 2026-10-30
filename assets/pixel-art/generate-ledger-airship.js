const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const width = 128;
const height = 128;
const pixels = Buffer.alloc(width * height * 4);

const palette = {
  night: [11, 17, 35, 255],
  horizon: [20, 39, 66, 255],
  cloud: [37, 58, 90, 255],
  moon: [246, 214, 141, 255],
  moonShade: [174, 139, 87, 255],
  brass: [226, 161, 55, 255],
  brassDark: [141, 94, 42, 255],
  cream: [242, 235, 204, 255],
  hull: [84, 132, 190, 255],
  hullDark: [44, 74, 119, 255],
  mint: [116, 207, 177, 255],
  red: [211, 77, 68, 255],
  ink: [8, 10, 20, 255],
  stone: [70, 83, 105, 255],
  window: [248, 195, 91, 255],
  shadow: [5, 8, 17, 255]
};

function setPixel(x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const offset = (y * width + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(xx, yy, color);
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

function ellipse(cx, cy, rx, ry, color, predicate = () => true) {
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1 && predicate(x, y)) {
        setPixel(x, y, color);
      }
    }
  }
}

function outlineEllipse(cx, cy, rx, ry, color) {
  for (let y = cy - ry - 1; y <= cy + ry + 1; y += 1) {
    for (let x = cx - rx - 1; x <= cx + rx + 1; x += 1) {
      const value = ((x - cx) * (x - cx)) / (rx * rx) + ((y - cy) * (y - cy)) / (ry * ry);
      if (value > 0.88 && value < 1.12) setPixel(x, y, color);
    }
  }
}

function star(x, y, color) {
  setPixel(x, y, color);
  setPixel(x - 1, y, color);
  setPixel(x + 1, y, color);
  setPixel(x, y - 1, color);
  setPixel(x, y + 1, color);
}

function encodePng() {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const chunks = [];
  function chunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
    chunks.push(length, typeBuffer, data, crc);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  chunk("IHDR", header);
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 }));
  chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]);
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

for (let y = 0; y < height; y += 1) {
  const color = y < 58 ? palette.night : y < 86 ? palette.horizon : palette.shadow;
  rect(0, y, width, 1, color);
}

ellipse(104, 18, 10, 10, palette.moon);
ellipse(108, 16, 8, 9, palette.night);

[
  [10, 12], [24, 27], [39, 16], [56, 10], [75, 27], [92, 39],
  [119, 32], [18, 51], [51, 43], [112, 55], [6, 72]
].forEach(([x, y]) => star(x, y, palette.cream));

rect(0, 88, 128, 40, palette.shadow);
[
  [3, 79, 11, 49], [18, 84, 15, 44], [39, 75, 10, 53],
  [53, 86, 13, 42], [72, 81, 17, 47], [94, 76, 12, 52], [111, 85, 12, 43]
].forEach(([x, y, w, h], i) => {
  rect(x, y, w, h, i % 2 ? palette.ink : palette.stone);
  rect(x + 2, y - 3, Math.max(3, w - 5), 3, i % 2 ? palette.stone : palette.ink);
  for (let yy = y + 6; yy < 120; yy += 10) {
    for (let xx = x + 3; xx < x + w - 2; xx += 6) {
      if ((xx + yy + i) % 3 !== 0) rect(xx, yy, 2, 3, palette.window);
    }
  }
});

ellipse(55, 47, 39, 17, palette.hull);
ellipse(55, 41, 32, 10, palette.cream);
ellipse(55, 53, 36, 8, palette.hullDark);
outlineEllipse(55, 47, 39, 17, palette.ink);
line(18, 47, 92, 47, palette.brass);
line(25, 39, 85, 57, palette.brassDark);
line(25, 56, 85, 38, palette.brassDark);
for (let x = 31; x <= 79; x += 12) {
  line(x, 32, x + 6, 61, palette.ink);
}

rect(39, 65, 34, 10, palette.brass);
rect(43, 62, 26, 4, palette.cream);
rect(37, 75, 38, 4, palette.brassDark);
rect(45, 67, 5, 4, palette.window);
rect(55, 67, 5, 4, palette.mint);
rect(65, 67, 5, 4, palette.window);
line(36, 63, 28, 56, palette.ink);
line(76, 63, 84, 56, palette.ink);
line(45, 63, 43, 58, palette.ink);
line(68, 63, 70, 58, palette.ink);

rect(84, 45, 12, 7, palette.brassDark);
rect(96, 47, 8, 3, palette.ink);
line(101, 43, 101, 56, palette.cream);
line(96, 49, 106, 49, palette.cream);

[
  [30, 83, palette.red], [41, 86, palette.mint], [53, 84, palette.brass],
  [67, 87, palette.cream], [80, 84, palette.hull]
].forEach(([x, y, color], i) => {
  rect(x, y, 7, 5, color);
  rect(x + 1, y + 1, 5, 3, palette.ink);
  line(x + 3, y, 56, 75, i % 2 ? palette.mint : palette.brass);
});

rect(0, 121, 128, 7, palette.ink);
for (let x = 0; x < 128; x += 8) {
  rect(x, 121, 4, 2, palette.brassDark);
}

const outputPath = path.join(__dirname, "ledger-airship.png");
fs.writeFileSync(outputPath, encodePng());
console.log(`Wrote ${outputPath} (${width}x${height})`);
