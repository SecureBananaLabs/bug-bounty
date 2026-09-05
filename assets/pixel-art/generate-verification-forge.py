from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 128
SCALE = 2
GRID = SIZE // SCALE
OUT = Path(__file__).with_name("verification-forge.png")


palette = {
    "bg0": (12, 16, 28),
    "bg1": (17, 24, 39),
    "grid": (35, 48, 72),
    "grid_hi": (55, 75, 106),
    "steel": (77, 92, 117),
    "steel_hi": (138, 154, 181),
    "gold": (245, 180, 65),
    "gold_hi": (255, 221, 120),
    "ember": (235, 88, 50),
    "ember_hi": (255, 150, 70),
    "cyan": (76, 201, 240),
    "green": (71, 222, 128),
    "shadow": (6, 10, 18),
}


pixels = [[palette["bg0"] for _ in range(SIZE)] for _ in range(SIZE)]


def rect(x: int, y: int, w: int, h: int, color: str) -> None:
    rgb = palette[color]
    for yy in range(max(0, y), min(SIZE, y + h)):
        for xx in range(max(0, x), min(SIZE, x + w)):
            pixels[yy][xx] = rgb


def cell(x: int, y: int, color: str) -> None:
    rect(x * SCALE, y * SCALE, SCALE, SCALE, color)


def hline(x: int, y: int, w: int, color: str) -> None:
    for xx in range(x, x + w):
        cell(xx, y, color)


def vline(x: int, y: int, h: int, color: str) -> None:
    for yy in range(y, y + h):
        cell(x, yy, color)


for gy in range(GRID):
    for gx in range(GRID):
        if (gx + gy) % 2 == 0:
            cell(gx, gy, "bg1")

for gx in range(4, GRID, 8):
    vline(gx, 0, GRID, "grid")
for gy in range(5, GRID, 8):
    hline(0, gy, GRID, "grid")

for x, y, w, h in [(8, 48, 48, 6), (11, 43, 42, 5), (15, 39, 34, 4)]:
    rect(x * SCALE, y * SCALE, w * SCALE, h * SCALE, "shadow")

for x, y, w, h in [(12, 44, 40, 6), (15, 40, 34, 4), (18, 37, 28, 3)]:
    rect(x * SCALE, y * SCALE, w * SCALE, h * SCALE, "steel")

rect(19 * SCALE, 35 * SCALE, 26 * SCALE, 2 * SCALE, "steel_hi")
rect(24 * SCALE, 32 * SCALE, 16 * SCALE, 3 * SCALE, "ember")
rect(26 * SCALE, 29 * SCALE, 12 * SCALE, 3 * SCALE, "ember_hi")
rect(29 * SCALE, 25 * SCALE, 6 * SCALE, 5 * SCALE, "gold")

for gx, gy in [(13, 32), (16, 27), (47, 34), (51, 27), (8, 24), (55, 45)]:
    rect(gx * SCALE, gy * SCALE, 2 * SCALE, 2 * SCALE, "cyan")

for x, y in [(23, 19), (42, 18), (18, 24), (47, 25)]:
    rect(x * SCALE, y * SCALE, 4 * SCALE, SCALE, "grid_hi")
    rect((x + 1) * SCALE, (y - 1) * SCALE, 2 * SCALE, SCALE, "grid_hi")

rect(26 * SCALE, 14 * SCALE, 12 * SCALE, 9 * SCALE, "gold")
rect(28 * SCALE, 12 * SCALE, 8 * SCALE, 3 * SCALE, "gold_hi")
rect(29 * SCALE, 17 * SCALE, 3 * SCALE, 2 * SCALE, "shadow")
rect(34 * SCALE, 17 * SCALE, 2 * SCALE, 2 * SCALE, "shadow")

for gx, gy in [(25, 15), (38, 15), (25, 23), (38, 23)]:
    rect(gx * SCALE, gy * SCALE, 2 * SCALE, 2 * SCALE, "gold_hi")

for x, y, w, h in [(28, 21, 4, 3), (31, 24, 4, 3), (35, 18, 4, 3), (38, 15, 4, 3)]:
    rect(x * SCALE, y * SCALE, w * SCALE, h * SCALE, "green")

for x, y, w, h in [(28, 20, 4, 1), (31, 23, 4, 1), (35, 17, 4, 1), (38, 14, 4, 1)]:
    rect(x * SCALE, y * SCALE, w * SCALE, h * SCALE, "gold_hi")

for gx in range(20, 45, 4):
    cell(gx, 51, "ember_hi")
for gx in range(18, 48, 6):
    cell(gx, 55, "ember")

for gy in range(7, 57, 10):
    for gx in range(6, 58, 10):
        if (gx * 3 + gy) % 5 == 0:
            cell(gx, gy, "cyan")


def png_chunk(kind: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(kind + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", crc)


raw = bytearray()
for row in pixels:
    raw.append(0)
    for r, g, b in row:
        raw.extend((r, g, b))

png = bytearray(b"\x89PNG\r\n\x1a\n")
png += png_chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
png += png_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += png_chunk(b"IEND", b"")
OUT.write_bytes(png)
print(f"Wrote {OUT} ({SIZE}x{SIZE})")
