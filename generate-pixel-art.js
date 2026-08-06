#!/usr/bin/env node
/**
 * generate-pixel-art.js
 * Pure Node.js 64x64 PNG pixel art generator (no external deps)
 * Creates an original pixel dragon design.
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crcVal = crc32(crcData);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcVal);
  return Buffer.concat([len, typeB, data, crc]);
}

// --- Pixel Art Design: Pixel Dragon ---
const W = 64, H = 64;

// Pixel data buffer: H rows * W cols * 4 bytes (RGBA)
const pixels = Buffer.alloc(H * W * 4);
pixels.fill(0);

function setPx(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const idx = (y * W + x) * 4;
  pixels[idx] = r;
  pixels[idx+1] = g;
  pixels[idx+2] = b;
  pixels[idx+3] = a;
}

function getPx(x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return null;
  const idx = (y * W + x) * 4;
  return [pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]];
}

// Helper to set from hex or named colors
const SKY       = [20, 24, 82];
const STAR      = [255, 255, 200];
const DRAGON_BODY  = [30, 180, 60];
const DRAGON_DARK  = [20, 130, 40];
const DRAGON_BELLY = [180, 220, 100];
const DRAGON_EYE   = [255, 220, 50];
const DRAGON_WING  = [80, 200, 100];
const DRAGON_HORN  = [160, 120, 40];
const DRAGON_SPIKE = [50, 220, 80];
const DRAGON_MOUTH = [200, 50, 30];
const FIRE_ORANGE  = [255, 140, 20];
const FIRE_YELLOW  = [255, 220, 50];
const MOUNTAIN     = [80, 60, 120];
const MOON_C       = [240, 230, 200];
const BLACK        = [0, 0, 0];
const WHITE        = [200, 200, 200];
const CLAW         = [200, 200, 200];
const WING_LINE    = [60, 180, 80];
const SPIKE_BRIGHT = [100, 255, 120];
const FIRE_DARK    = [255, 100, 0];
const CLOUD_COLOR  = [100, 110, 160];

function drawEllipse(cx, cy, rx, ry, r, g, b) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1) {
        setPx(cx + dx, cy + dy, r, g, b);
      }
    }
  }
}

function drawCircle(cx, cy, radius, r, g, b) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx*dx + dy*dy <= radius*radius) {
        setPx(cx + dx, cy + dy, r, g, b);
      }
    }
  }
}

// --- Background: Sky ---
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    pixels[(y * W + x) * 4] = SKY[0];
    pixels[(y * W + x) * 4 + 1] = SKY[1];
    pixels[(y * W + x) * 4 + 2] = SKY[2];
    pixels[(y * W + x) * 4 + 3] = 255;
  }
}

// --- Stars ---
const starPositions = [
  [5,3],[12,7],[20,2],[30,5],[38,3],[48,6],[55,2],[60,4],
  [8,15],[25,12],[42,10],[58,14],[3,20],[15,18],[50,20],[62,18],
  [10,28],[28,25],[45,28],[55,30],[6,35],[35,33],[60,35]
];
for (const [sx, sy] of starPositions) {
  setPx(sx, sy, STAR[0], STAR[1], STAR[2]);
  setPx(sx+1, sy, STAR[0], STAR[1], STAR[2]);
  setPx(sx-1, sy, STAR[0], STAR[1], STAR[2]);
  setPx(sx, sy+1, STAR[0], STAR[1], STAR[2]);
  setPx(sx, sy-1, STAR[0], STAR[1], STAR[2]);
}

// --- Moon ---
drawCircle(50, 10, 6, MOON_C[0], MOON_C[1], MOON_C[2]);

// --- Mountains ---
for (let y = 40; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const mtnH = 42 + Math.sin(x * 0.15) * 8 + Math.sin(x * 0.3 + 1) * 4;
    if (y >= mtnH) {
      setPx(x, y, MOUNTAIN[0], MOUNTAIN[1], MOUNTAIN[2]);
    }
  }
}

// --- Dragon ---
const cx = 28, cy = 35;

// Body
drawEllipse(cx, cy, 10, 6, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);

// Belly
drawEllipse(cx, cy + 2, 7, 3, DRAGON_BELLY[0], DRAGON_BELLY[1], DRAGON_BELLY[2]);

// Neck
drawEllipse(cx + 8, cy - 2, 5, 4, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);
drawEllipse(cx + 12, cy - 4, 4, 3, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);

// Head
drawEllipse(cx + 15, cy - 6, 5, 4, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);
drawEllipse(cx + 19, cy - 5, 3, 2, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);

// Eye
setPx(cx + 17, cy - 7, DRAGON_EYE[0], DRAGON_EYE[1], DRAGON_EYE[2]);
setPx(cx + 16, cy - 7, DRAGON_EYE[0], DRAGON_EYE[1], DRAGON_EYE[2]);
setPx(cx + 17, cy - 6, DRAGON_EYE[0], DRAGON_EYE[1], DRAGON_EYE[2]);
setPx(cx + 16, cy - 6, DRAGON_EYE[0], DRAGON_EYE[1], DRAGON_EYE[2]);
// Pupil
setPx(cx + 17, cy - 7, BLACK[0], BLACK[1], BLACK[2]);
setPx(cx + 17, cy - 6, BLACK[0], BLACK[1], BLACK[2]);

// Horns
for (let h = 0; h < 3; h++) {
  const hx = cx + 13 + h * 2;
  const hy = cy - 9 - h;
  setPx(hx, hy, DRAGON_HORN[0], DRAGON_HORN[1], DRAGON_HORN[2]);
  setPx(hx + 1, hy, DRAGON_HORN[0], DRAGON_HORN[1], DRAGON_HORN[2]);
}

// Mouth / fire breath
setPx(cx + 22, cy - 5, DRAGON_MOUTH[0], DRAGON_MOUTH[1], DRAGON_MOUTH[2]);
setPx(cx + 23, cy - 5, FIRE_ORANGE[0], FIRE_ORANGE[1], FIRE_ORANGE[2]);
setPx(cx + 24, cy - 5, FIRE_ORANGE[0], FIRE_ORANGE[1], FIRE_ORANGE[2]);
setPx(cx + 24, cy - 4, FIRE_YELLOW[0], FIRE_YELLOW[1], FIRE_YELLOW[2]);
setPx(cx + 25, cy - 5, FIRE_YELLOW[0], FIRE_YELLOW[1], FIRE_YELLOW[2]);
setPx(cx + 25, cy - 4, FIRE_ORANGE[0], FIRE_ORANGE[1], FIRE_ORANGE[2]);
setPx(cx + 26, cy - 5, FIRE_YELLOW[0], FIRE_YELLOW[1], FIRE_YELLOW[2]);
setPx(cx + 26, cy - 4, FIRE_ORANGE[0], FIRE_ORANGE[1], FIRE_ORANGE[2]);
setPx(cx + 27, cy - 5, FIRE_YELLOW[0], FIRE_YELLOW[1], FIRE_YELLOW[2]);
setPx(cx + 27, cy - 4, FIRE_DARK[0], FIRE_DARK[1], FIRE_DARK[2]);

// Spikes on back
const spikePos = [[-7,-6],[-4,-7],[-1,-7],[2,-7],[5,-6],[6,-8],[9,-8]];
for (const [dx, dy] of spikePos) {
  setPx(cx+dx, cy+dy, DRAGON_SPIKE[0], DRAGON_SPIKE[1], DRAGON_SPIKE[2]);
  setPx(cx+dx+1, cy+dy, SPIKE_BRIGHT[0], SPIKE_BRIGHT[1], SPIKE_BRIGHT[2]);
}

// Wings
drawEllipse(cx - 8, cy - 5, 6, 3, DRAGON_WING[0], DRAGON_WING[1], DRAGON_WING[2]);
drawEllipse(cx - 12, cy - 8, 5, 3, DRAGON_WING[0], DRAGON_WING[1], DRAGON_WING[2]);
drawEllipse(cx - 10, cy - 12, 4, 3, DRAGON_WING[0], DRAGON_WING[1], DRAGON_WING[2]);
drawEllipse(cx - 6, cy - 10, 3, 3, DRAGON_WING[0], DRAGON_WING[1], DRAGON_WING[2]);

// Wing lines
for (let w = 0; w < 3; w++) {
  const wx = cx - 14 + w * 3;
  const wy = cy - 11 - w * 2;
  setPx(wx, wy, WING_LINE[0], WING_LINE[1], WING_LINE[2]);
  setPx(wx + 1, wy, WING_LINE[0], WING_LINE[1], WING_LINE[2]);
}

// Tail
for (let t = 0; t < 8; t++) {
  const tx = cx - 11 - t;
  const ty = cy + 3 + Math.floor(Math.sin(t * 0.8) * 2);
  setPx(tx, ty, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);
  setPx(tx, ty + 1, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);
  if (t >= 6) {
    setPx(tx - 1, ty, DRAGON_SPIKE[0], DRAGON_SPIKE[1], DRAGON_SPIKE[2]);
    setPx(tx - 1, ty + 1, DRAGON_SPIKE[0], DRAGON_SPIKE[1], DRAGON_SPIKE[2]);
  }
}

// Front leg
drawEllipse(cx + 6, cy + 7, 3, 2, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);
drawEllipse(cx + 7, cy + 8, 2, 1, DRAGON_DARK[0], DRAGON_DARK[1], DRAGON_DARK[2]);
setPx(cx + 6, cy + 9, CLAW[0], CLAW[1], CLAW[2]);
setPx(cx + 7, cy + 9, CLAW[0], CLAW[1], CLAW[2]);

// Back leg
drawEllipse(cx - 5, cy + 7, 3, 2, DRAGON_BODY[0], DRAGON_BODY[1], DRAGON_BODY[2]);
drawEllipse(cx - 4, cy + 8, 2, 1, DRAGON_DARK[0], DRAGON_DARK[1], DRAGON_DARK[2]);
setPx(cx - 5, cy + 9, CLAW[0], CLAW[1], CLAW[2]);
setPx(cx - 4, cy + 9, CLAW[0], CLAW[1], CLAW[2]);

// Scale pattern
const scales = [[-5,-2],[-2,-1],[1,-2],[4,-1],[7,-2],[-3,1],[0,1],[3,1],[6,1]];
for (const [dx, dy] of scales) {
  setPx(cx+dx, cy+dy, DRAGON_DARK[0], DRAGON_DARK[1], DRAGON_DARK[2]);
}

// Cloud wisps
const clouds = [[2,30,4],[15,28,3],[35,32,3],[55,25,4]];
for (const [cwx, cwy, cwr] of clouds) {
  for (let dy = -cwr; dy <= cwr; dy++) {
    for (let dx = -cwr; dx <= cwr; dx++) {
      if (dx*dx + dy*dy <= cwr*cwr) {
        const px = cwx + dx, py = cwy + dy;
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const idx = (py * W + px) * 4;
          const a = 0.7;
          pixels[idx]   = Math.round(CLOUD_COLOR[0] * a + pixels[idx] * (1 - a));
          pixels[idx+1] = Math.round(CLOUD_COLOR[1] * a + pixels[idx+1] * (1 - a));
          pixels[idx+2] = Math.round(CLOUD_COLOR[2] * a + pixels[idx+2] * (1 - a));
        }
      }
    }
  }
}

// --- Build PNG ---
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR: 64x64, 8-bit RGBA
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;    // bit depth
ihdr[9] = 6;    // color type: RGBA
ihdr[10] = 0;   // compression
ihdr[11] = 0;   // filter
ihdr[12] = 0;   // interlace

// Build raw data with filter byte per row
const rawData = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  const rowStart = y * (1 + W * 4);
  rawData[rowStart] = 0; // filter = None
  pixels.copy(rawData, rowStart + 1, y * W * 4, (y + 1) * W * 4);
}

const compressed = zlib.deflateSync(rawData);

// gAMA
const gama = Buffer.alloc(4);
gama.writeUInt32BE(45455);

// pHYs
const phys = Buffer.alloc(9);
phys.writeUInt32BE(2835, 0);
phys.writeUInt32BE(2835, 4);
phys[8] = 1;

const png = Buffer.concat([
  signature,
  makeChunk('IHDR', ihdr),
  makeChunk('gAMA', gama),
  makeChunk('pHYs', phys),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0))
]);

const outputDir = path.join(__dirname, 'assets', 'pixel-art');
fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, 'pixel-dragon.png');
fs.writeFileSync(outputPath, png);

console.log(`✅ Pixel art created: ${outputPath}`);
console.log(`   Size: ${png.length} bytes`);
console.log(`   Dimensions: ${W}x${H} pixels, RGBA PNG`);