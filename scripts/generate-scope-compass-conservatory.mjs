import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const WIDTH = 128;
const HEIGHT = 128;
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, "../assets/pixel-art/scope-compass-conservatory.png");

const palette = {
  skyTop: hex("#071321"),
  skyBottom: hex("#123447"),
  skyDither: hex("#0b1e2e"),
  aurora: hex("#2dd4bf"),
  auroraSoft: hex("#1e6f73"),
  moon: hex("#ffd166"),
  moonShade: hex("#c98b1f"),
  frameDark: hex("#0b2a32"),
  frame: hex("#2dd4bf"),
  frameBright: hex("#8ef3dc"),
  glass: hex("#123d4a"),
  glassAlt: hex("#174d5b"),
  floor: hex("#152032"),
  floorLine: hex("#304357"),
  gold: hex("#f7c948"),
  goldDark: hex("#b7791f"),
  green: hex("#78d17d"),
  coral: hex("#f9735b"),
  cream: hex("#fff3c4"),
  packet: hex("#a7f3d0"),
  packetDark: hex("#075e54"),
  shadow: hex("#061018"),
};

const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

function hex(value, alpha = 255) {
  const normalized = value.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    alpha,
  ];
}

function mix(from, to, amount) {
  return from.map((component, index) =>
    index === 3
      ? 255
      : Math.round(component + (to[index] - component) * amount),
  );
}

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const index = (Math.floor(y) * WIDTH + Math.floor(x)) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function rect(x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function line(x0, y0, x1, y1, color, thickness = 1) {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let x = x0;
  let y = y0;
  const offset = Math.floor(thickness / 2);

  while (true) {
    rect(x - offset, y - offset, thickness, thickness, color);
    if (x === x1 && y === y1) break;
    const doubleError = 2 * error;
    if (doubleError >= dy) {
      error += dy;
      x += sx;
    }
    if (doubleError <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function ellipse(cx, cy, rx, ry, color) {
  for (let yy = -ry; yy <= ry; yy += 1) {
    for (let xx = -rx; xx <= rx; xx += 1) {
      if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) <= 1) {
        setPixel(cx + xx, cy + yy, color);
      }
    }
  }
}

function diamond(cx, cy, radius, color) {
  for (let yy = -radius; yy <= radius; yy += 1) {
    const span = radius - Math.abs(yy);
    rect(cx - span, cy + yy, span * 2 + 1, 1, color);
  }
}

function packet(x, y, color = palette.packet) {
  rect(x, y + 1, 6, 4, palette.shadow);
  rect(x + 1, y, 5, 4, palette.packetDark);
  rect(x + 2, y + 1, 3, 2, color);
  setPixel(x + 5, y + 3, palette.frameBright);
}

function drawSky() {
  for (let y = 0; y < HEIGHT; y += 1) {
    const base = y < 98 ? mix(palette.skyTop, palette.skyBottom, y / 98) : palette.floor;
    for (let x = 0; x < WIDTH; x += 1) {
      const color = (x * 3 + y * 5) % 23 === 0 && y < 94
        ? mix(base, palette.skyDither, 0.35)
        : base;
      setPixel(x, y, color);
    }
  }

  line(6, 30, 68, 13, palette.auroraSoft, 2);
  line(22, 35, 102, 20, mix(palette.auroraSoft, palette.aurora, 0.35), 1);
  line(11, 43, 93, 33, palette.auroraSoft, 1);

  for (const [x, y, size] of [
    [14, 12, 1],
    [31, 21, 2],
    [49, 9, 1],
    [73, 15, 1],
    [84, 30, 2],
    [111, 11, 1],
    [118, 40, 1],
    [10, 61, 1],
    [39, 49, 1],
    [102, 59, 1],
  ]) {
    rect(x, y, size, size, palette.cream);
  }

  ellipse(106, 25, 11, 15, palette.moon);
  ellipse(111, 22, 10, 15, mix(palette.skyTop, palette.skyBottom, 0.2));
  rect(99, 29, 3, 2, palette.moonShade);
  rect(101, 36, 2, 2, palette.moonShade);
}

function domeTopYForX(cx, baseY, rx, ry, x) {
  const dx = Math.max(-1, Math.min(1, (x - cx) / rx));
  return baseY - Math.round(Math.sqrt(1 - dx * dx) * ry);
}

function drawConservatory() {
  const cx = 64;
  const baseY = 98;
  const rx = 55;
  const ry = 52;

  for (let y = baseY - ry; y <= baseY; y += 1) {
    const normalizedY = (y - baseY) / ry;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)) * rx);
    for (let x = cx - span; x <= cx + span; x += 1) {
      setPixel(x, y, (x + y) % 7 === 0 ? palette.glassAlt : palette.glass);
    }
  }

  for (let y = baseY - ry; y <= baseY; y += 1) {
    const normalizedY = (y - baseY) / ry;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)) * rx);
    rect(cx - span - 1, y, 3, 1, palette.frame);
    rect(cx + span - 1, y, 3, 1, palette.frame);
  }

  for (const x of [18, 29, 41, 52, 64, 76, 87, 99, 110]) {
    line(x, domeTopYForX(cx, baseY, rx, ry, x) + 1, x, baseY, palette.frameDark, 1);
    if (x === 64 || x === 41 || x === 87) {
      line(x + 1, domeTopYForX(cx, baseY, rx, ry, x) + 5, x + 1, baseY, palette.frameBright, 1);
    }
  }

  for (const y of [59, 72, 85]) {
    const normalizedY = (y - baseY) / ry;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)) * rx);
    for (let x = cx - span; x <= cx + span; x += 2) {
      setPixel(x, y, palette.frame);
    }
  }

  rect(9, baseY, 111, 4, palette.frameDark);
  rect(12, baseY + 1, 105, 1, palette.frameBright);
  rect(0, 102, WIDTH, 26, palette.floor);
  for (let x = -10; x < WIDTH; x += 16) {
    line(x, 104, x + 38, 127, palette.floorLine, 1);
  }
  for (let y = 108; y < HEIGHT; y += 8) {
    line(0, y, WIDTH - 1, y, palette.floorLine, 1);
  }
}

function drawCompass() {
  const cx = 64;
  const cy = 77;

  diamond(cx, cy, 22, palette.frameDark);
  diamond(cx, cy, 19, palette.glassAlt);
  diamond(cx, cy, 14, palette.skyTop);

  line(cx, cy - 26, cx, cy + 26, palette.goldDark, 2);
  line(cx - 26, cy, cx + 26, cy, palette.goldDark, 2);
  line(cx - 18, cy - 18, cx + 18, cy + 18, palette.frame, 1);
  line(cx + 18, cy - 18, cx - 18, cy + 18, palette.frame, 1);

  for (let step = 0; step < 10; step += 1) {
    rect(cx - step, cy - 25 + step * 2, step * 2 + 1, 2, palette.gold);
    rect(cx - step, cy + 24 - step * 2, step * 2 + 1, 2, palette.green);
    rect(cx + 24 - step * 2, cy - step, 2, step * 2 + 1, palette.coral);
    rect(cx - 25 + step * 2, cy - step, 2, step * 2 + 1, palette.frameBright);
  }

  diamond(cx, cy, 5, palette.cream);
  diamond(cx, cy, 3, palette.goldDark);
  rect(cx - 1, cy - 1, 3, 3, palette.cream);

  packet(35, 82, palette.cream);
  packet(50, 59, palette.packet);
  packet(76, 58, palette.gold);
  packet(88, 84, palette.green);
}

function drawPlantersAndLights() {
  rect(21, 93, 18, 7, palette.frameDark);
  rect(24, 89, 4, 7, palette.green);
  rect(31, 87, 5, 9, palette.packet);
  rect(25, 86, 2, 2, palette.gold);
  rect(35, 84, 2, 2, palette.coral);

  rect(89, 93, 18, 7, palette.frameDark);
  rect(92, 88, 5, 8, palette.green);
  rect(100, 90, 4, 6, palette.packet);
  rect(96, 85, 2, 2, palette.gold);
  rect(103, 87, 2, 2, palette.coral);

  line(18, 52, 34, 67, palette.frameBright, 1);
  line(110, 53, 94, 68, palette.frameBright, 1);
  rect(16, 50, 5, 5, palette.gold);
  rect(107, 51, 5, 5, palette.gold);
  rect(18, 52, 1, 1, palette.cream);
  rect(109, 53, 1, 1, palette.cream);
}

function encodePng() {
  const scanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * (WIDTH * 4 + 1);
    scanlines[rowStart] = 0;
    pixels.copy(scanlines, rowStart + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < crcTable.length; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const body = Buffer.concat([typeBuffer, data]);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(body), 8 + data.length);
  return output;
}

drawSky();
drawConservatory();
drawCompass();
drawPlantersAndLights();

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, encodePng());
console.log(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT})`);
