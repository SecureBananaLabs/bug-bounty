#!/usr/bin/env python3
"""Generate original pixel art for bounty #80.

Theme: a settlement canal lock that moves scoped work from proof to payout.
The script is deterministic and uses only the Python standard library.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/settlement-canal-lock.png")

INK = (13, 18, 32)
BG = (19, 27, 46)
GRID = (29, 43, 70)
WATER_DARK = (22, 82, 112)
WATER = (38, 155, 171)
WATER_LIGHT = (103, 232, 249)
STONE = (80, 88, 108)
STONE_LIGHT = (134, 146, 166)
GATE = (148, 112, 73)
GATE_DARK = (96, 67, 43)
GOLD = (245, 185, 66)
GOLD_DARK = (174, 112, 32)
GREEN = (77, 221, 132)
RED = (248, 92, 92)
BLUE = (96, 165, 250)
PAPER = (226, 232, 240)
PAPER_DARK = (148, 163, 184)
SHADOW = (8, 12, 22)


def make_canvas() -> list[list[tuple[int, int, int]]]:
    return [[BG for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(canvas, x, y, w, h, color):
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        for xx in range(max(0, x), min(WIDTH, x + w)):
            canvas[yy][xx] = color


def line_h(canvas, x, y, w, color):
    rect(canvas, x, y, w, 1, color)


def line_v(canvas, x, y, h, color):
    rect(canvas, x, y, 1, h, color)


def frame(canvas, x, y, w, h, color):
    line_h(canvas, x, y, w, color)
    line_h(canvas, x, y + h - 1, w, color)
    line_v(canvas, x, y, h, color)
    line_v(canvas, x + w - 1, y, h, color)


def dot(canvas, x, y, color):
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = color


def add_background(canvas):
    for x in range(0, WIDTH, 8):
        line_v(canvas, x, 0, HEIGHT, GRID if x % 16 == 0 else INK)
    for y in range(0, HEIGHT, 8):
        line_h(canvas, 0, y, WIDTH, GRID if y % 16 == 0 else INK)

    for x, y, color in [
        (18, 14, BLUE),
        (42, 21, WATER_LIGHT),
        (88, 13, GREEN),
        (109, 29, GOLD),
        (15, 103, WATER_LIGHT),
        (103, 105, BLUE),
    ]:
        rect(canvas, x, y, 2, 2, color)


def add_canal(canvas):
    rect(canvas, 12, 47, 104, 34, SHADOW)
    rect(canvas, 14, 43, 100, 34, STONE)
    rect(canvas, 18, 47, 92, 26, WATER_DARK)
    rect(canvas, 18, 54, 92, 12, WATER)
    for y in (49, 58, 67):
        for x in range(20, 108, 12):
            line_h(canvas, x, y, 7, WATER_LIGHT)
    for x in range(18, 110, 8):
        rect(canvas, x, 43, 4, 4, STONE_LIGHT)
        rect(canvas, x + 2, 73, 4, 4, STONE_LIGHT)


def add_lock_gates(canvas):
    for x in (33, 86):
        rect(canvas, x, 36, 9, 48, GATE_DARK)
        rect(canvas, x + 2, 38, 5, 44, GATE)
        for y in range(42, 80, 8):
            line_h(canvas, x + 2, y, 5, GOLD_DARK)
        rect(canvas, x - 2, 32, 13, 5, STONE_LIGHT)
        rect(canvas, x - 1, 84, 11, 4, STONE_LIGHT)


def add_work_crate(canvas):
    rect(canvas, 53, 49, 24, 18, GATE_DARK)
    rect(canvas, 55, 47, 20, 18, PAPER_DARK)
    rect(canvas, 57, 49, 16, 14, PAPER)
    rect(canvas, 60, 52, 10, 2, BLUE)
    rect(canvas, 60, 57, 8, 2, GREEN)
    rect(canvas, 72, 51, 3, 10, GOLD)
    rect(canvas, 50, 66, 30, 3, SHADOW)


def add_control_panel(canvas):
    rect(canvas, 18, 88, 43, 22, SHADOW)
    rect(canvas, 20, 86, 39, 21, INK)
    frame(canvas, 20, 86, 39, 21, STONE_LIGHT)
    rect(canvas, 25, 92, 6, 6, GREEN)
    rect(canvas, 36, 92, 6, 6, GOLD)
    rect(canvas, 47, 92, 6, 6, RED)
    line_h(canvas, 25, 102, 28, BLUE)
    line_h(canvas, 25, 104, 20, WATER_LIGHT)


def add_payout_markers(canvas):
    rect(canvas, 75, 89, 34, 16, SHADOW)
    for x, h in [(79, 8), (87, 12), (95, 16)]:
        rect(canvas, x, 102 - h, 7, h, GOLD_DARK)
        rect(canvas, x + 1, 100 - h, 5, h, GOLD)
        line_h(canvas, x + 1, 100 - h, 5, PAPER)
    rect(canvas, 104, 86, 8, 8, GREEN)
    rect(canvas, 106, 88, 4, 4, PAPER)


def add_pixel_border(canvas):
    frame(canvas, 4, 4, 120, 120, INK)
    frame(canvas, 6, 6, 116, 116, GRID)
    for x in range(12, 117, 12):
        rect(canvas, x, 4, 4, 4, BLUE if x % 24 else GOLD)
        rect(canvas, x, 120, 4, 4, GREEN if x % 24 else WATER_LIGHT)


def render():
    canvas = make_canvas()
    add_background(canvas)
    add_canal(canvas)
    add_lock_gates(canvas)
    add_work_crate(canvas)
    add_control_panel(canvas)
    add_payout_markers(canvas)
    add_pixel_border(canvas)

    # Pixel sparkle in the lock chamber.
    for x, y in [(48, 44), (80, 43), (46, 77), (82, 77), (64, 39), (64, 82)]:
        dot(canvas, x, y, WATER_LIGHT)
        dot(canvas, x + 1, y, WATER_LIGHT)
        dot(canvas, x, y + 1, BLUE)

    return canvas


def write_png(path: Path, canvas):
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for row in canvas:
        rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))
    raw = b"".join(rows)

    def chunk(kind: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(raw, level=9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def main():
    write_png(OUT, render())
    print(f"wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
