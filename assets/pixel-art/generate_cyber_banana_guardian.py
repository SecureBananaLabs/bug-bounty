#!/usr/bin/env python3
"""Generate the cyber banana guardian pixel-art PNG."""
from __future__ import annotations

import struct
import sys
import zlib
from pathlib import Path

WIDTH = HEIGHT = 64
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("assets/pixel-art/cyber-banana-guardian.png")

Color = tuple[int, int, int]
img: list[list[Color]] = [[(8, 13, 20) for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(x: int, y: int, w: int, h: int, color: Color) -> None:
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        for xx in range(max(0, x), min(WIDTH, x + w)):
            img[yy][xx] = color


def line(x0: int, y0: int, x1: int, y1: int, color: Color) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        rect(x0, y0, 1, 1, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


# Circuit-board background.
for x in range(0, WIDTH, 8):
    line(x, 0, x, HEIGHT - 1, (12, 31, 43))
for y in range(0, HEIGHT, 8):
    line(0, y, WIDTH - 1, y, (12, 31, 43))
for x, y in [(7, 9), (52, 10), (11, 48), (48, 53), (30, 6), (57, 34)]:
    rect(x, y, 2, 2, (45, 224, 162))

# Glowing code vault.
rect(39, 19, 17, 25, (17, 54, 61))
rect(41, 21, 13, 21, (35, 217, 147))
rect(44, 24, 7, 4, (181, 255, 228))
rect(44, 31, 7, 7, (7, 31, 37))
rect(47, 28, 2, 5, (7, 31, 37))
for i in range(4):
    rect(40 - i, 18 - i, 19 + 2 * i, 1, (18, 116, 93))
    rect(40 - i, 44 + i, 19 + 2 * i, 1, (18, 116, 93))

# Banana guardian body and peel curve.
for x, y, w, h, c in [
    (14, 12, 11, 31, (252, 219, 73)),
    (19, 15, 10, 30, (246, 190, 56)),
    (25, 21, 9, 23, (219, 142, 45)),
    (11, 18, 8, 9, (255, 238, 143)),
    (16, 42, 13, 5, (126, 78, 34)),
]:
    rect(x, y, w, h, c)
for p in [(12, 11), (13, 10), (14, 9), (15, 8), (16, 8), (17, 9)]:
    rect(*p, 1, 1, (255, 238, 143))
for p in [(30, 41), (31, 40), (32, 39), (33, 37), (34, 35)]:
    rect(*p, 2, 2, (122, 71, 32))

# Cyber visor and expression.
rect(20, 22, 4, 4, (5, 10, 15))
rect(24, 22, 5, 4, (102, 245, 255))
rect(29, 31, 9, 3, (5, 10, 15))
rect(31, 32, 5, 1, (255, 238, 143))

# Shield arm.
rect(5, 29, 13, 17, (78, 91, 255))
rect(8, 32, 7, 11, (184, 194, 255))
rect(10, 34, 3, 7, (46, 60, 198))
rect(16, 34, 4, 4, (246, 190, 56))

# Scanner beam and floor glow.
rect(34, 29, 9, 2, (102, 245, 255))
rect(35, 32, 8, 1, (102, 245, 255))
rect(4, 55, 56, 3, (31, 55, 65))
rect(6, 58, 52, 2, (70, 224, 164))

# Corner pixels for crisp frame.
for x in range(3, 61):
    rect(x, 3, 1, 1, (14, 55, 65))
    rect(x, 60, 1, 1, (14, 55, 65))
for y in range(3, 61):
    rect(3, y, 1, 1, (14, 55, 65))
    rect(60, y, 1, 1, (14, 55, 65))


def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

raw = b"".join(b"\x00" + bytes(channel for pixel in row for channel in pixel) for row in img)
png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_bytes(png)
print(f"wrote {OUT} ({WIDTH}x{HEIGHT})")
