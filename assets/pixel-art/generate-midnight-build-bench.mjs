import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const width = 128;
const height = 128;
const rgba = new Uint8Array(width * height * 4);

const colors = {
  bg0: [7, 10, 24, 255],
  bg1: [13, 18, 42, 255],
  wall: [22, 30, 58, 255],
  shadow: [5, 7, 15, 255],
  desk: [65, 44, 42, 255],
  deskHi: [109, 72, 55, 255],
  lamp: [238, 194, 93, 255],
  lampSoft: [139, 96, 52, 255],
  paper: [226, 213, 167, 255],
  paperLine: [111, 92, 78, 255],
  terminal: [14, 20, 31, 255],
  terminalEdge: [54, 70, 93, 255],
  green: [64, 232, 132, 255],
  greenDim: [28, 116, 78, 255],
  blue: [82, 172, 244, 255],
  red: [239, 78, 78, 255],
  amber: [245, 180, 66, 255],
  purple: [156, 116, 255, 255],
  banana: [246, 218, 94, 255],
  bananaDark: [174, 133, 47, 255],
  steel: [117, 132, 158, 255],
  darkSteel: [46, 56, 75, 255]
};

function put(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (y * width + x) * 4;
  rgba.set(color, i);
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) put(xx, yy, color);
  }
}

function line(x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;

  while (true) {
    put(x, y, color);
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

function borderRect(x, y, w, h, fill, border) {
  rect(x, y, w, h, border);
  rect(x + 2, y + 2, w - 4, h - 4, fill);
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

function writePng(path) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    const row = rgba.subarray(y * width * 4, (y + 1) * width * 4);
    row.copy?.(raw, y * (width * 4 + 1) + 1);
    if (!row.copy) Buffer.from(row).copy(raw, y * (width * 4 + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);

  writeFileSync(path, png);
}

rect(0, 0, width, height, colors.bg0);
for (let y = 0; y < height; y += 1) {
  const stripe = y % 12 < 6 ? colors.bg0 : colors.bg1;
  rect(0, y, width, 1, stripe);
}

rect(8, 12, 112, 76, colors.wall);
rect(8, 86, 112, 4, colors.shadow);
for (let x = 16; x <= 112; x += 16) line(x, 18, x, 82, colors.darkSteel);
for (let y = 24; y <= 76; y += 16) line(12, y, 116, y, colors.darkSteel);

rect(14, 93, 100, 19, colors.desk);
rect(14, 91, 100, 4, colors.deskHi);
rect(20, 112, 8, 11, colors.shadow);
rect(98, 112, 8, 11, colors.shadow);

borderRect(52, 39, 46, 31, colors.terminal, colors.terminalEdge);
rect(57, 45, 35, 3, colors.green);
rect(57, 52, 21, 3, colors.greenDim);
rect(80, 52, 8, 3, colors.green);
rect(57, 59, 31, 3, colors.greenDim);
rect(92, 65, 6, 18, colors.darkSteel);
rect(47, 83, 57, 7, colors.terminalEdge);
for (let x = 51; x < 99; x += 6) rect(x, 85, 3, 2, colors.greenDim);

borderRect(22, 57, 24, 28, colors.paper, colors.paperLine);
rect(27, 63, 14, 2, colors.paperLine);
rect(27, 70, 10, 2, colors.paperLine);
rect(27, 77, 15, 2, colors.paperLine);
rect(36, 53, 7, 7, colors.banana);
rect(39, 55, 5, 5, colors.bananaDark);

rect(16, 32, 7, 48, colors.darkSteel);
rect(18, 28, 30, 6, colors.darkSteel);
rect(42, 31, 12, 8, colors.lamp);
rect(36, 39, 28, 20, colors.lampSoft);
for (let y = 39; y < 59; y += 2) {
  const inset = Math.floor((y - 39) / 3);
  rect(36 + inset, y, 28 - inset * 2, 1, [139, 96, 52, 65]);
}

rect(106, 49, 8, 38, colors.darkSteel);
rect(101, 43, 18, 8, colors.steel);
rect(104, 46, 3, 3, colors.red);
rect(110, 46, 3, 3, colors.amber);
rect(116, 46, 3, 3, colors.green);
rect(104, 58, 10, 3, colors.blue);
rect(104, 66, 13, 3, colors.purple);
rect(104, 74, 8, 3, colors.banana);

line(44, 69, 53, 66, colors.blue);
line(98, 56, 104, 58, colors.blue);
line(46, 78, 64, 83, colors.amber);
line(92, 83, 106, 75, colors.green);

rect(4, 120, 120, 3, colors.shadow);
rect(31, 100, 7, 2, colors.green);
rect(42, 100, 7, 2, colors.blue);
rect(53, 100, 7, 2, colors.amber);
rect(64, 100, 7, 2, colors.purple);
rect(75, 100, 7, 2, colors.banana);

for (let i = 0; i < 42; i += 1) {
  const x = (i * 29 + 13) % width;
  const y = (i * 47 + 7) % 36;
  put(x, y, i % 3 === 0 ? colors.blue : colors.steel);
}

const output = join(dirname(fileURLToPath(import.meta.url)), "midnight-build-bench.png");
writePng(output);
console.log(`wrote ${output}`);
