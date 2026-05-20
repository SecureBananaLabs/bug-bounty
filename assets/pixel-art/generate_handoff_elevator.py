#!/usr/bin/env python3
"""Generate the handoff elevator pixel-art asset with only the stdlib."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

WIDTH = HEIGHT = 128
OUT = Path(__file__).with_name("handoff-elevator.png")

Palette = tuple[int, int, int]


def write_png(path: Path, pixels: list[list[Palette]]) -> None:
    raw_rows = []
    for row in pixels:
        raw_rows.append(b"\x00" + b"".join(bytes(rgb) for rgb in row))
    raw = b"".join(raw_rows)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def canvas(color: Palette) -> list[list[Palette]]:
    return [[color for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(img: list[list[Palette]], x: int, y: int, w: int, h: int, color: Palette) -> None:
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        row = img[yy]
        for xx in range(max(0, x), min(WIDTH, x + w)):
            row[xx] = color


def line_h(img: list[list[Palette]], x: int, y: int, w: int, color: Palette) -> None:
    rect(img, x, y, w, 1, color)


def line_v(img: list[list[Palette]], x: int, y: int, h: int, color: Palette) -> None:
    rect(img, x, y, 1, h, color)


def draw_circle(img: list[list[Palette]], cx: int, cy: int, r: int, color: Palette) -> None:
    rr = r * r
    for yy in range(cy - r, cy + r + 1):
        for xx in range(cx - r, cx + r + 1):
            if 0 <= xx < WIDTH and 0 <= yy < HEIGHT and (xx - cx) ** 2 + (yy - cy) ** 2 <= rr:
                img[yy][xx] = color


def draw() -> list[list[Palette]]:
    bg = (19, 24, 33)
    grid = (28, 38, 50)
    img = canvas(bg)

    for x in range(0, WIDTH, 8):
        line_v(img, x, 0, HEIGHT, grid)
    for y in range(0, HEIGHT, 8):
        line_h(img, 0, y, WIDTH, grid)

    # Outer terminal frame.
    rect(img, 17, 12, 94, 104, (9, 12, 18))
    rect(img, 19, 14, 90, 100, (44, 55, 70))
    rect(img, 23, 18, 82, 92, (15, 22, 31))
    rect(img, 23, 18, 82, 8, (73, 88, 105))
    rect(img, 28, 21, 4, 3, (255, 111, 97))
    rect(img, 36, 21, 4, 3, (255, 202, 91))
    rect(img, 44, 21, 4, 3, (108, 214, 117))

    # Elevator shaft and cabin.
    rect(img, 40, 30, 36, 70, (6, 11, 17))
    rect(img, 42, 32, 32, 66, (22, 33, 45))
    rect(img, 45, 36, 26, 58, (13, 19, 27))
    for y in (44, 58, 72, 86):
        line_h(img, 45, y, 26, (43, 62, 80))
    rect(img, 49, 60, 18, 26, (36, 49, 64))
    rect(img, 51, 62, 7, 22, (84, 202, 245))
    rect(img, 59, 62, 6, 22, (44, 130, 178))
    line_v(img, 58, 62, 22, (14, 23, 33))
    rect(img, 52, 65, 3, 4, (196, 247, 255))

    # Status lights for scoped handoff stages.
    labels = [
        (84, 38, (92, 215, 255), (30, 76, 102)),
        (84, 54, (126, 226, 111), (37, 93, 59)),
        (84, 70, (255, 214, 103), (105, 78, 32)),
        (84, 86, (255, 132, 103), (108, 48, 37)),
    ]
    for x, y, lit, shadow in labels:
        rect(img, x - 2, y - 2, 15, 12, (5, 9, 14))
        rect(img, x - 1, y - 1, 13, 10, shadow)
        rect(img, x + 2, y + 2, 7, 4, lit)
        rect(img, x + 9, y + 4, 2, 2, lit)

    # Moving proof capsule.
    rect(img, 28, 93, 72, 7, (64, 48, 31))
    rect(img, 32, 90, 24, 12, (255, 210, 96))
    rect(img, 35, 93, 6, 5, (18, 25, 32))
    rect(img, 43, 93, 6, 5, (18, 25, 32))
    rect(img, 72, 89, 20, 14, (80, 220, 150))
    rect(img, 76, 93, 4, 4, (13, 31, 26))
    rect(img, 83, 93, 5, 4, (13, 31, 26))

    # Checkmark badge.
    draw_circle(img, 64, 112, 10, (42, 176, 110))
    rect(img, 58, 112, 3, 5, (225, 255, 235))
    rect(img, 61, 116, 3, 3, (225, 255, 235))
    rect(img, 64, 113, 3, 3, (225, 255, 235))
    rect(img, 67, 110, 3, 3, (225, 255, 235))
    rect(img, 70, 107, 3, 3, (225, 255, 235))

    # Pixel highlights and depth.
    rect(img, 29, 31, 4, 58, (39, 53, 70))
    rect(img, 96, 31, 4, 58, (6, 10, 15))
    rect(img, 24, 109, 82, 2, (4, 7, 11))
    for x, y in [(31, 35), (32, 73), (96, 52), (98, 80), (75, 31)]:
        rect(img, x, y, 2, 2, (121, 182, 217))

    return img


if __name__ == "__main__":
    write_png(OUT, draw())
    print(OUT)
