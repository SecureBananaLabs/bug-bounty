import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const width = 128;
const height = 128;
const pixels = new Uint8Array(width * height * 4);

const palette = {
  skyTop: [12, 18, 36, 255],
  skyMid: [19, 31, 55, 255],
  skyLow: [28, 45, 64, 255],
  grid: [37, 61, 83, 255],
  desk: [45, 36, 42, 255],
  deskDark: [29, 24, 32, 255],
  brass: [209, 158, 76, 255],
  amber: [255, 198, 91, 255],
  mint: [93, 220, 177, 255],
  cyan: [74, 190, 215, 255],
  red: [220, 82, 92, 255],
  purple: [132, 104, 222, 255],
  light: [231, 241, 230, 255],
  shadow: [7, 10, 21, 255]
};

function setPixel(x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const offset = (y * width + x) * 4;
  pixels.set(color, offset);
}

function fillRect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function lineH(x, y, w, color) {
  fillRect(x, y, w, 1, color);
}

function lineV(x, y, h, color) {
  fillRect(x, y, 1, h, color);
}

function circle(cx, cy, r, color, hollow = false) {
  const r2 = r * r;
  const inner = (r - 2) * (r - 2);
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d <= r2 && (!hollow || d >= inner)) setPixel(x, y, color);
    }
  }
}

function drawBackground() {
  for (let y = 0; y < height; y += 1) {
    const color = y < 42 ? palette.skyTop : y < 82 ? palette.skyMid : palette.skyLow;
    lineH(0, y, width, color);
  }

  for (let x = 0; x < width; x += 8) lineV(x, 72, 37, palette.grid);
  for (let y = 72; y < 109; y += 8) lineH(0, y, width, palette.grid);
  fillRect(0, 109, 128, 19, palette.shadow);
}

function drawRadar() {
  fillRect(16, 18, 54, 54, palette.shadow);
  fillRect(18, 20, 50, 50, [17, 43, 52, 255]);
  circle(43, 45, 21, palette.cyan, true);
  circle(43, 45, 12, palette.grid, true);
  lineH(22, 45, 42, palette.grid);
  lineV(43, 24, 42, palette.grid);

  for (let i = 0; i < 21; i += 1) {
    setPixel(43 + i, 45 - Math.floor(i * 0.55), palette.mint);
    setPixel(43 + i, 46 - Math.floor(i * 0.55), palette.mint);
  }

  fillRect(54, 30, 4, 4, palette.amber);
  fillRect(31, 53, 3, 3, palette.red);
  fillRect(44, 37, 3, 3, palette.light);
}

function drawChecklist() {
  fillRect(78, 20, 33, 42, palette.shadow);
  fillRect(80, 22, 29, 38, [35, 42, 57, 255]);
  for (let row = 0; row < 4; row += 1) {
    const y = 28 + row * 7;
    fillRect(84, y, 4, 4, row < 3 ? palette.mint : palette.amber);
    lineH(92, y + 1, 12 + row * 2, palette.light);
  }
  fillRect(82, 56, 25, 2, palette.purple);
}

function drawDesk() {
  fillRect(13, 82, 102, 25, palette.desk);
  fillRect(18, 87, 34, 14, [32, 34, 43, 255]);
  fillRect(57, 86, 21, 15, [26, 46, 53, 255]);
  fillRect(86, 86, 21, 14, [38, 32, 49, 255]);
  fillRect(13, 104, 102, 5, palette.deskDark);

  for (let x = 22; x < 48; x += 5) fillRect(x, 92, 3, 3, palette.cyan);
  fillRect(62, 90, 11, 7, palette.amber);
  fillRect(90, 90, 13, 2, palette.light);
  fillRect(90, 95, 10, 2, palette.mint);
}

function drawPayoutRail() {
  fillRect(17, 116, 94, 4, palette.brass);
  for (let x = 24; x <= 96; x += 18) {
    fillRect(x, 112, 8, 8, palette.amber);
    fillRect(x + 2, 114, 4, 4, palette.brass);
  }
  fillRect(105, 111, 8, 10, palette.mint);
  fillRect(108, 114, 2, 4, palette.light);
}

function drawStarsAndSignals() {
  const points = [
    [8, 12, palette.light], [116, 14, palette.mint], [105, 35, palette.cyan],
    [73, 12, palette.amber], [11, 59, palette.purple], [118, 67, palette.red],
    [74, 76, palette.mint], [7, 91, palette.amber]
  ];
  for (const [x, y, color] of points) fillRect(x, y, 2, 2, color);
}

function writePng(path) {
  const raw = new Uint8Array((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    raw.set(pixels.slice(y * width * 4, (y + 1) * width * 4), rowStart + 1);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks = [
    chunk("IHDR", Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0])
    ])),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ];

  writeFileSync(path, Buffer.concat([signature, ...chunks]));
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const crcInput = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([
    uint32(data.length),
    typeBuffer,
    data,
    uint32(crc32(crcInput))
  ]);
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

drawBackground();
drawStarsAndSignals();
drawRadar();
drawChecklist();
drawDesk();
drawPayoutRail();
writePng(new URL("./review-radar-desk.png", import.meta.url));
