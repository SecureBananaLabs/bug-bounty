from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 128
SCALE = 4
GRID = SIZE // SCALE
OUT = Path(__file__).with_name("payout_signal_board.png")

PALETTE = {
    "bg": (10, 14, 24),
    "grid": (24, 34, 54),
    "grid_hi": (37, 51, 79),
    "panel": (17, 24, 39),
    "panel_hi": (31, 44, 69),
    "cyan": (56, 213, 211),
    "cyan_dim": (28, 111, 130),
    "gold": (255, 197, 75),
    "gold_dim": (145, 95, 35),
    "green": (80, 220, 121),
    "violet": (166, 119, 255),
    "white": (232, 244, 255),
}


pixels = [[PALETTE["bg"] for _ in range(GRID)] for _ in range(GRID)]


def rect(x: int, y: int, w: int, h: int, color: str) -> None:
    for yy in range(max(0, y), min(GRID, y + h)):
        for xx in range(max(0, x), min(GRID, x + w)):
            pixels[yy][xx] = PALETTE[color]


def line(x1: int, y1: int, x2: int, y2: int, color: str) -> None:
    dx = abs(x2 - x1)
    dy = -abs(y2 - y1)
    sx = 1 if x1 < x2 else -1
    sy = 1 if y1 < y2 else -1
    err = dx + dy
    x, y = x1, y1
    while True:
        if 0 <= x < GRID and 0 <= y < GRID:
            pixels[y][x] = PALETTE[color]
        if x == x2 and y == y2:
            break
        step = 2 * err
        if step >= dy:
            err += dy
            x += sx
        if step <= dx:
            err += dx
            y += sy


def frame(x: int, y: int, w: int, h: int, color: str) -> None:
    rect(x, y, w, 1, color)
    rect(x, y + h - 1, w, 1, color)
    rect(x, y, 1, h, color)
    rect(x + w - 1, y, 1, h, color)


for i in range(0, GRID, 4):
    rect(i, 0, 1, GRID, "grid")
    rect(0, i, GRID, 1, "grid")

rect(3, 4, 26, 22, "panel")
frame(3, 4, 26, 22, "panel_hi")
rect(5, 6, 22, 1, "cyan_dim")

for y in (10, 16, 22):
    line(6, y, 23, y, "cyan_dim")
    rect(24, y - 1, 2, 3, "cyan")

rect(12, 11, 8, 8, "gold_dim")
rect(13, 12, 6, 6, "gold")
rect(15, 10, 2, 10, "gold")
rect(11, 14, 10, 2, "gold")
rect(15, 14, 2, 2, "white")

line(7, 9, 12, 14, "green")
line(7, 23, 12, 18, "green")
line(20, 14, 25, 9, "violet")
line(20, 18, 25, 23, "violet")

for x, y, color in [
    (5, 8, "green"),
    (5, 22, "green"),
    (25, 8, "violet"),
    (25, 22, "violet"),
    (6, 14, "cyan"),
    (24, 16, "cyan"),
]:
    rect(x, y, 2, 2, color)

for x, y in [(9, 27), (13, 28), (18, 28), (23, 27)]:
    rect(x, y, 2, 2, "gold")
    rect(x + 1, y + 1, 1, 1, "white")

rect(4, 28, 4, 1, "green")
rect(25, 28, 3, 1, "green")


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


rows = []
for row in pixels:
    expanded_rows = []
    expanded = []
    for rgb in row:
        expanded.extend(rgb * SCALE)
    expanded_bytes = bytes(expanded)
    for _ in range(SCALE):
        expanded_rows.append(b"\x00" + expanded_bytes)
    rows.extend(expanded_rows)

raw = b"".join(rows)
png = b"\x89PNG\r\n\x1a\n"
png += png_chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
png += png_chunk(b"IDAT", zlib.compress(raw, 9))
png += png_chunk(b"IEND", b"")
OUT.write_bytes(png)
print(OUT)
