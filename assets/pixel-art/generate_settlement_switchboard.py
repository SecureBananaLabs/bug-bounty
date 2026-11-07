#!/usr/bin/env python3
"""Generate the settlement-switchboard pixel art PNG with stdlib only."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

WIDTH = 128
HEIGHT = 128
OUT = Path(__file__).with_name("settlement-switchboard.png")

PALETTE = {
    "bg": (7, 14, 28, 255),
    "grid": (14, 31, 54, 255),
    "panel": (22, 32, 55, 255),
    "panel_hi": (38, 54, 86, 255),
    "shadow": (3, 7, 16, 255),
    "wire": (94, 119, 161, 255),
    "wire_dim": (43, 60, 92, 255),
    "mint": (117, 241, 184, 255),
    "mint_hi": (197, 255, 225, 255),
    "gold": (245, 193, 85, 255),
    "gold_hi": (255, 231, 145, 255),
    "rose": (255, 113, 142, 255),
    "blue": (93, 183, 255, 255),
    "violet": (178, 143, 255, 255),
    "white": (238, 244, 255, 255),
}


def new_canvas() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["bg"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def put(canvas, x, y, color):
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = PALETTE[color]


def rect(canvas, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(canvas, xx, yy, color)


def line(canvas, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(canvas, x0, y0, color)
        put(canvas, x0 + 1, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def node(canvas, cx, cy, color, lit=True):
    rect(canvas, cx - 6, cy - 6, 12, 12, "shadow")
    rect(canvas, cx - 5, cy - 5, 10, 10, color)
    rect(canvas, cx - 3, cy - 3, 6, 6, f"{color}_hi" if f"{color}_hi" in PALETTE else "white")
    if lit:
        rect(canvas, cx - 1, cy - 1, 2, 2, "white")


def draw_check(canvas, x, y):
    for i in range(4):
        rect(canvas, x + i * 2, y + 8 + i * 2, 2, 2, "mint_hi")
    for i in range(7):
        rect(canvas, x + 8 + i * 2, y + 14 - i * 2, 2, 2, "mint_hi")


def draw_coin(canvas, x, y):
    rect(canvas, x, y + 4, 18, 10, "gold")
    rect(canvas, x + 2, y + 2, 14, 14, "gold")
    rect(canvas, x + 5, y + 5, 8, 8, "gold_hi")
    rect(canvas, x + 8, y + 4, 2, 10, "white")


def write_png(path: Path, canvas):
    raw = bytearray()
    for row in canvas:
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
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def main():
    canvas = new_canvas()

    for x in range(0, WIDTH, 8):
        for y in range(0, HEIGHT, 8):
            if (x + y) % 16 == 0:
                put(canvas, x, y, "grid")
    for x in range(12, 118, 16):
        line(canvas, x, 12, x, 116, "wire_dim")
    for y in range(16, 116, 16):
        line(canvas, 12, y, 116, y, "wire_dim")

    rect(canvas, 20, 18, 88, 84, "shadow")
    rect(canvas, 18, 16, 88, 84, "panel")
    rect(canvas, 18, 16, 88, 4, "panel_hi")
    rect(canvas, 22, 88, 80, 8, "panel_hi")

    points = [(34, 34, "blue"), (62, 30, "violet"), (88, 42, "mint"), (48, 66, "rose"), (82, 72, "gold")]
    for start, end in zip(points, points[1:]):
        line(canvas, start[0], start[1], end[0], end[1], "wire")
    line(canvas, 82, 72, 98, 106, "wire")

    for x, y, color in points:
        node(canvas, x, y, color)

    rect(canvas, 56, 51, 18, 8, "panel_hi")
    rect(canvas, 61, 45, 8, 22, "wire")
    rect(canvas, 63, 43, 4, 5, "white")
    draw_check(canvas, 28, 84)
    draw_coin(canvas, 90, 96)

    for y in range(108, 118, 2):
        rect(canvas, 24, y, 58, 1, "wire_dim")
    rect(canvas, 22, 108, 6, 6, "mint")
    rect(canvas, 76, 108, 6, 6, "gold")

    write_png(OUT, canvas)
    print(f"wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
