const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const WIDTH = 128;
const HEIGHT = 128;
const OUT_FILE = path.join(__dirname, "claim-observatory-relay.png");
const DEMO_FILE = path.join(__dirname, "claim-observatory-relay-demo.gif");

const rgba = new Uint8Array(WIDTH * HEIGHT * 4);

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function colorMix(a, b, t) {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t), 255];
}

function px(x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 4;
  rgba[i] = color[0];
  rgba[i + 1] = color[1];
  rgba[i + 2] = color[2];
  rgba[i + 3] = color[3] ?? 255;
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      px(xx, yy, color);
    }
  }
}

function line(x0, y0, x1, y1, color, thickness = 1) {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    rect(x0 - Math.floor(thickness / 2), y0 - Math.floor(thickness / 2), thickness, thickness, color);
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

function circle(cx, cy, radius, color) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) px(cx + x, cy + y, color);
    }
  }
}

function dome(cx, cy, radius, color, shadow, highlight) {
  for (let y = 0; y <= radius; y += 2) {
    const half = Math.floor(Math.sqrt(radius * radius - y * y));
    const yy = cy - y;
    rect(cx - half, yy, half * 2 + 1, 2, color);
    if (y % 6 === 0) {
      rect(cx - half, yy, Math.floor(half * 0.45), 2, shadow);
      rect(cx + Math.floor(half * 0.25), yy, Math.max(3, Math.floor(half * 0.2)), 2, highlight);
    }
  }
  rect(cx - radius, cy, radius * 2 + 1, 4, shadow);
}

function polygon(points, color) {
  const ys = points.map((p) => p[1]);
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(HEIGHT - 1, Math.max(...ys));

  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    let j = points.length - 1;
    for (let i = 0; i < points.length; i += 1) {
      const pi = points[i];
      const pj = points[j];
      if ((pi[1] < y && pj[1] >= y) || (pj[1] < y && pi[1] >= y)) {
        nodes.push(Math.round(pi[0] + ((y - pi[1]) / (pj[1] - pi[1])) * (pj[0] - pi[0])));
      }
      j = i;
    }
    nodes.sort((a, b) => a - b);
    for (let i = 0; i < nodes.length; i += 2) {
      if (nodes[i] >= WIDTH) break;
      const start = Math.max(0, nodes[i]);
      const end = Math.min(WIDTH - 1, nodes[i + 1]);
      for (let x = start; x <= end; x += 1) px(x, y, color);
    }
  }
}

function prng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function drawSky() {
  const top = [14, 19, 37];
  const low = [45, 58, 86];
  for (let y = 0; y < HEIGHT; y += 1) {
    const band = Math.floor(y / 4) * 4;
    const c = colorMix(top, low, band / HEIGHT);
    rect(0, y, WIDTH, 1, c);
  }

  const rand = prng(0x80c1a1);
  for (let i = 0; i < 38; i += 1) {
    const x = Math.floor(rand() * 124) + 2;
    const y = Math.floor(rand() * 52) + 2;
    const bright = rand() > 0.35 ? [236, 246, 206, 255] : [112, 198, 210, 255];
    rect(x, y, rand() > 0.78 ? 2 : 1, 1, bright);
  }

  circle(101, 25, 8, [241, 202, 92, 255]);
  rect(98, 21, 7, 2, [255, 238, 139, 255]);
  rect(96, 27, 10, 2, [212, 151, 64, 255]);
}

function drawTerrain() {
  polygon([[0, 74], [19, 57], [44, 76]], [28, 47, 66, 255]);
  polygon([[28, 78], [55, 50], [87, 80]], [32, 53, 74, 255]);
  polygon([[72, 80], [108, 55], [128, 76], [128, 128], [0, 128], [0, 86]], [22, 43, 55, 255]);

  rect(0, 90, WIDTH, 38, [20, 31, 39, 255]);
  rect(0, 91, WIDTH, 3, [49, 86, 88, 255]);
  for (let x = 0; x < WIDTH; x += 8) rect(x, 95 + ((x / 8) % 2), 4, 1, [62, 101, 93, 255]);
}

function drawObservatory() {
  rect(46, 70, 36, 30, [53, 72, 88, 255]);
  rect(50, 74, 28, 24, [66, 91, 110, 255]);
  for (let y = 78; y < 98; y += 6) rect(50, y, 28, 1, [39, 54, 69, 255]);
  for (let x = 54; x < 78; x += 8) rect(x, 74, 1, 24, [42, 60, 76, 255]);

  dome(64, 70, 19, [86, 122, 142, 255], [47, 76, 96, 255], [136, 176, 175, 255]);
  rect(44, 70, 40, 4, [32, 46, 62, 255]);
  rect(58, 79, 12, 20, [18, 27, 40, 255]);
  rect(60, 81, 8, 8, [246, 195, 80, 255]);
  rect(61, 82, 2, 6, [255, 239, 148, 255]);

  line(73, 59, 107, 43, [31, 42, 57, 255], 6);
  line(74, 58, 108, 42, [99, 139, 152, 255], 3);
  rect(105, 38, 12, 9, [45, 65, 80, 255]);
  rect(108, 40, 6, 5, [152, 224, 205, 255]);
  for (let i = 0; i < 5; i += 1) line(112, 40 + i, 127, 34 - i, [87, 212, 190, 255], 1);
}

function drawLedgerRelay() {
  rect(13, 102, 102, 4, [42, 69, 70, 255]);
  rect(15, 105, 98, 3, [83, 130, 105, 255]);
  for (let x = 17; x <= 105; x += 18) {
    rect(x, 99, 8, 8, [224, 168, 68, 255]);
    rect(x + 2, 101, 4, 2, [255, 226, 123, 255]);
    rect(x + 1, 106, 6, 1, [137, 91, 50, 255]);
  }

  rect(8, 110, 30, 12, [30, 49, 60, 255]);
  rect(11, 113, 24, 2, [90, 201, 181, 255]);
  rect(11, 118, 16, 2, [232, 205, 92, 255]);
  rect(94, 110, 26, 12, [30, 49, 60, 255]);
  rect(98, 113, 18, 2, [90, 201, 181, 255]);
  rect(98, 118, 11, 2, [232, 205, 92, 255]);
}

function drawPixelSignature() {
  rect(4, 4, 15, 7, [34, 47, 71, 255]);
  rect(6, 6, 3, 3, [90, 201, 181, 255]);
  rect(11, 6, 6, 1, [232, 205, 92, 255]);
  rect(11, 8, 4, 1, [232, 205, 92, 255]);
}

function renderPixels() {
  drawSky();
  drawTerrain();
  drawLedgerRelay();
  drawObservatory();
  drawPixelSignature();
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng() {
  const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * (WIDTH * 4 + 1);
    raw[rowStart] = 0;
    Buffer.from(rgba.buffer, y * WIDTH * 4, WIDTH * 4).copy(raw, rowStart + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
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

function writeUInt16LE(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function renderDemoFrame(frame, totalFrames) {
  rgba.fill(0);
  renderPixels();

  const packetX = 17 + Math.floor((frame / totalFrames) * 88);
  const pulse = frame % 6 < 3;
  const signal = pulse ? [151, 240, 216, 255] : [90, 201, 181, 255];
  const gold = pulse ? [255, 226, 123, 255] : [224, 168, 68, 255];

  for (let i = 0; i < 5; i += 1) {
    line(112, 40 + i, 127, 34 - i, signal, 1);
  }
  rect(packetX, 99, 8, 8, gold);
  rect(packetX + 2, 101, 4, 2, [255, 239, 148, 255]);
  rect(Math.max(15, packetX - 6), 106, 4, 1, [83, 130, 105, 255]);
  circle(101, 25, pulse ? 9 : 8, pulse ? [255, 226, 123, 255] : [241, 202, 92, 255]);
  rect(60, 81, 8, 8, pulse ? [255, 226, 123, 255] : [246, 195, 80, 255]);

  return Buffer.from(rgba);
}

function buildPalette(frames) {
  const colorToIndex = new Map();
  const colors = [];
  for (const frame of frames) {
    for (let i = 0; i < frame.length; i += 4) {
      const key = `${frame[i]},${frame[i + 1]},${frame[i + 2]}`;
      if (!colorToIndex.has(key)) {
        if (colors.length >= 256) {
          throw new Error("GIF palette exceeded 256 colors");
        }
        colorToIndex.set(key, colors.length);
        colors.push([frame[i], frame[i + 1], frame[i + 2]]);
      }
    }
  }

  const palette = Buffer.alloc(256 * 3);
  colors.forEach((color, index) => {
    palette[index * 3] = color[0];
    palette[index * 3 + 1] = color[1];
    palette[index * 3 + 2] = color[2];
  });
  return { colorToIndex, palette, colorCount: colors.length };
}

function indexFrame(frame, colorToIndex) {
  const indices = new Uint8Array(WIDTH * HEIGHT);
  for (let i = 0, p = 0; i < frame.length; i += 4, p += 1) {
    indices[p] = colorToIndex.get(`${frame[i]},${frame[i + 1]},${frame[i + 2]}`);
  }
  return indices;
}

function packCodes(codes) {
  const bytes = [];
  let bitBuffer = 0;
  let bitCount = 0;

  for (const { code, size } of codes) {
    bitBuffer |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  }

  if (bitCount > 0) {
    bytes.push(bitBuffer & 0xff);
  }
  return Buffer.from(bytes);
}

function lzwEncode(indices) {
  const minCodeSize = 8;
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  const codes = [];

  for (const index of indices) {
    codes.push({ code: clearCode, size: minCodeSize + 1 });
    codes.push({ code: index, size: minCodeSize + 1 });
  }
  codes.push({ code: endCode, size: minCodeSize + 1 });

  const data = packCodes(codes);
  const blocks = [];
  for (let i = 0; i < data.length; i += 255) {
    const chunk = data.subarray(i, i + 255);
    blocks.push(Buffer.from([chunk.length]), chunk);
  }
  blocks.push(Buffer.from([0]));
  return Buffer.concat([Buffer.from([minCodeSize]), ...blocks]);
}

function encodeGif() {
  const frames = [];
  const totalFrames = 12;
  for (let i = 0; i < totalFrames; i += 1) {
    frames.push(renderDemoFrame(i, totalFrames));
  }

  const { colorToIndex, palette, colorCount } = buildPalette(frames);
  const parts = [
    Buffer.from("GIF89a", "ascii"),
    writeUInt16LE(WIDTH),
    writeUInt16LE(HEIGHT),
    Buffer.from([0xf7, 0x00, 0x00]),
    palette,
    Buffer.from([0x21, 0xff, 0x0b]),
    Buffer.from("NETSCAPE2.0", "ascii"),
    Buffer.from([0x03, 0x01, 0x00, 0x00, 0x00]),
  ];

  for (const frame of frames) {
    parts.push(
      Buffer.from([0x21, 0xf9, 0x04, 0x00]),
      writeUInt16LE(8),
      Buffer.from([0x00, 0x00]),
      Buffer.from([0x2c]),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt16LE(WIDTH),
      writeUInt16LE(HEIGHT),
      Buffer.from([0x00]),
      lzwEncode(indexFrame(frame, colorToIndex)),
    );
  }

  parts.push(Buffer.from([0x3b]));
  return { buffer: Buffer.concat(parts), colorCount, frameCount: frames.length };
}

function sha(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readPngSize(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

renderPixels();
const png = encodePng();

if (process.argv.includes("--demo")) {
  const demo = encodeGif();
  fs.writeFileSync(DEMO_FILE, demo.buffer);
  console.log(`wrote ${path.relative(process.cwd(), DEMO_FILE)}`);
  console.log(`size=${WIDTH}x${HEIGHT}`);
  console.log(`frames=${demo.frameCount}`);
  console.log(`colors=${demo.colorCount}`);
  console.log(`sha256=${sha(demo.buffer)}`);
} else if (process.argv.includes("--verify")) {
  const existing = fs.readFileSync(OUT_FILE);
  const size = readPngSize(existing);
  const matches = Buffer.compare(existing, png) === 0;
  console.log(`file=${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`size=${size.width}x${size.height}`);
  console.log(`sha256=${sha(existing)}`);
  console.log(`deterministic=${matches}`);
  if (size.width !== WIDTH || size.height !== HEIGHT || !matches) {
    process.exitCode = 1;
  }
} else {
  fs.writeFileSync(OUT_FILE, png);
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`size=${WIDTH}x${HEIGHT}`);
  console.log(`sha256=${sha(png)}`);
}
