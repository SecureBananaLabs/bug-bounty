#!/usr/bin/env python3
"""Generate the signal lantern pixel art asset with only the stdlib."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "pixel-art" / "signal-lantern-ledger.png"

Color = tuple[int, int, int, int]

TRANSPARENT: Color = (0, 0, 0, 0)
INK: Color = (27, 35, 63, 255)
OUTLINE: Color = (7, 11, 26, 255)
SKY: Color = (12, 19, 38, 255)
GRID: Color = (26, 38, 69, 255)
TEAL: Color = (32, 210, 181, 255)
TEAL_DARK: Color = (17, 122, 127, 255)
GOLD: Color = (250, 196, 87, 255)
GOLD_DARK: Color = (174, 118, 51, 255)
ROSE: Color = (239, 91, 122, 255)
PAPER: Color = (232, 238, 248, 255)
PAPER_SHADOW: Color = (124, 139, 169, 255)
WHITE: Color = (255, 255, 255, 255)


def blank(size: int, color: Color) -> list[list[Color]]:
    return [[color for _ in range(size)] for _ in range(size)]


def set_px(canvas: list[list[Color]], x: int, y: int, color: Color) -> None:
    if 0 <= y < len(canvas) and 0 <= x < len(canvas[y]):
        canvas[y][x] = color


def rect(canvas: list[list[Color]], x: int, y: int, w: int, h: int, color: Color) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(canvas, xx, yy, color)


def line_h(canvas: list[list[Color]], x: int, y: int, w: int, color: Color) -> None:
    rect(canvas, x, y, w, 1, color)


def line_v(canvas: list[list[Color]], x: int, y: int, h: int, color: Color) -> None:
    rect(canvas, x, y, 1, h, color)


def circle(canvas: list[list[Color]], cx: int, cy: int, radius: int, color: Color) -> None:
    rr = radius * radius
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr:
                set_px(canvas, x, y, color)


def upscale(canvas: list[list[Color]], factor: int) -> list[list[Color]]:
    rows: list[list[Color]] = []
    for row in canvas:
        expanded = [px for px in row for _ in range(factor)]
        for _ in range(factor):
            rows.append(expanded[:])
    return rows


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, pixels: list[list[Color]]) -> None:
    height = len(pixels)
    width = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    path.parent.mkdir(parents=True, exist_ok=True)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", zlib.compress(bytes(raw), level=9))
        + png_chunk(b"IEND", b"")
    )


def build() -> list[list[Color]]:
    c = blank(64, SKY)

    for y in range(64):
        for x in range(64):
            if (x + y) % 9 == 0:
                set_px(c, x, y, GRID)
            if y > 45 and (x + 2 * y) % 11 == 0:
                set_px(c, x, y, (20, 30, 55, 255))

    rect(c, 6, 51, 52, 5, INK)
    rect(c, 10, 56, 44, 3, OUTLINE)
    line_h(c, 8, 50, 48, TEAL_DARK)

    rect(c, 19, 19, 26, 29, OUTLINE)
    rect(c, 21, 21, 22, 25, INK)
    rect(c, 24, 25, 16, 16, GOLD)
    rect(c, 26, 27, 12, 12, (255, 221, 122, 255))
    rect(c, 28, 29, 8, 8, WHITE)
    rect(c, 24, 38, 16, 3, GOLD_DARK)
    line_v(c, 23, 24, 19, GOLD_DARK)
    line_v(c, 40, 24, 19, GOLD_DARK)

    rect(c, 17, 18, 30, 3, OUTLINE)
    rect(c, 20, 15, 24, 3, TEAL_DARK)
    rect(c, 25, 12, 14, 3, OUTLINE)
    rect(c, 27, 9, 10, 3, TEAL)
    line_h(c, 28, 8, 8, OUTLINE)
    line_v(c, 29, 4, 5, OUTLINE)
    line_v(c, 34, 4, 5, OUTLINE)
    line_h(c, 30, 4, 4, OUTLINE)

    rect(c, 18, 47, 28, 4, OUTLINE)
    rect(c, 22, 44, 20, 3, TEAL_DARK)
    rect(c, 25, 48, 14, 3, GOLD_DARK)

    for sx, sy in [(12, 24), (10, 31), (13, 38)]:
        rect(c, sx, sy, 8, 9, PAPER_SHADOW)
        rect(c, sx + 1, sy, 7, 8, PAPER)
        line_h(c, sx + 3, sy + 3, 4, TEAL_DARK)
        line_h(c, sx + 3, sy + 5, 3, INK)

    for cx, cy in [(51, 30), (54, 37), (49, 43)]:
        circle(c, cx, cy, 4, GOLD_DARK)
        circle(c, cx, cy, 3, GOLD)
        set_px(c, cx, cy - 1, WHITE)
        line_h(c, cx - 1, cy + 1, 3, OUTLINE)

    rect(c, 9, 18, 6, 3, ROSE)
    rect(c, 49, 20, 6, 3, ROSE)
    rect(c, 47, 48, 7, 2, TEAL)
    rect(c, 10, 45, 7, 2, TEAL)

    for x, y in [(4, 8), (11, 12), (54, 8), (58, 15), (49, 10), (7, 58), (58, 57)]:
        set_px(c, x, y, WHITE)
        set_px(c, x + 1, y, WHITE)
        set_px(c, x, y + 1, WHITE)

    return upscale(c, 2)


def main() -> None:
    write_png(OUTPUT, build())
    print(f"wrote {OUTPUT}")


if __name__ == "__main__":
    main()
