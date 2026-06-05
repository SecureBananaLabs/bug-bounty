const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const width = 128;
const height = 128;
const pixels = Buffer.alloc(width * height * 4);

const palette = {
  night: [14, 18, 34, 255],
  deep: [24, 29, 55, 255],
  panel: [37, 46, 82, 255],
  panelHi: [62, 74, 116, 255],
  mint: [68, 217, 160, 255],
  mintHi: [132, 245, 201, 255],
  gold: [241, 183, 77, 255],
  amber: [255, 210, 104, 255],
  coral: [238, 105, 96, 255],
  lavender: [151, 132, 243, 255],
  blue: [79, 156, 239, 255],
  ink: [8, 10, 18, 255],
  leaf: [42, 153, 115, 255],
  leafHi: [88, 210, 151, 255],
  trunk: [131, 86, 49, 255],
  paper: [230, 230, 202, 255],
  white: [244, 247, 255, 255],
  shade: [17, 21, 39, 255],
};

function put(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (y * width + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

function fillRect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) put(xx, yy, color);
  }
}

function rect(x, y, w, h, color) {
  fillRect(x, y, w, 1, color);
  fillRect(x, y + h - 1, w, 1, color);
  fillRect(x, y, 1, h, color);
  fillRect(x + w - 1, y, 1, h, color);
}

function line(x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
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

function ditherRect(x, y, w, h, a, b) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) put(xx, yy, (xx + yy) % 4 === 0 ? b : a);
  }
}

function star(x, y, color) {
  put(x, y, color);
  put(x - 1, y, color);
  put(x + 1, y, color);
  put(x, y - 1, color);
  put(x, y + 1, color);
}

function drawDigit(x, y, digit, color) {
  const glyphs = {
    0: ["111", "101", "101", "101", "111"],
    1: ["010", "110", "010", "010", "111"],
    2: ["111", "001", "111", "100", "111"],
    3: ["111", "001", "111", "001", "111"],
    4: ["101", "101", "111", "001", "001"],
    5: ["111", "100", "111", "001", "111"],
    6: ["111", "100", "111", "101", "111"],
    7: ["111", "001", "010", "010", "010"],
    8: ["111", "101", "111", "101", "111"],
    9: ["111", "101", "111", "001", "111"],
  }[digit];
  glyphs.forEach((row, yy) => {
    [...row].forEach((cell, xx) => {
      if (cell === "1") fillRect(x + xx * 2, y + yy * 2, 2, 2, color);
    });
  });
}

function drawLedgerTile(x, y, color, accent) {
  fillRect(x, y, 12, 10, color);
  rect(x, y, 12, 10, palette.ink);
  fillRect(x + 2, y + 2, 8, 2, accent);
  fillRect(x + 2, y + 6, 4, 2, palette.paper);
}

function drawOrchard() {
  ditherRect(0, 0, width, height, palette.night, palette.deep);
  fillRect(0, 99, width, 29, palette.shade);
  fillRect(0, 103, width, 25, palette.ink);
  fillRect(0, 100, width, 3, palette.panelHi);

  const stars = [
    [10, 12], [25, 18], [44, 9], [76, 15], [100, 10], [115, 24],
    [17, 36], [58, 31], [91, 36], [111, 48],
  ];
  stars.forEach(([x, y], index) => star(x, y, index % 3 === 0 ? palette.amber : palette.white));

  fillRect(8, 76, 112, 30, palette.panel);
  rect(8, 76, 112, 30, palette.ink);
  fillRect(12, 80, 104, 3, palette.panelHi);
  fillRect(18, 87, 26, 12, palette.deep);
  fillRect(51, 87, 26, 12, palette.deep);
  fillRect(84, 87, 26, 12, palette.deep);
  rect(18, 87, 26, 12, palette.ink);
  rect(51, 87, 26, 12, palette.ink);
  rect(84, 87, 26, 12, palette.ink);
  drawDigit(22, 89, 4, palette.mintHi);
  drawDigit(31, 89, 2, palette.mintHi);
  drawDigit(55, 89, 8, palette.amber);
  drawDigit(64, 89, 0, palette.amber);
  drawDigit(88, 89, 9, palette.coral);
  drawDigit(97, 89, 5, palette.coral);

  fillRect(57, 36, 14, 43, palette.trunk);
  fillRect(53, 49, 22, 8, palette.trunk);
  fillRect(62, 29, 4, 26, palette.trunk);
  fillRect(44, 30, 39, 18, palette.leaf);
  fillRect(35, 42, 59, 20, palette.leaf);
  fillRect(42, 58, 44, 16, palette.leaf);
  fillRect(49, 33, 24, 8, palette.leafHi);
  fillRect(39, 46, 18, 7, palette.leafHi);
  fillRect(72, 46, 16, 7, palette.leafHi);
  rect(44, 30, 39, 18, palette.ink);
  rect(35, 42, 59, 20, palette.ink);
  rect(42, 58, 44, 16, palette.ink);

  const fruit = [
    [47, 40, palette.gold], [63, 36, palette.amber], [79, 43, palette.coral],
    [55, 53, palette.mintHi], [71, 55, palette.blue], [45, 62, palette.lavender],
    [84, 61, palette.gold],
  ];
  fruit.forEach(([x, y, c]) => {
    fillRect(x, y, 4, 4, c);
    put(x + 1, y + 1, palette.white);
  });

  drawLedgerTile(18, 57, palette.panelHi, palette.mint);
  drawLedgerTile(28, 68, palette.panelHi, palette.gold);
  drawLedgerTile(86, 57, palette.panelHi, palette.lavender);
  drawLedgerTile(76, 68, palette.panelHi, palette.blue);

  line(64, 74, 64, 86, palette.mintHi);
  line(64, 86, 31, 86, palette.mint);
  line(64, 86, 96, 86, palette.mint);
  line(31, 86, 31, 80, palette.gold);
  line(96, 86, 96, 80, palette.lavender);

  fillRect(12, 108, 22, 8, palette.deep);
  fillRect(94, 108, 22, 8, palette.deep);
  rect(12, 108, 22, 8, palette.panelHi);
  rect(94, 108, 22, 8, palette.panelHi);
  fillRect(18, 110, 10, 4, palette.mint);
  fillRect(100, 110, 10, 4, palette.gold);

  fillRect(45, 112, 38, 7, palette.panel);
  rect(45, 112, 38, 7, palette.panelHi);
  fillRect(50, 114, 6, 3, palette.coral);
  fillRect(61, 114, 6, 3, palette.amber);
  fillRect(72, 114, 6, 3, palette.mint);
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([len, name, data, crc]);
}

function encodePng() {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
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
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

drawOrchard();

const out = path.join(__dirname, "pixel-ledger-orchard.png");
fs.writeFileSync(out, encodePng());
console.log(`Wrote ${out}`);
