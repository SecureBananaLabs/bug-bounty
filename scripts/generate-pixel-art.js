/**
 * Generate a 128x128 pixel art PNG — "Settlement Sentinel"
 * A shield motif representing secure payment settlement.
 *
 * Run: node scripts/generate-pixel-art.js
 */

const fs = require("fs");
const zlib = require("zlib");

const W = 128, H = 128;

// ── palette ──
const C = {
  bg:       [0x1a, 0x1b, 0x2f, 0xff], // deep navy
  shield1:  [0x2d, 0x3a, 0x6b, 0xff], // medium blue
  shield2:  [0x3d, 0x4e, 0x8b, 0xff], // lighter blue
  shield3:  [0x52, 0x6b, 0xbb, 0xff], // highlight blue
  edge:     [0xc8, 0xa4, 0x4e, 0xff], // gold edge
  gold:     [0xf0, 0xc6, 0x5c, 0xff], // bright gold
  check:    [0x5c, 0xd4, 0x7c, 0xff], // green check
  dark:     [0x11, 0x12, 0x22, 0xff], // darker bg
  star:     [0xff, 0xff, 0xff, 0xff], // white
  none:     [0x00, 0x00, 0x00, 0x00], // transparent
};

const buf = Buffer.alloc(W * H * 4, 0);

function set(x, y, [r, g, b, a]) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
}

function fill(c) {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      set(x, y, c);
}

function rect(x0, y0, w, h, c) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++)
      set(x, y, c);
}

function hline(x0, x1, y, c) { for (let x = x0; x <= x1; x++) set(x, y, c); }
function vline(x, y0, y1, c) { for (let y = y0; y <= y1; y++) set(x, y, c); }

function drawShield(cx, cy, size, c1, c2, c3, edge) {
  const half = Math.floor(size / 2);
  const q = Math.floor(size / 5);

  // Main body
  for (let y = -half; y <= half; y++) {
    const rowProgress = (y + half) / (size);
    const widen = Math.floor(4 * Math.sin(rowProgress * Math.PI));
    const rowWidth = half + widen;
    const c = y < 0 ? c1 : (y < half * 0.6 ? c2 : c3);

    for (let x = -rowWidth; x <= rowWidth; x++) {
      set(cx + x, cy + y, c);
    }
  }

  // Gold edge
  for (let y = -half; y <= half; y++) {
    const rowProgress = (y + half) / (size);
    const widen = Math.floor(4 * Math.sin(rowProgress * Math.PI));
    const rw = half + widen;
    set(cx - rw, cy + y, edge);
    set(cx + rw, cy + y, edge);
    set(cx - rw + 1, cy + y, edge);
    set(cx + rw - 1, cy + y, edge);
  }
  // Top edge
  hline(cx - half - 2, cx + half + 2, cy - half, edge);
  hline(cx - half - 1, cx + half + 1, cy - half - 1, edge);
  // Bottom point
  const bottom = cy + half;
  for (let dx = -2; dx <= 2; dx++)
    set(cx + dx, bottom, edge);
  set(cx, bottom + 1, edge);
  set(cx - 1, bottom + 1, edge);
  set(cx + 1, bottom + 1, edge);
}

function drawCheck(cx, cy, size, c) {
  // Check mark
  const pts = [
    [cx - size/2, cy],
    [cx - size/4, cy + size/3],
    [cx + size/2, cy - size/3],
  ];
  for (let t = 0; t <= 100; t++) {
    const f = t / 100;
    const px0 = pts[0][0] + (pts[1][0] - pts[0][0]) * f;
    const py0 = pts[0][1] + (pts[1][1] - pts[0][1]) * f;
    const px1 = pts[1][0] + (pts[2][0] - pts[1][0]) * f;
    const py1 = pts[1][1] + (pts[2][1] - pts[1][1]) * f;

    const ix0 = Math.round(px0), iy0 = Math.round(py0);
    const ix1 = Math.round(px1), iy1 = Math.round(py1);
    if (ix0 >= 0 && ix0 < W && iy0 >= 0 && iy0 < H) set(ix0, iy0, c);
    if (ix1 >= 0 && ix1 < W && iy1 >= 0 && iy1 < H) set(ix1, iy1, c);

    // Thicker check
    if (t % 2 === 0) {
      if (ix0+1 < W) set(ix0+1, iy0, c);
      if (iy0+1 < H) set(ix0, iy0+1, c);
      if (ix1+1 < W) set(ix1+1, iy1, c);
      if (iy1+1 < H) set(ix1, iy1+1, c);
    }
  }
}

function drawStars() {
  const starPositions = [
    [18, 15], [110, 12], [105, 100], [22, 105], [64, 5],
    [12, 55], [116, 55], [55, 15], [75, 110], [95, 20],
  ];
  for (const [sx, sy] of starPositions) {
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        if (Math.abs(dx) + Math.abs(dy) <= 1)
          set(sx + dx, sy + dy, C.star);
  }
}

// ── Render ──
fill(C.bg);
drawShield(64, 58, 52, C.shield1, C.shield2, C.shield3, C.edge);
drawCheck(64, 58, 28, C.check);
drawStars();

// ── Encode PNG ──
function crc32(data) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let k = n;
    for (let i = 0; i < 8; i++)
      k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1;
    table[n] = k;
  }
  for (let i = 0; i < data.length; i++)
    c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([t, data]);
  const crcVal = crc32(crcData);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcVal);
  return Buffer.concat([len, t, data, crc]);
}

// Convert RGBA pixel data to filtered (sub filter on each row) raw data
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  const off = y * (1 + W * 4);
  raw[off] = 0; // None filter
  for (let x = 0; x < W; x++) {
    const pi = (y * W + x) * 4;
    const ro = off + 1 + x * 4;
    raw[ro] = buf[pi];
    raw[ro+1] = buf[pi+1];
    raw[ro+2] = buf[pi+2];
    raw[ro+3] = buf[pi+3];
  }
}

const compressed = zlib.deflateSync(raw);

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(W, 0);
ihdrData.writeUInt32BE(H, 4);
ihdrData[8] = 8;  // bit depth
ihdrData[9] = 6;  // color type RGBA
ihdrData[10] = 0; // compression
ihdrData[11] = 0; // filter
ihdrData[12] = 0; // interlace

const ihdr = chunk("IHDR", ihdrData);
const idat = chunk("IDAT", compressed);
const iend = chunk("IEND", Buffer.alloc(0));

const png = Buffer.concat([sig, ihdr, idat, iend]);

const outDir = __dirname + "/../assets/pixel-art";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = outDir + "/settlement-sentinel.png";
fs.writeFileSync(outPath, png);
console.log("Wrote " + outPath + " (" + png.length + " bytes)");
