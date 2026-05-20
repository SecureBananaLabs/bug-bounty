#!/usr/bin/env python3
"""Generate the verification kiln pixel-art asset."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 128

COLORS = {
    "bg": (10, 14, 26),
    "grid": (19, 31, 52),
    "grid_bright": (32, 55, 88),
    "stone": (76, 85, 106),
    "stone_dark": (44, 52, 72),
    "stone_light": (120, 132, 156),
    "coal": (25, 23, 30),
    "ember": (255, 103, 55),
    "ember_light": (255, 190, 92),
    "blue": (54, 184, 255),
    "blue_dark": (28, 97, 164),
    "green": (68, 226, 137),
    "green_dark": (29, 127, 83),
    "gold": (246, 196, 87),
    "gold_dark": (166, 108, 38),
    "white": (232, 245, 255),
    "shadow": (4, 8, 16),
}


def new_canvas() -> list[list[tuple[int, int, int]]]:
    return [[COLORS["bg"] for _ in range(SIZE)] for _ in range(SIZE)]


def set_pixel(canvas: list[list[tuple[int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        canvas[y][x] = COLORS[color]


def rect(canvas: list[list[tuple[int, int, int]]], x: int, y: int, w: int, h: int, color: str) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_pixel(canvas, xx, yy, color)


def outline_rect(canvas: list[list[tuple[int, int, int]]], x: int, y: int, w: int, h: int, fill: str, border: str) -> None:
    rect(canvas, x, y, w, h, border)
    rect(canvas, x + 2, y + 2, w - 4, h - 4, fill)


def circle(canvas: list[list[tuple[int, int, int]]], cx: int, cy: int, radius: int, color: str) -> None:
    r2 = radius * radius
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2:
                set_pixel(canvas, x, y, color)


def line(canvas: list[list[tuple[int, int, int]]], x1: int, y1: int, x2: int, y2: int, color: str) -> None:
    dx = abs(x2 - x1)
    dy = -abs(y2 - y1)
    sx = 1 if x1 < x2 else -1
    sy = 1 if y1 < y2 else -1
    err = dx + dy
    while True:
        set_pixel(canvas, x1, y1, color)
        if x1 == x2 and y1 == y2:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x1 += sx
        if e2 <= dx:
            err += dx
            y1 += sy


FONT = {
    "S": ["111", "100", "111", "001", "111"],
    "T": ["111", "010", "010", "010", "010"],
    "R": ["110", "101", "110", "101", "101"],
}


def glyph(canvas: list[list[tuple[int, int, int]]], char: str, x: int, y: int, color: str) -> None:
    for row, pattern in enumerate(FONT[char]):
        for col, pixel in enumerate(pattern):
            if pixel == "1":
                rect(canvas, x + col * 2, y + row * 2, 2, 2, color)


def write_png(canvas: list[list[tuple[int, int, int]]], path: Path) -> None:
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0)))
    png.extend(chunk(b"IDAT", zlib.compress(bytes(raw), level=9)))
    png.extend(chunk(b"IEND", b""))
    path.write_bytes(bytes(png))


def main() -> None:
    canvas = new_canvas()

    for n in range(0, SIZE, 8):
        for i in range(SIZE):
            set_pixel(canvas, n, i, "grid")
            set_pixel(canvas, i, n, "grid")
    for x, y in [(18, 18), (108, 20), (14, 92), (112, 96), (36, 112), (96, 112)]:
        circle(canvas, x, y, 2, "grid_bright")

    rect(canvas, 28, 100, 72, 8, "shadow")
    outline_rect(canvas, 38, 46, 52, 48, "stone_dark", "stone")
    rect(canvas, 42, 50, 44, 8, "stone_light")
    rect(canvas, 44, 61, 40, 28, "coal")
    rect(canvas, 50, 68, 28, 16, "ember")
    rect(canvas, 55, 63, 18, 21, "ember_light")
    rect(canvas, 60, 58, 8, 26, "white")
    rect(canvas, 35, 94, 58, 8, "stone")
    rect(canvas, 31, 102, 66, 6, "stone_dark")

    for tile_x, char, color in [(13, "S", "blue"), (13, "T", "green"), (13, "R", "gold")]:
        y = {"S": 36, "T": 56, "R": 76}[char]
        outline_rect(canvas, tile_x, y, 18, 16, "bg", color)
        glyph(canvas, char, tile_x + 6, y + 3, color)
        line(canvas, tile_x + 18, y + 8, 43, 70, color)

    circle(canvas, 103, 68, 16, "gold_dark")
    circle(canvas, 103, 68, 13, "gold")
    rect(canvas, 94, 62, 5, 14, "green_dark")
    line(canvas, 99, 75, 113, 58, "green")
    line(canvas, 100, 76, 114, 59, "green")
    rect(canvas, 104, 50, 7, 5, "white")
    line(canvas, 86, 70, 90, 70, "gold")
    line(canvas, 90, 70, 91, 68, "gold")

    for x in range(48, 80, 7):
        rect(canvas, x, 35, 3, 3, "ember_light")
    rect(canvas, 60, 25, 8, 14, "stone")
    rect(canvas, 56, 21, 16, 5, "stone_light")
    rect(canvas, 58, 15, 12, 6, "stone_dark")

    output = Path(__file__).with_name("verification-kiln.png")
    write_png(canvas, output)
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
