import { z } from "zod/v4";
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { serve } from "@hono/node-server";
import * as zlib from "node:zlib";
import { Buffer } from "node:buffer";

const payToAddress = "66dG5r5TD37ahhrsAMKUroxML9Cqto5jRduifiMgQQ3G";

const { app, addEntrypoint } = createAgentApp(
  {
    name: "pixel-art-agent",
    version: "1.0.0",
    description: "Generates original pixel art on demand with retro color palettes (NES, Game Boy, PICO-8).",
  }
);

const palettes: Record<string, number[][]> = {
  nes: [
    [0x00, 0x00, 0x00], [0xfc, 0xfc, 0xfc], [0xf8, 0xb8, 0x00],
    [0x00, 0xa8, 0xf8], [0x00, 0x70, 0xf8], [0xf8, 0x38, 0x00],
    [0xf8, 0x00, 0x38], [0x20, 0xa0, 0x00], [0xa8, 0x50, 0xf8],
    [0x58, 0x58, 0x58], [0xa8, 0xa8, 0xa8], [0x00, 0xf8, 0x58],
    [0xf8, 0xd8, 0x78], [0xf8, 0xa8, 0xa8], [0x78, 0xd8, 0xf8],
    [0xa8, 0x78, 0x50],
  ],
  gameboy: [
    [0x0f, 0x38, 0x0f], [0x30, 0x62, 0x30],
    [0x8b, 0xac, 0x0f], [0x9b, 0xbc, 0x0f],
  ],
  pico8: [
    [0x00, 0x00, 0x00], [0x1d, 0x2b, 0x53], [0x7e, 0x25, 0x53],
    [0x00, 0x87, 0x51], [0xab, 0x52, 0x36], [0x5f, 0x57, 0x4f],
    [0xc2, 0xc3, 0xc7], [0xff, 0xf1, 0xe8], [0xff, 0x00, 0x4d],
    [0xff, 0xa3, 0x00], [0xff, 0xec, 0x27], [0x00, 0xe4, 0x36],
    [0x29, 0xad, 0xff], [0x83, 0x76, 0x9c], [0xff, 0x77, 0xa8],
    [0xff, 0xcc, 0xaa],
  ],
};

function seededRng(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  s = Math.abs(s) + 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function buildPng(pixels: Uint8Array, w: number, h: number): Buffer {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    const src = y * w * 4;
    const dst = y * (1 + w * 4) + 1;
    for (let x = 0; x < w * 4; x++) raw[dst + x] = pixels[src + x];
  }
  const comp = zlib.deflateSync(raw);

  const u32 = (v: number) => {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(v, 0);
    return b;
  };

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const enc = new TextEncoder();

  // IHDR
  const ihdrBody = Buffer.alloc(13);
  u32(w).copy(ihdrBody, 0);
  u32(h).copy(ihdrBody, 4);
  ihdrBody[8] = 8; ihdrBody[9] = 6;
  const ihdrP = Buffer.concat([Buffer.from("IHDR"), ihdrBody]);
  const ihdrC = Buffer.concat([u32(13), ihdrP, u32(crc32(ihdrP))]);

  // IDAT
  const idatP = Buffer.concat([Buffer.from("IDAT"), comp]);
  const idatC = Buffer.concat([u32(comp.length), idatP, u32(crc32(idatP))]);

  // IEND
  const iendP = Buffer.from("IEND");
  const iendC = Buffer.concat([u32(0), iendP, u32(crc32(iendP))]);

  return Buffer.concat([sig, ihdrC, idatC, iendC]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (~c >>> 0);
}

function genPixelArt(theme: string, paletteName: string): { b64: string; desc: string } {
  const cp = palettes[paletteName] || palettes.nes;
  const w = 64, h = 64;
  const rand = seededRng(theme + paletteName);
  const px = new Uint8Array(w * h * 4);
  const cx = w >> 1, cy = h >> 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      let ci = 0;
      if (dist < 8) ci = 6 % cp.length;
      else if (dist < 13) ci = 3 % cp.length;
      else if (y > h * 0.72) ci = 7 % cp.length;
      else if (y > h * 0.66) ci = 8 % cp.length;
      else if (rand() > 0.97) ci = 1 % cp.length;
      else if (rand() > 0.94) ci = 2 % cp.length;
      else ci = cp.length > 4 ? 5 % cp.length : 1 % cp.length;

      const c = cp[ci];
      const idx = (y * w + x) * 4;
      px[idx] = c[0]; px[idx + 1] = c[1];
      px[idx + 2] = c[2]; px[idx + 3] = 255;
    }
  }

  const png = buildPng(px, w, h);
  return { b64: png.toString("base64"), desc: `Original pixel art (${w}x${h}, ${paletteName}, theme: ${theme})` };
}

// Entrypoints
addEntrypoint({
  key: "generate-pixel-art",
  description: "Generate original 64x64 pixel art with configurable theme and retro color palette.",
  input: z.object({
    theme: z.string().optional().default("retro-scene"),
    palette: z.enum(["nes", "gameboy", "pico8"]).optional().default("nes"),
  }),
  handler: async (ctx) => {
    const { theme, palette } = ctx.input as { theme: string; palette: string };
    const { b64, desc } = genPixelArt(theme, palette);
    return {
      output: { image: `data:image/png;base64,${b64}`, description: desc, width: 64, height: 64, palette, theme },
      usage: { total_tokens: b64.length },
    };
  },
});

addEntrypoint({
  key: "palettes",
  description: "List available color palettes.",
  input: undefined,
  handler: async () => ({
    output: {
      palettes: [
        { id: "nes", name: "NES (Nintendo)", colors: 16, description: "Classic 16-color NES palette" },
        { id: "gameboy", name: "Game Boy", colors: 4, description: "4-shade green monochrome" },
        { id: "pico8", name: "PICO-8", colors: 16, description: "Fantasy console 16-color palette" },
      ],
    },
    usage: { total_tokens: 0 },
  }),
});

export default app;

const port = parseInt(process.env.PORT || "3456", 10);
console.log(`\n🎨 Pixel Art Agent v1.0.0 running on http://0.0.0.0:${port}`);
console.log(`💰 Pay-to: ${payToAddress}\n`);
serve({ fetch: app.fetch, port });
