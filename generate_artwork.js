const zlib = require('zlib');
const fs = require('fs');

const W = 64, H = 64;
const pixels = Buffer.alloc(W * H * 4);

function setXY(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a;
}

function fill(x1, y1, x2, y2, r, g, b, a) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      setXY(x, y, r, g, b, a);
}

function circle(cx, cy, r, cr, cg, cb, ca) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setXY(x, y, cr, cg, cb, ca);
    }
}

// Sky gradient (bottom to top)
const skyColors = [
  [10, 10, 40], [15, 15, 55], [20, 20, 70], [30, 20, 80], [50, 25, 90],
  [70, 30, 95], [90, 40, 90], [110, 55, 80], [130, 70, 65], [150, 90, 50],
  [180, 120, 40], [200, 150, 30], [220, 180, 20]
];
for (let y = 0; y < 36; y++) {
  const t = y / 35;
  const idx = Math.min(Math.floor(t * skyColors.length), skyColors.length - 2);
  const frac = (t * (skyColors.length - 1)) - idx;
  const c1 = skyColors[idx], c2 = skyColors[Math.min(idx + 1, skyColors.length - 1)];
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * frac);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * frac);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * frac);
  fill(0, y, W - 1, y, r, g, b, 255);
}

// Stars
const stars = [
  [5,3],[12,5],[25,2],[38,4],[50,1],[58,6],[15,10],[30,8],[45,11],[55,9],
  [8,7],[20,12],[35,5],[48,7],[60,3],[3,9],[18,3],[32,10],[42,2],[53,8]
];
for (const [sx, sy] of stars) setXY(sx, sy, 255, 255, 255, 255);

// Sun
circle(50, 25, 8, 255, 220, 50, 255);
circle(50, 25, 6, 255, 240, 100, 255);
circle(50, 25, 4, 255, 255, 200, 255);

// Mountains (back)
const m1Points = [0,35, 8,20, 16,32, 24,18, 32,30, 40,22, 48,35, 63,30];
for (let x = 0; x < W; x++) {
  let y1 = 35;
  for (let i = 0; i < m1Points.length - 2; i += 2) {
    const xa = m1Points[i], ya = m1Points[i + 1];
    const xb = m1Points[i + 2], yb = m1Points[i + 3];
    if (x >= xa && x <= xb) {
      const t = (x - xa) / (xb - xa);
      y1 = Math.round(ya + (yb - ya) * t);
      break;
    }
  }
  fill(x, 30, x, y1, 60, 40, 80, 255);
}

// Mountains (front)
const m2Points = [0,40, 5,30, 12,38, 20,28, 28,36, 35,32, 42,38, 50,26, 58,35, 63,38];
for (let x = 0; x < W; x++) {
  let y1 = 40;
  for (let i = 0; i < m2Points.length - 2; i += 2) {
    const xa = m2Points[i], ya = m2Points[i + 1];
    const xb = m2Points[i + 2], yb = m2Points[i + 3];
    if (x >= xa && x <= xb) {
      const t = (x - xa) / (xb - xa);
      y1 = Math.round(ya + (yb - ya) * t);
      break;
    }
  }
  fill(x, 32, x, y1, 80, 55, 100, 255);
}

// Ground
fill(0, 36, W - 1, H - 1, 30, 80, 30, 255);
fill(0, 38, W - 1, H - 1, 25, 70, 25, 255);
fill(0, 42, W - 1, H - 1, 20, 55, 20, 255);

// Grass tufts
for (let x = 0; x < W; x += 4) {
  const gy = 36 + Math.floor(Math.random() * 5);
  setXY(x, gy, 50, 140, 50, 255);
  if (x + 2 < W) setXY(x + 2, gy - 1, 60, 150, 60, 255);
}

// Small tree 1
fill(8, 30, 8, 40, 80, 50, 30, 255);
circle(8, 28, 5, 20, 120, 30, 255);
circle(8, 25, 3, 30, 140, 40, 255);

// Small tree 2
fill(55, 32, 55, 42, 80, 50, 30, 255);
circle(55, 30, 5, 20, 120, 30, 255);
circle(55, 27, 3, 30, 140, 40, 255);

// Simple house
fill(28, 32, 36, 40, 160, 120, 80, 255); // walls
fill(30, 33, 34, 35, 100, 80, 60, 255); // dark window
fill(26, 30, 38, 32, 180, 50, 50, 255); // roof
setXY(28, 38, 200, 180, 100, 255); // door

// Path
for (let y = 40; y < H; y += 2) {
  const pw = Math.max(2, 6 - Math.floor((y - 40) / 6));
  const px = 32 - Math.floor(pw / 2);
  for (let x = 0; x < pw; x++) setXY(px + x, y, 160, 140, 100, 255);
}

// Water reflection at bottom
fill(0, 54, W - 1, H - 1, 15, 40, 60, 255);
for (let x = 0; x < W; x++) {
  setXY(x, 56, 20, 60, 80, 255);
  if (x % 3 === 0) setXY(x, 58, 30, 80, 100, 255);
}
// Reflection of sun in water
circle(50, 57, 4, 200, 180, 40, 180);
circle(50, 59, 3, 150, 130, 30, 120);

function createPNG(width, height, pixels) {
  function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let j = 0; j < 8; j++) c = (c >> 1) ^ (0xEDB88320 & -(c & 1)); } return (c ^ -1) >>> 0; }
  function chunk(type, data) { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const t = Buffer.from(type, 'ascii'); const c = Buffer.concat([t, data]); const r = Buffer.alloc(4); r.writeUInt32BE(crc32(c)); return Buffer.concat([l, c, r]); }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(height * (1 + width * 4)); let off = 0;
  for (let y = 0; y < height; y++) { raw[off++] = 0; for (let x = 0; x < width; x++) { const i = (y * width + x) * 4; raw[off++] = pixels[i]; raw[off++] = pixels[i + 1]; raw[off++] = pixels[i + 2]; raw[off++] = pixels[i + 3]; } }
  const deflated = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflated), chunk('IEND', Buffer.alloc(0))]);
}

const png = createPNG(W, H, pixels);
fs.writeFileSync('assets/pixel-art/artwork.png', png);
console.log('Created assets/pixel-art/artwork.png (' + png.length + ' bytes)');
