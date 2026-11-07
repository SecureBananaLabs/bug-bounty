import sharp from "sharp";

const size = 128;
const data = Buffer.alloc(size * size * 4);

const colors = {
  bg: [11, 16, 28, 255],
  grid: [24, 34, 55, 255],
  gridSoft: [18, 27, 45, 255],
  desk: [37, 47, 70, 255],
  deskEdge: [77, 96, 130, 255],
  teal: [45, 212, 191, 255],
  cyan: [56, 189, 248, 255],
  amber: [251, 191, 36, 255],
  green: [74, 222, 128, 255],
  red: [248, 113, 113, 255],
  violet: [167, 139, 250, 255],
  light: [226, 232, 240, 255],
  shadow: [5, 8, 14, 255],
};

function put(x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  data[i] = color[0];
  data[i + 1] = color[1];
  data[i + 2] = color[2];
  data[i + 3] = color[3];
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      put(xx, yy, color);
    }
  }
}

function line(x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
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

function circle(cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d <= r * r) put(x, y, color);
    }
  }
}

rect(0, 0, size, size, colors.bg);

for (let x = 8; x < size; x += 16) rect(x, 0, 1, size, colors.gridSoft);
for (let y = 8; y < size; y += 16) rect(0, y, size, 1, colors.gridSoft);
for (let x = 16; x < size; x += 32) rect(x, 0, 1, size, colors.grid);
for (let y = 16; y < size; y += 32) rect(0, y, size, 1, colors.grid);

rect(18, 86, 92, 24, colors.shadow);
rect(20, 82, 88, 24, colors.desk);
rect(20, 82, 88, 3, colors.deskEdge);
rect(26, 90, 24, 8, colors.cyan);
rect(28, 92, 20, 4, colors.bg);
rect(80, 89, 20, 10, colors.violet);
rect(83, 92, 14, 4, colors.bg);

line(32, 75, 32, 82, colors.cyan);
line(48, 75, 48, 82, colors.green);
line(83, 75, 83, 82, colors.amber);
line(95, 75, 95, 82, colors.red);

circle(32, 72, 4, colors.cyan);
circle(48, 72, 4, colors.green);
circle(83, 72, 4, colors.amber);
circle(95, 72, 4, colors.red);

rect(53, 30, 22, 54, colors.shadow);
rect(55, 28, 18, 54, colors.light);
rect(58, 31, 12, 48, [31, 41, 62, 255]);
rect(61, 34, 6, 42, colors.bg);

line(64, 36, 47, 72, colors.amber);
line(65, 36, 48, 72, colors.amber);
circle(47, 72, 5, colors.amber);
circle(47, 72, 2, colors.light);

rect(52, 80, 24, 6, colors.light);
rect(49, 86, 30, 5, colors.deskEdge);
rect(55, 24, 18, 4, colors.teal);
rect(60, 20, 8, 5, colors.teal);

line(16, 109, 112, 109, colors.teal);
line(16, 112, 112, 112, colors.violet);
rect(23, 105, 5, 8, colors.cyan);
rect(45, 105, 5, 8, colors.green);
rect(67, 105, 5, 8, colors.amber);
rect(89, 105, 5, 8, colors.red);
rect(100, 103, 8, 12, colors.light);
rect(102, 105, 4, 8, colors.bg);

for (let i = 0; i < 22; i++) {
  const x = 12 + i * 5;
  const y = 16 + ((i * 7) % 12);
  put(x, y, i % 2 === 0 ? colors.teal : colors.violet);
}

await sharp(data, { raw: { width: size, height: size, channels: 4 } })
  .png({ compressionLevel: 9, palette: true })
  .toFile("assets/pixel-art/settlement-metronome.png");
