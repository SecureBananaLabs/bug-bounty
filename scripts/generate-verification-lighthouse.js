const { deflateSync } = require("node:zlib");
const { writeFileSync } = require("node:fs");

const scale = 4;
const width = 32;
const height = 32;
const outPath = "assets/pixel-art/verification-lighthouse.png";

const palette = {
  night: [8, 13, 32, 255],
  dusk: [26, 31, 72, 255],
  cloud: [72, 86, 142, 255],
  beam: [255, 220, 116, 255],
  glow: [242, 156, 70, 255],
  wall: [203, 219, 231, 255],
  shade: [132, 156, 184, 255],
  roof: [196, 55, 55, 255],
  rail: [47, 63, 102, 255],
  glass: [110, 206, 255, 255],
  grid: [52, 191, 168, 255],
  code: [68, 227, 185, 255],
  stone: [74, 89, 122, 255],
  shadow: [15, 21, 44, 255]
};

const pixels = Array.from({ length: height }, () =>
  Array.from({ length: width }, () => palette.night)
);

function setPixel(x, y, color) {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    pixels[y][x] = color;
  }
}

function fillRect(x, y, w, h, color) {
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

function writePng(path, source, srcWidth, srcHeight, factor) {
  const pngWidth = srcWidth * factor;
  const pngHeight = srcHeight * factor;
  const raw = Buffer.alloc((pngWidth * 4 + 1) * pngHeight);
  let offset = 0;

  for (let y = 0; y < pngHeight; y += 1) {
    raw[offset++] = 0;
    const srcY = Math.floor(y / factor);
    for (let x = 0; x < pngWidth; x += 1) {
      const srcX = Math.floor(x / factor);
      const [r, g, b, a] = source[srcY][srcX];
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  function chunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crcInput = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(pngWidth, 0);
  ihdr.writeUInt32BE(pngHeight, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  writeFileSync(path, Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]));
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

for (let y = 0; y < height; y += 1) {
  const color = y < 10 ? palette.night : y < 18 ? palette.dusk : palette.shadow;
  fillRect(0, y, width, 1, color);
}

fillRect(0, 24, 32, 8, palette.stone);
for (let x = 0; x < 32; x += 4) {
  line(x, 24, x + 8, 31, palette.grid);
}
for (let x = 1; x < 31; x += 5) {
  setPixel(x, 27, palette.code);
  setPixel(x + 1, 29, palette.code);
}

fillRect(2, 8, 7, 1, palette.cloud);
fillRect(4, 7, 6, 1, palette.cloud);
fillRect(24, 10, 6, 1, palette.cloud);
fillRect(22, 11, 8, 1, palette.cloud);

line(15, 9, 4, 18, palette.beam);
line(16, 9, 30, 15, palette.beam);
line(16, 10, 30, 17, palette.glow);
fillRect(6, 18, 20, 1, palette.glow);

fillRect(13, 10, 6, 14, palette.wall);
fillRect(12, 24, 8, 3, palette.wall);
fillRect(18, 12, 1, 12, palette.shade);
fillRect(14, 13, 2, 2, palette.glass);
fillRect(17, 13, 2, 2, palette.glass);
fillRect(14, 18, 2, 2, palette.grid);
fillRect(17, 18, 2, 2, palette.grid);
fillRect(12, 9, 8, 1, palette.rail);
fillRect(13, 7, 6, 2, palette.glass);
fillRect(12, 6, 8, 1, palette.roof);
line(12, 6, 16, 3, palette.roof);
line(20, 6, 16, 3, palette.roof);

fillRect(11, 27, 10, 2, palette.shadow);
fillRect(15, 24, 2, 3, palette.rail);
setPixel(15, 4, palette.beam);
setPixel(16, 4, palette.beam);

writePng(outPath, pixels, width, height, scale);
