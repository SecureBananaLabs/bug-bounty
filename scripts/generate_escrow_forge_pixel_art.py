#!/usr/bin/env python3
"""Generate an original 128x128 pixel-art asset for bounty #80."""

import struct
import zlib
from pathlib import Path


SIZE = 128
SCALE = 1
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pixel-art" / "escrow-forge-console.png"

PALETTE = {
    "bg": (9, 12, 24),
    "grid": (21, 31, 52),
    "panel": (31, 42, 67),
    "panel_hi": (54, 71, 106),
    "edge": (102, 126, 168),
    "glow": (56, 214, 196),
    "cyan": (89, 230, 255),
    "gold": (249, 197, 76),
    "gold_dark": (171, 105, 37),
    "orange": (240, 116, 47),
    "red": (217, 68, 79),
    "green": (71, 220, 128),
    "purple": (168, 115, 255),
    "white": (232, 239, 255),
    "shadow": (5, 7, 14),
}


pixels = [[PALETTE["bg"] for _ in range(SIZE)] for _ in range(SIZE)]


def put(x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        pixels[y][x] = PALETTE[color] if isinstance(color, str) else color


def rect(x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(xx, yy, color)


def line(x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def border(x, y, w, h, color):
    rect(x, y, w, 1, color)
    rect(x, y + h - 1, w, 1, color)
    rect(x, y, 1, h, color)
    rect(x + w - 1, y, 1, h, color)


def diamond(cx, cy, r, color):
    for yy in range(cy - r, cy + r + 1):
        span = r - abs(yy - cy)
        rect(cx - span, yy, span * 2 + 1, 1, color)


# Background grid and distant sparks.
for x in range(0, SIZE, 8):
    for y in range(SIZE):
        if y % 2 == 0:
            put(x, y, "grid")
for y in range(0, SIZE, 8):
    for x in range(SIZE):
        if x % 2 == 0:
            put(x, y, "grid")

for x, y, c in [
    (15, 18, "cyan"), (109, 14, "purple"), (91, 31, "gold"),
    (28, 105, "green"), (117, 93, "orange"), (8, 75, "cyan"),
]:
    put(x, y, c)
    put(x + 1, y, c)
    put(x, y + 1, c)

# Workbench body.
rect(12, 72, 104, 36, "shadow")
rect(14, 68, 100, 36, "panel")
border(14, 68, 100, 36, "edge")
rect(19, 74, 90, 8, "panel_hi")
rect(22, 88, 84, 10, "shadow")
border(22, 88, 84, 10, "panel_hi")

# Forge hearth.
rect(48, 34, 32, 34, "shadow")
rect(51, 31, 26, 37, "panel")
border(51, 31, 26, 37, "edge")
rect(56, 41, 16, 19, "orange")
rect(59, 36, 10, 25, "gold")
rect(61, 44, 6, 14, "white")
for x in range(54, 75, 4):
    line(x, 31, 64, 21, "glow")
for y in range(30, 68, 3):
    put(50, y, "gold_dark")
    put(78, y, "gold_dark")

# Suspended work ticket being forged.
rect(42, 18, 44, 14, "panel")
border(42, 18, 44, 14, "cyan")
rect(47, 22, 16, 2, "white")
rect(47, 26, 26, 2, "glow")
rect(75, 22, 5, 5, "green")
line(64, 32, 64, 40, "cyan")

# Conveyor and ingots: scope, proof, review, payout.
line(24, 78, 102, 78, "edge")
for x, color in [(28, "purple"), (48, "cyan"), (68, "green"), (88, "gold")]:
    rect(x, 73, 12, 8, color)
    rect(x + 2, 75, 8, 2, "white")

# Bounty status lights.
for i, color in enumerate(["purple", "cyan", "green", "gold"]):
    x = 28 + i * 20
    rect(x, 91, 10, 4, color)
    rect(x + 3, 86, 4, 4, color)
    line(x + 5, 90, x + 5, 91, color)

# Side consoles and cables.
rect(18, 42, 20, 20, "panel")
border(18, 42, 20, 20, "edge")
rect(22, 47, 12, 3, "green")
rect(22, 54, 8, 3, "cyan")
rect(90, 42, 20, 20, "panel")
border(90, 42, 20, 20, "edge")
rect(94, 47, 12, 3, "gold")
rect(98, 54, 8, 3, "red")
line(38, 52, 51, 52, "glow")
line(77, 52, 90, 52, "glow")

# Floor reflection.
for r, color in [(26, "gold_dark"), (19, "orange"), (12, "gold"), (5, "white")]:
    diamond(64, 111, r, color)
rect(33, 112, 62, 12, "bg")
for x in range(34, 95, 4):
    put(x, 111, "gold")


def png_chunk(kind, data):
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def write_png(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for red, green, blue in row:
            raw.extend([red, green, blue])
    data = b"".join([
        b"\x89PNG\r\n\x1a\n",
        png_chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0)),
        png_chunk(b"IDAT", zlib.compress(bytes(raw), 9)),
        png_chunk(b"IEND", b""),
    ])
    path.write_bytes(data)


if __name__ == "__main__":
    write_png(OUT)
    print(OUT)
