#!/usr/bin/env python3
"""Generate the merge observatory pixel-art bounty asset."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

SIZE = 128

BG = (10, 13, 28, 255)
GRID = (28, 41, 66, 255)
STAR = (248, 231, 151, 255)
STAR_DIM = (107, 132, 176, 255)
TEAL = (48, 210, 190, 255)
TEAL_DARK = (18, 94, 105, 255)
GOLD = (247, 189, 84, 255)
GOLD_DARK = (156, 97, 43, 255)
ROSE = (230, 80, 117, 255)
BLUE = (75, 113, 245, 255)
BLUE_DARK = (28, 48, 113, 255)
STONE = (96, 103, 124, 255)
STONE_DARK = (42, 48, 67, 255)
WHITE = (235, 244, 255, 255)


def set_px(pixels: list[list[tuple[int, int, int, int]]], x: int, y: int, color) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        pixels[y][x] = color


def rect(pixels, x0, y0, x1, y1, color) -> None:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            set_px(pixels, x, y, color)


def line(pixels, x0, y0, x1, y1, color) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        set_px(pixels, x, y, color)
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def circle(pixels, cx, cy, radius, color, fill=False) -> None:
    r2 = radius * radius
    inner = (radius - 1) * (radius - 1)
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            d = (x - cx) * (x - cx) + (y - cy) * (y - cy)
            if fill and d <= r2:
                set_px(pixels, x, y, color)
            elif inner <= d <= r2 + radius:
                set_px(pixels, x, y, color)


def write_png(path: Path, pixels) -> None:
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    pixels = [[BG for _ in range(SIZE)] for _ in range(SIZE)]

    for x in range(0, SIZE, 8):
        for y in range(0, SIZE, 2):
            if y % 16 in (0, 2):
                set_px(pixels, x, y, GRID)
    for y in range(0, SIZE, 8):
        for x in range(0, SIZE, 2):
            if x % 16 in (0, 2):
                set_px(pixels, x, y, GRID)

    for x, y in [(15, 19), (25, 55), (39, 13), (58, 27), (84, 18), (104, 36), (113, 72), (18, 91), (72, 102), (97, 96)]:
        set_px(pixels, x, y, STAR)
        set_px(pixels, x + 1, y, STAR_DIM)
        set_px(pixels, x, y + 1, STAR_DIM)

    rect(pixels, 21, 100, 106, 108, STONE_DARK)
    rect(pixels, 26, 93, 101, 99, STONE)
    rect(pixels, 37, 84, 90, 92, STONE_DARK)
    rect(pixels, 43, 76, 84, 83, STONE)
    rect(pixels, 49, 68, 78, 75, STONE_DARK)

    rect(pixels, 60, 43, 67, 68, TEAL_DARK)
    rect(pixels, 62, 41, 65, 68, TEAL)
    circle(pixels, 64, 40, 17, BLUE_DARK, fill=True)
    circle(pixels, 64, 40, 15, BLUE)
    circle(pixels, 64, 40, 11, TEAL_DARK)
    circle(pixels, 64, 40, 8, TEAL, fill=True)
    rect(pixels, 61, 37, 67, 43, WHITE)
    rect(pixels, 63, 35, 65, 45, WHITE)

    line(pixels, 64, 40, 29, 24, GOLD)
    line(pixels, 64, 40, 101, 24, GOLD)
    line(pixels, 64, 40, 105, 72, GOLD_DARK)
    line(pixels, 64, 40, 22, 72, GOLD_DARK)

    rect(pixels, 23, 22, 35, 28, BLUE_DARK)
    rect(pixels, 25, 20, 37, 26, BLUE)
    rect(pixels, 28, 18, 34, 24, TEAL)
    rect(pixels, 31, 15, 33, 17, WHITE)

    rect(pixels, 94, 20, 107, 28, BLUE_DARK)
    rect(pixels, 92, 18, 105, 26, BLUE)
    rect(pixels, 96, 15, 101, 20, TEAL)
    rect(pixels, 99, 12, 101, 14, WHITE)

    rect(pixels, 84, 66, 110, 82, GOLD_DARK)
    rect(pixels, 87, 63, 107, 79, GOLD)
    rect(pixels, 92, 68, 102, 74, BG)
    line(pixels, 94, 71, 98, 75, TEAL)
    line(pixels, 98, 75, 104, 67, TEAL)

    rect(pixels, 16, 66, 43, 83, BLUE_DARK)
    rect(pixels, 19, 63, 40, 80, BLUE)
    rect(pixels, 23, 68, 36, 75, BG)
    set_px(pixels, 29, 70, ROSE)
    set_px(pixels, 31, 70, ROSE)
    set_px(pixels, 33, 70, ROSE)

    for x in range(38, 91, 8):
        rect(pixels, x, 91, x + 3, 95, TEAL_DARK)
        set_px(pixels, x + 1, 90, TEAL)

    write_png(Path(__file__).with_name("merge-observatory.png"), pixels)


if __name__ == "__main__":
    main()
