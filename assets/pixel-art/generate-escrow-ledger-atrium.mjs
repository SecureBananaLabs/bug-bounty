import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const WIDTH = 128;
const HEIGHT = 128;
const OUTPUT = "escrow-ledger-atrium.png";
const here = dirname(fileURLToPath(import.meta.url));

const palette = {
  void: rgba("#0a1020"),
  wall: rgba("#111827"),
  wallBand: rgba("#1e293b"),
  shadow: rgba("#020617"),
  steel: rgba("#334155"),
  steelLight: rgba("#64748b"),
  glass: rgba("#17405b"),
  glassDark: rgba("#123047"),
  glassLight: rgba("#67e8f9"),
  cyan: rgba("#22d3ee"),
  cyanDim: rgba("#0e7490"),
  green: rgba("#34d399"),
  greenDark: rgba("#047857"),
  gold: rgba("#fbbf24"),
  amber: rgba("#f59e0b"),
  rose: rgba("#fb7185"),
  violet: rgba("#a78bfa"),
  white: rgba("#f8fafc"),
};

const pixels = new Uint8Array(WIDTH * HEIGHT * 4);

function rgba(hex) {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    255,
  ];
}

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  pixels.set(color, (y * WIDTH + x) * 4);
}

function rect(x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function outline(x, y, width, height, color) {
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

function chunkyLight(cx, cy, color, highlight = palette.white) {
  rect(cx - 2, cy - 1, 5, 3, color);
  rect(cx - 1, cy - 2, 3, 5, color);
  setPixel(cx - 1, cy - 1, highlight);
  setPixel(cx, cy - 1, highlight);
}

function drawBackground() {
  rect(0, 0, WIDTH, HEIGHT, palette.void);
  rect(0, 8, WIDTH, 76, palette.wall);
  rect(0, 18, WIDTH, 3, palette.wallBand);
  rect(0, 72, WIDTH, 2, palette.wallBand);
  rect(0, 84, WIDTH, 44, palette.shadow);

  for (let y = 90; y < HEIGHT; y += 8) {
    line(0, y, WIDTH - 1, y, palette.steel);
  }
  for (let x = -12; x <= WIDTH + 12; x += 16) {
    line(64, 84, x, HEIGHT - 1, palette.steel);
  }

  const sparks = [
    [9, 14], [22, 33], [41, 11], [89, 16], [110, 29], [119, 58],
    [14, 71], [33, 65], [99, 70], [116, 11],
  ];
  for (const [x, y] of sparks) {
    setPixel(x, y, palette.steelLight);
  }
}

function drawAtrium() {
  rect(33, 13, 63, 75, palette.shadow);
  rect(31, 11, 63, 75, palette.steel);
  outline(31, 11, 63, 75, palette.cyan);
  outline(34, 14, 57, 69, palette.cyanDim);
  rect(35, 15, 55, 67, palette.glassDark);

  for (let y = 19; y <= 75; y += 8) {
    rect(39, y, 47, 1, palette.glass);
  }
  for (let x = 43; x <= 82; x += 10) {
    rect(x, 17, 1, 61, palette.glass);
  }

  rect(46, 22, 34, 50, palette.glass);
  outline(46, 22, 34, 50, palette.glassLight);
  rect(50, 27, 26, 4, palette.cyanDim);
  rect(50, 36, 26, 4, palette.greenDark);
  rect(50, 45, 26, 4, palette.violet);
  rect(50, 54, 26, 4, palette.amber);
  rect(50, 63, 26, 4, palette.rose);

  for (let y = 28; y <= 64; y += 9) {
    rect(54, y, 4, 2, palette.white);
    rect(62, y, 12, 2, palette.steelLight);
  }

  rect(39, 78, 50, 5, palette.steel);
  rect(44, 83, 40, 4, palette.cyanDim);
}

function drawRailsAndTiles() {
  rect(6, 49, 29, 3, palette.steel);
  rect(6, 56, 29, 3, palette.steel);
  rect(93, 49, 27, 3, palette.steel);
  rect(93, 56, 27, 3, palette.steel);
  line(35, 50, 46, 38, palette.cyanDim);
  line(35, 57, 46, 58, palette.cyanDim);
  line(80, 38, 94, 50, palette.cyanDim);
  line(80, 58, 94, 57, palette.cyanDim);

  rect(12, 45, 7, 7, palette.green);
  rect(22, 55, 7, 7, palette.violet);
  rect(37, 40, 7, 7, palette.gold);
  rect(84, 40, 7, 7, palette.rose);
  rect(98, 53, 7, 7, palette.green);
  rect(110, 45, 7, 7, palette.gold);

  outline(12, 45, 7, 7, palette.white);
  outline(22, 55, 7, 7, palette.white);
  outline(98, 53, 7, 7, palette.white);
}

function drawAuditGates() {
  rect(18, 26, 8, 38, palette.steel);
  rect(101, 26, 8, 38, palette.steel);
  outline(18, 26, 8, 38, palette.cyanDim);
  outline(101, 26, 8, 38, palette.cyanDim);

  chunkyLight(22, 32, palette.green);
  chunkyLight(22, 44, palette.gold);
  chunkyLight(22, 56, palette.rose);
  chunkyLight(105, 32, palette.green);
  chunkyLight(105, 44, palette.gold);
  chunkyLight(105, 56, palette.rose);
}

function drawSettlementLights() {
  rect(105, 75, 16, 17, palette.steel);
  outline(105, 75, 16, 17, palette.gold);
  chunkyLight(111, 82, palette.gold);
  chunkyLight(116, 87, palette.green);

  rect(7, 76, 18, 13, palette.steel);
  outline(7, 76, 18, 13, palette.cyanDim);
  rect(11, 80, 10, 2, palette.glassLight);
  rect(11, 84, 6, 2, palette.green);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

drawBackground();
drawAtrium();
drawRailsAndTiles();
drawAuditGates();
drawSettlementLights();

const output = join(here, OUTPUT);
writeFileSync(output, encodePng(WIDTH, HEIGHT, pixels));
console.log(`Wrote ${output}`);

function encodePng(width, height, rgbaPixels) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    Buffer.from(rgbaPixels.subarray(y * stride, (y + 1) * stride)).copy(
      raw,
      rowStart + 1,
    );
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND"),
  ]);
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}
