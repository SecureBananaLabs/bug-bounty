#!/usr/bin/env python3
"""Generate review-tessellator.png as deterministic pixel art.

The script intentionally uses only the Python standard library so reviewers can
reproduce the PNG without installing image dependencies.
"""

from __future__ import annotations

import os
import struct
import zlib
from pathlib import Path


SIZE = 128
OUT = Path(__file__).with_name("review-tessellator.png")

Palette = dict[str, tuple[int, int, int, int]]

PAL: Palette = {
    "bg": (10, 14, 22, 255),
    "grid": (22, 36, 50, 255),
    "grid_hi": (39, 59, 75, 255),
    "panel": (31, 45, 57, 255),
    "panel_hi": (54, 74, 88, 255),
    "ink": (206, 226, 219, 255),
    "mint": (74, 215, 148, 255),
    "gold": (242, 188, 81, 255),
    "coral": (230, 92, 92, 255),
    "blue": (80, 160, 225, 255),
    "purple": (169, 119, 240, 255),
    "shadow": (5, 8, 14, 255),
    "black": (0, 0, 0, 255),
}


def blank() -> list[list[tuple[int, int, int, int]]]:
    return [[PAL["bg"] for _ in range(SIZE)] for _ in range(SIZE)]


def rect(img, x, y, w, h, color):
    rgba = PAL[color] if isinstance(color, str) else color
    for yy in range(max(0, y), min(SIZE, y + h)):
        for xx in range(max(0, x), min(SIZE, x + w)):
            img[yy][xx] = rgba


def line_h(img, x, y, w, color):
    rect(img, x, y, w, 1, color)


def line_v(img, x, y, h, color):
    rect(img, x, y, 1, h, color)


def box(img, x, y, w, h, fill, edge="panel_hi"):
    rect(img, x + 1, y + 1, w - 2, h - 2, fill)
    line_h(img, x, y, w, edge)
    line_h(img, x, y + h - 1, w, "shadow")
    line_v(img, x, y, h, edge)
    line_v(img, x + w - 1, y, h, "shadow")


def diamond(img, cx, cy, r, color):
    for dy in range(-r, r + 1):
        span = r - abs(dy)
        rect(img, cx - span, cy + dy, span * 2 + 1, 1, color)


def draw_icon(img, x, y, kind):
    if kind == "scope":
        rect(img, x + 3, y + 3, 10, 10, "blue")
        rect(img, x + 5, y + 5, 6, 6, "bg")
        rect(img, x + 7, y + 7, 2, 2, "blue")
    elif kind == "test":
        rect(img, x + 4, y + 3, 8, 2, "mint")
        rect(img, x + 3, y + 5, 10, 2, "mint")
        rect(img, x + 5, y + 7, 6, 6, "mint")
        rect(img, x + 7, y + 8, 2, 4, "bg")
    elif kind == "review":
        rect(img, x + 2, y + 4, 12, 8, "purple")
        rect(img, x + 4, y + 6, 8, 1, "ink")
        rect(img, x + 4, y + 9, 6, 1, "ink")
    elif kind == "merge":
        rect(img, x + 3, y + 3, 3, 10, "mint")
        rect(img, x + 10, y + 3, 3, 10, "gold")
        rect(img, x + 5, y + 6, 6, 2, "ink")
    elif kind == "payout":
        diamond(img, x + 8, y + 8, 6, "gold")
        rect(img, x + 6, y + 7, 5, 2, "bg")


def write_png(path: Path, img):
    raw = bytearray()
    for row in img:
        raw.append(0)
        for px in row:
            raw.extend(px)

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)))
    png.extend(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
    png.extend(chunk(b"IEND", b""))
    path.write_bytes(png)


def main():
    img = blank()

    for x in range(0, SIZE, 8):
        line_v(img, x, 0, SIZE, "grid")
    for y in range(0, SIZE, 8):
        line_h(img, 0, y, SIZE, "grid")
    for i in range(0, 128, 16):
        rect(img, i, (i * 3) % 128, 2, 2, "grid_hi")
        rect(img, 126 - i, (i * 5 + 13) % 128, 2, 2, "grid_hi")

    box(img, 14, 12, 100, 20, "panel")
    rect(img, 20, 18, 6, 4, "coral")
    rect(img, 30, 18, 18, 4, "ink")
    rect(img, 54, 18, 10, 4, "blue")
    rect(img, 68, 18, 28, 4, "mint")
    rect(img, 100, 18, 8, 4, "gold")

    tiles = [
        (18, 42, "scope", "blue"),
        (40, 42, "test", "mint"),
        (62, 42, "review", "purple"),
        (84, 42, "merge", "coral"),
        (52, 75, "payout", "gold"),
    ]
    for x, y, kind, color in tiles:
        box(img, x, y, 26, 26, "panel")
        rect(img, x + 4, y + 4, 18, 18, color)
        draw_icon(img, x + 5, y + 5, kind)

    for x1, y1, x2, y2 in [
        (31, 55, 40, 55),
        (53, 55, 62, 55),
        (75, 55, 84, 55),
        (53, 68, 60, 75),
        (91, 68, 73, 75),
    ]:
        if y1 == y2:
            line_h(img, min(x1, x2), y1, abs(x2 - x1) + 1, "ink")
        else:
            sx = 1 if x2 > x1 else -1
            for step in range(abs(x2 - x1) + 1):
                rect(img, x1 + step * sx, y1 + min(step, abs(y2 - y1)), 1, 1, "ink")

    for x in (19, 41, 63, 85, 53):
        rect(img, x + 14, 36, 3, 3, "gold")
        rect(img, x + 17, 37, 2, 1, "mint")

    box(img, 30, 106, 68, 10, "panel")
    for offset, color in enumerate(["blue", "mint", "purple", "coral", "gold"]):
        rect(img, 36 + offset * 12, 109, 8, 3, color)
    rect(img, 83, 109, 9, 3, "ink")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    write_png(OUT, img)
    print(f"Wrote {os.path.relpath(OUT, Path.cwd())}")


if __name__ == "__main__":
    main()
