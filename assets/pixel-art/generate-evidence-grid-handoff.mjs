import fs from "node:fs";
import zlib from "node:zlib";

const width = 128;
const height = 128;
const pixels = new Uint8Array(width * height * 4);

const palette = {
  ink: [8, 13, 31, 255],
  grid: [20, 33, 63, 255],
  panel: [30, 45, 82, 255],
  panelDark: [18, 26, 51, 255],
  edge: [92, 132, 190, 255],
  paper: [225, 234, 244, 255],
  paperShade: [161, 181, 204, 255],
  cyan: [93, 229, 231, 255],
  mint: [97, 231, 170, 255],
  gold: [245, 197, 73, 255],
  orange: [236, 127, 61, 255],
  red: [238, 82, 83, 255],
  violet: [157, 122, 242, 255],
  white: [248, 252, 255, 255],
  shadow: [4, 8, 18, 255]
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = (y * width + x) * 4;
  pixels.set(color, offset);
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) setPixel(xx, yy, color);
  }
}

function frame(x, y, w, h, fill, border = palette.edge) {
  rect(x, y, w, h, border);
  rect(x + 2, y + 2, w - 4, h - 4, fill);
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

function glyphCheck(x, y, color) {
  rect(x, y + 4, 3, 3, color);
  rect(x + 3, y + 7, 3, 3, color);
  rect(x + 6, y + 4, 3, 3, color);
  rect(x + 9, y + 1, 3, 3, color);
}

function drawCard(x, y) {
  rect(x + 4, y + 5, 33, 42, palette.shadow);
  frame(x, y, 35, 42, palette.paper, palette.paperShade);
  rect(x + 5, y + 7, 20, 3, palette.violet);
  rect(x + 5, y + 14, 25, 2, palette.panel);
  rect(x + 5, y + 20, 17, 2, palette.panel);
  rect(x + 5, y + 26, 23, 2, palette.panel);
  rect(x + 5, y + 32, 10, 2, palette.mint);
  glyphCheck(x + 20, y + 29, palette.mint);
}

function drawCoin(x, y) {
  rect(x + 4, y, 13, 2, palette.gold);
  rect(x + 1, y + 2, 19, 4, palette.gold);
  rect(x, y + 6, 21, 9, palette.gold);
  rect(x + 1, y + 15, 19, 4, palette.orange);
  rect(x + 4, y + 19, 13, 2, palette.orange);
  rect(x + 8, y + 4, 5, 15, palette.white);
  rect(x + 6, y + 7, 9, 2, palette.white);
}

function drawShield(x, y) {
  rect(x + 7, y, 18, 3, palette.cyan);
  rect(x + 3, y + 3, 26, 6, palette.cyan);
  rect(x + 5, y + 9, 22, 7, palette.cyan);
  rect(x + 8, y + 16, 16, 6, palette.cyan);
  rect(x + 12, y + 22, 8, 4, palette.cyan);
  rect(x + 10, y + 7, 12, 10, palette.panelDark);
  glyphCheck(x + 11, y + 7, palette.mint);
}

function drawCircuitNode(x, y, color) {
  rect(x - 2, y - 2, 5, 5, color);
  rect(x - 1, y - 1, 3, 3, palette.white);
}

function background() {
  rect(0, 0, width, height, palette.ink);
  for (let x = 0; x < width; x += 8) line(x, 0, x, height - 1, palette.grid);
  for (let y = 0; y < height; y += 8) line(0, y, width - 1, y, palette.grid);
  rect(0, 101, width, 27, palette.panelDark);
  for (let x = 4; x < width; x += 12) rect(x, 108, 6, 2, palette.grid);
}

function drawScene() {
  background();

  frame(11, 12, 106, 78, palette.panel, palette.edge);
  rect(15, 16, 98, 5, palette.panelDark);
  rect(18, 18, 9, 2, palette.red);
  rect(31, 18, 9, 2, palette.gold);
  rect(44, 18, 9, 2, palette.mint);

  drawCard(47, 30);
  drawShield(15, 34);
  drawCoin(91, 36);

  line(33, 47, 48, 47, palette.cyan);
  line(82, 48, 91, 48, palette.gold);
  line(64, 72, 64, 91, palette.violet);
  drawCircuitNode(38, 47, palette.cyan);
  drawCircuitNode(88, 48, palette.gold);
  drawCircuitNode(64, 91, palette.violet);

  frame(18, 73, 23, 14, palette.panelDark, palette.cyan);
  glyphCheck(23, 74, palette.mint);
  frame(87, 73, 23, 14, palette.panelDark, palette.gold);
  glyphCheck(92, 74, palette.mint);
  frame(50, 94, 28, 16, palette.panel, palette.violet);
  rect(55, 99, 18, 2, palette.paper);
  rect(55, 104, 11, 2, palette.mint);

  rect(21, 105, 19, 6, palette.edge);
  rect(43, 105, 42, 6, palette.panel);
  rect(88, 105, 19, 6, palette.edge);
  rect(26, 112, 76, 4, palette.shadow);
  for (let x = 31; x < 98; x += 7) rect(x, 106, 3, 3, palette.mint);

  rect(9, 96, 7, 7, palette.cyan);
  rect(112, 96, 7, 7, palette.gold);
  rect(6, 105, 3, 11, palette.cyan);
  rect(119, 105, 3, 11, palette.gold);
}

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function writePng(path) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    raw.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), row + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  fs.writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0))
    ])
  );
}

drawScene();
writePng(new URL("./evidence-grid-handoff.png", import.meta.url));
