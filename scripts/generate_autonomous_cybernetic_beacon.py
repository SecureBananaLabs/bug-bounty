#!/usr/bin/env python3
"""
Generator for Autonomous Cybernetic Beacon pixel art (128x128).
Dependency-free: uses only standard library struct and zlib modules.
"""
import zlib
import struct
import os

def make_png(width, height, pixels):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # None filter
        for x in range(width):
            r, g, b, a = pixels[y][x]
            raw_data.extend((r, g, b, a))

    compressor = zlib.compressobj()
    compressed = compressor.compress(raw_data) + compressor.flush()

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

    header = b"PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return header + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")

def generate():
    width, height = 128, 128
    pixels = [[(15, 18, 30, 255) for _ in range(width)] for _ in range(height)]

    for y in range(height):
        for x in range(width):
            dist_center = ((x - 64)**2 + (y - 64)**2)**0.5
            v = max(0, int(35 - dist_center * 0.4))
            pixels[y][x] = (12 + v, 15 + v, 32 + v * 2, 255)

    for y in range(95, 115):
        span = (y - 95) * 2
        for x in range(64 - 20 - span, 64 + 20 + span):
            if 0 <= x < width:
                edge = (x == 64 - 20 - span or x == 64 + 20 + span - 1 or y == 95 or y == 114)
                pixels[y][x] = (0, 245, 212, 255) if edge else (25, 45, 75, 255)

    for y in range(35, 90):
        dy = abs(y - 60)
        w_crystal = max(0, 22 - dy)
        for x in range(64 - w_crystal, 64 + w_crystal + 1):
            is_edge = (x == 64 - w_crystal or x == 64 + w_crystal)
            if is_edge:
                pixels[y][x] = (255, 255, 255, 255)
            elif x < 64:
                pixels[y][x] = (155, 93, 229, 255)
            else:
                pixels[y][x] = (0, 187, 249, 255)

    for y in range(54, 67):
        for x in range(58, 71):
            if ((x - 64)**2 + (y - 60)**2) <= 25:
                pixels[y][x] = (254, 228, 64, 255)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "pixel-art")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "autonomous-cybernetic-beacon.png")
    png_data = make_png(width, height, pixels)
    with open(out_path, "wb") as f:
        f.write(png_data)
    print(f"Wrote {len(png_data)} bytes to {out_path}")

if __name__ == "__main__":
    generate()
