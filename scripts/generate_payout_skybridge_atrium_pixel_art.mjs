import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const WIDTH = 128;
const HEIGHT = 128;
const OUTPUT = "assets/pixel-art/payout-skybridge-atrium.png";

const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

const palette = {
  nightTop: [10, 18, 32, 255],
  nightLow: [19, 33, 48, 255],
  grid: [35, 59, 71, 255],
  glass: [58, 113, 138, 196],
  glassDark: [27, 63, 79, 255],
  steel: [94, 111, 121, 255],
  steelDark: [45, 60, 67, 255],
  copper: [208, 127, 68, 255],
  amber: [248, 190, 82, 255],
  teal: [91, 214, 194, 255],
  mint: [149, 245, 181, 255],
  pink: [236, 93, 132, 255],
  violet: [143, 117, 255, 255],
  blue: [85, 171, 247, 255],
  cream: [244, 228, 184, 255],
  shadow: [8, 13, 22, 255],
};

function mix(a, b, amount) {
  return [
    Math.round(a[0] * (1 - amount) + b[0] * amount),
    Math.round(a[1] * (1 - amount) + b[1] * amount),
    Math.round(a[2] * (1 - amount) + b[2] * amount),
    255,
  ];
}

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3] ?? 255;
}

function rect(x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) setPixel(xx, yy, color);
  }
}

function strokeRect(x, y, width, height, color) {
  rect(x, y, width, 1, color);
  rect(x, y + height - 1, width, 1, color);
  rect(x, y, 1, height, color);
  rect(x + width - 1, y, 1, height, color);
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
    const twiceErr = 2 * err;
    if (twiceErr >= dy) {
      err += dy;
      x0 += sx;
    }
    if (twiceErr <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function disc(cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(x, y, color);
    }
  }
}

function fillBackground() {
  for (let y = 0; y < HEIGHT; y += 1) {
    const base = mix(palette.nightTop, palette.nightLow, y / (HEIGHT - 1));
    for (let x = 0; x < WIDTH; x += 1) {
      const dither = ((x * 7 + y * 5) % 23 === 0) ? 7 : 0;
      setPixel(x, y, [base[0] + dither, base[1] + dither, base[2] + dither, 255]);
    }
  }

  for (const [x, y, color] of [
    [13, 12, palette.blue],
    [24, 24, palette.cream],
    [42, 15, palette.teal],
    [96, 13, palette.violet],
    [112, 28, palette.amber],
    [76, 25, palette.cream],
    [9, 42, palette.teal],
    [119, 47, palette.blue],
  ]) {
    rect(x, y, 2, 2, color);
  }
}

function drawAtriumFrame() {
  rect(0, 116, 128, 12, palette.shadow);
  rect(0, 115, 128, 1, palette.grid);

  for (let x = 8; x < 128; x += 12) line(x, 115, 64, 69, palette.grid);
  for (let y = 78; y <= 114; y += 8) line(18, y, 110, y, palette.grid);

  rect(15, 50, 98, 26, palette.glassDark);
  rect(18, 53, 92, 20, palette.glass);
  strokeRect(14, 49, 100, 28, palette.steel);
  rect(19, 54, 90, 3, mix(palette.teal, palette.cream, 0.3));
  rect(21, 61, 86, 1, mix(palette.blue, palette.glass, 0.4));
  rect(21, 67, 86, 1, mix(palette.blue, palette.glass, 0.2));

  for (let x = 25; x <= 101; x += 12) {
    rect(x, 52, 2, 22, palette.steelDark);
    rect(x + 1, 53, 1, 20, palette.steel);
  }

  for (let y = 26; y <= 50; y += 1) {
    const left = Math.round(26 + Math.abs(38 - y) * 0.95);
    const right = Math.round(102 - Math.abs(38 - y) * 0.95);
    setPixel(left, y, palette.steel);
    setPixel(right, y, palette.steel);
  }
  rect(42, 26, 44, 2, palette.steel);
  rect(43, 29, 42, 2, palette.glass);
}

function drawSkybridge() {
  for (let y = 63; y <= 111; y += 1) {
    const t = (y - 63) / 48;
    const left = Math.round(47 - t * 28);
    const right = Math.round(81 + t * 28);
    const color = y % 5 === 0 ? mix(palette.glassDark, palette.blue, 0.25) : palette.glassDark;
    rect(left, y, right - left, 1, color);
  }

  line(47, 63, 19, 111, palette.teal);
  line(81, 63, 109, 111, palette.teal);
  line(53, 65, 30, 111, palette.steel);
  line(75, 65, 98, 111, palette.steel);

  for (let y = 71; y <= 103; y += 8) {
    const t = (y - 63) / 48;
    line(Math.round(47 - t * 28), y, Math.round(81 + t * 28), y, mix(palette.blue, palette.teal, 0.4));
  }

  rect(56, 88, 16, 3, palette.amber);
  rect(57, 91, 14, 2, palette.copper);
  rect(60, 83, 8, 5, palette.cream);
  rect(61, 84, 2, 1, palette.amber);
  rect(65, 84, 2, 1, palette.amber);

  for (const [x, y, color] of [
    [42, 69, palette.pink],
    [49, 72, palette.teal],
    [57, 75, palette.amber],
    [66, 78, palette.mint],
    [76, 81, palette.violet],
  ]) {
    rect(x, y, 5, 3, color);
    rect(x + 1, y - 1, 3, 1, mix(color, palette.cream, 0.45));
  }
}

function drawStations() {
  const stations = [
    [8, 90, 20, 17, palette.blue, palette.teal],
    [34, 96, 18, 16, palette.violet, palette.pink],
    [76, 96, 18, 16, palette.mint, palette.teal],
    [101, 90, 19, 18, palette.amber, palette.copper],
  ];

  for (const [x, y, width, height, glow, trim] of stations) {
    rect(x - 1, y + height, width + 2, 3, palette.shadow);
    rect(x, y, width, height, palette.steelDark);
    rect(x + 2, y + 2, width - 4, height - 5, mix(palette.glassDark, glow, 0.35));
    strokeRect(x, y, width, height, trim);
    rect(x + 4, y + height - 4, width - 8, 2, glow);
  }

  rect(13, 84, 10, 4, palette.teal);
  rect(39, 91, 8, 3, palette.pink);
  rect(80, 91, 10, 3, palette.mint);
  rect(106, 84, 9, 4, palette.amber);
}

function drawBeacon() {
  disc(64, 38, 11, palette.copper);
  disc(64, 38, 8, palette.amber);
  rect(61, 31, 5, 3, palette.cream);
  rect(58, 38, 12, 2, palette.copper);
  rect(62, 34, 2, 9, palette.cream);
  rect(66, 34, 2, 9, palette.cream);
  line(64, 49, 64, 62, palette.amber);
  rect(61, 59, 7, 5, palette.amber);
  rect(62, 60, 5, 3, palette.cream);
}

function drawPixelTag() {
  const digits = {
    8: ["111", "101", "111", "101", "111"],
    0: ["111", "101", "101", "101", "111"],
  };

  let x = 112;
  for (const digit of "80") {
    const rows = digits[digit];
    for (let y = 0; y < rows.length; y += 1) {
      for (let xx = 0; xx < rows[y].length; xx += 1) {
        if (rows[y][xx] === "1") rect(x + xx * 2, 8 + y * 2, 2, 2, palette.cream);
      }
    }
    x += 8;
  }
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodePng() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 4));
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowOffset = y * (1 + WIDTH * 4);
    raw[rowOffset] = 0;
    pixels.copy(raw, rowOffset + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

fillBackground();
drawAtriumFrame();
drawSkybridge();
drawStations();
drawBeacon();
drawPixelTag();

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, encodePng());
console.log(`Generated ${OUTPUT} (${WIDTH}x${HEIGHT})`);
