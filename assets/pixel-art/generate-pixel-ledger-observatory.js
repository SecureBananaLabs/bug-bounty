#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const WIDTH = 128;
const HEIGHT = 128;

const palette = {
  ink: [12, 18, 34, 255],
  deep: [20, 31, 54, 255],
  slate: [39, 55, 82, 255],
  rail: [73, 91, 118, 255],
  glass: [34, 79, 101, 255],
  cyan: [88, 210, 210, 255],
  mint: [108, 232, 171, 255],
  amber: [242, 181, 67, 255],
  gold: [255, 219, 111, 255],
  coral: [238, 105, 94, 255],
  violet: [142, 117, 225, 255],
  white: [236, 246, 255, 255],
  shadow: [7, 11, 22, 255],
};

const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

function putPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) {
    return;
  }
  const offset = (y * WIDTH + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function fillRect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      putPixel(xx, yy, color);
    }
  }
}

function drawRect(x, y, w, h, color) {
  fillRect(x, y, w, 2, color);
  fillRect(x, y + h - 2, w, 2, color);
  fillRect(x, y, 2, h, color);
  fillRect(x + w - 2, y, 2, h, color);
}

function drawLine(x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let x = x0;
  let y = y0;

  while (true) {
    fillRect(x, y, 2, 2, color);
    if (x === x1 && y === y1) {
      break;
    }
    const error2 = error * 2;
    if (error2 >= dy) {
      error += dy;
      x += sx;
    }
    if (error2 <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function fillPixelCircle(cx, cy, radius, color) {
  for (let y = -radius; y <= radius; y += 2) {
    for (let x = -radius; x <= radius; x += 2) {
      if (x * x + y * y <= radius * radius) {
        fillRect(cx + x, cy + y, 2, 2, color);
      }
    }
  }
}

function hashSeed(index) {
  let value = 0x6d2b79f5 ^ index;
  value = Math.imul(value ^ (value >>> 15), 1 | value);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
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

function writePng(filePath) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const scanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * (WIDTH * 4 + 1);
    scanlines[rowStart] = 0;
    pixels.copy(scanlines, rowStart + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
  }

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
}

function render() {
  for (let y = 0; y < HEIGHT; y += 1) {
    const band = Math.floor(y / 8);
    const base = band % 2 === 0 ? palette.ink : palette.deep;
    fillRect(0, y, WIDTH, 1, base);
  }

  for (let i = 0; i < 72; i += 1) {
    const x = Math.floor(hashSeed(i) * WIDTH);
    const y = Math.floor(hashSeed(i + 100) * 48);
    const color = i % 4 === 0 ? palette.gold : palette.cyan;
    fillRect(x, y, 1 + (i % 2), 1 + (i % 2), color);
  }

  fillRect(6, 6, 116, 116, palette.shadow);
  fillRect(8, 8, 112, 112, palette.deep);
  drawRect(8, 8, 112, 112, palette.rail);
  drawRect(12, 12, 104, 104, palette.slate);

  fillRect(16, 88, 96, 20, palette.ink);
  for (let x = 18; x <= 108; x += 8) {
    drawLine(64, 72, x, 108, palette.slate);
  }
  for (let y = 92; y <= 108; y += 4) {
    fillRect(18, y, 92, 1, palette.rail);
  }

  fillRect(29, 25, 70, 50, palette.shadow);
  fillRect(32, 28, 64, 44, palette.glass);
  drawRect(32, 28, 64, 44, palette.cyan);
  fillRect(36, 34, 56, 4, palette.slate);
  fillRect(36, 42, 56, 2, palette.rail);
  fillRect(36, 49, 56, 2, palette.rail);
  fillRect(36, 57, 56, 2, palette.rail);
  fillRect(36, 65, 56, 2, palette.rail);

  const ledgerColors = [palette.mint, palette.amber, palette.coral, palette.violet, palette.cyan];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const color = ledgerColors[(row * 2 + col) % ledgerColors.length];
      fillRect(38 + col * 9, 40 + row * 7, 6, 3, color);
      fillRect(38 + col * 9, 44 + row * 7, 4, 1, palette.white);
    }
  }

  fillPixelCircle(64, 23, 13, palette.slate);
  fillPixelCircle(64, 23, 9, palette.cyan);
  fillPixelCircle(64, 23, 5, palette.mint);
  fillRect(61, 20, 6, 6, palette.white);
  fillRect(50, 23, 28, 2, palette.gold);

  fillRect(20, 80, 18, 8, palette.shadow);
  fillRect(22, 78, 14, 8, palette.coral);
  fillRect(25, 80, 8, 2, palette.gold);
  fillRect(92, 80, 18, 8, palette.shadow);
  fillRect(94, 78, 14, 8, palette.mint);
  fillRect(97, 80, 8, 2, palette.white);

  drawLine(22, 82, 46, 67, palette.coral);
  drawLine(106, 82, 82, 67, palette.mint);
  drawLine(64, 74, 64, 108, palette.amber);

  for (let i = 0; i < 6; i += 1) {
    const x = 40 + i * 9;
    const y = 96 + (i % 2) * 5;
    fillRect(x, y, 6, 6, ledgerColors[i % ledgerColors.length]);
    fillRect(x + 2, y + 2, 2, 2, palette.white);
  }

  fillRect(51, 111, 26, 5, palette.gold);
  fillRect(56, 107, 16, 4, palette.amber);
  fillRect(61, 101, 6, 6, palette.coral);

  for (let i = 0; i < 10; i += 1) {
    fillRect(16 + i * 10, 16, 4, 2, i % 3 === 0 ? palette.mint : palette.rail);
    fillRect(18 + i * 10, 18, 2, 2, palette.white);
  }

  fillRect(12, 116, 104, 3, palette.shadow);
  fillRect(14, 114, 100, 2, palette.rail);
}

const outputPath = process.argv[2] || path.join(__dirname, "pixel-ledger-observatory.png");
render();
writePng(outputPath);
