#!/usr/bin/env python3
"""Generate the review beacon pixel-art submission for issue #80."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "pixel-art" / "review-beacon-terminal.png"
SIZE = 128
SCALE = 4

COLORS = {
    "bg": (9, 12, 24, 255),
    "bg2": (15, 20, 37, 255),
    "grid": (28, 49, 76, 255),
    "grid_bright": (52, 94, 126, 255),
    "terminal": (26, 34, 48, 255),
    "terminal_edge": (86, 115, 139, 255),
    "terminal_shadow": (5, 8, 16, 255),
    "screen": (17, 33, 42, 255),
    "screen_glow": (80, 220, 175, 255),
    "screen_dim": (37, 122, 113, 255),
    "amber": (250, 190, 85, 255),
    "orange": (223, 105, 62, 255),
    "red": (209, 69, 72, 255),
    "mint": (109, 242, 194, 255),
    "blue": (83, 156, 216, 255),
    "white": (224, 235, 220, 255),
    "dark": (10, 13, 18, 255),
}


def blend(a: tuple[int, int, int, int], b: tuple[int, int, int, int], t: float) -> tuple[int, int, int, int]:
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(4))


def rect(img: list[list[tuple[int, int, int, int]]], x: int, y: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
    for yy in range(max(0, y), min(SIZE, y + h)):
        row = img[yy]
        for xx in range(max(0, x), min(SIZE, x + w)):
            row[xx] = color


def line(img: list[list[tuple[int, int, int, int]]], x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int, int]) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        if 0 <= x0 < SIZE and 0 <= y0 < SIZE:
            img[y0][x0] = color
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle(img: list[list[tuple[int, int, int, int]]], cx: int, cy: int, r: int, color: tuple[int, int, int, int]) -> None:
    rr = r * r
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if 0 <= x < SIZE and 0 <= y < SIZE and (x - cx) ** 2 + (y - cy) ** 2 <= rr:
                img[y][x] = color


def write_png(path: Path, img: list[list[tuple[int, int, int, int]]]) -> None:
    rows = []
    for row in img:
        rows.append(b"\x00" + b"".join(bytes(px) for px in row))
    raw = b"".join(rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    payload = [
        b"\x89PNG\r\n\x1a\n",
        chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)),
        chunk(b"IDAT", zlib.compress(raw, 9)),
        chunk(b"IEND", b""),
    ]
    path.write_bytes(b"".join(payload))


def make_art() -> list[list[tuple[int, int, int, int]]]:
    img = [[COLORS["bg"] for _ in range(SIZE)] for _ in range(SIZE)]

    for y in range(SIZE):
        for x in range(SIZE):
            vignette = min(1.0, math.hypot(x - 64, y - 72) / 94)
            base = blend(COLORS["bg2"], COLORS["bg"], vignette * 0.75)
            if (x + y) % 17 == 0:
                base = blend(base, COLORS["blue"], 0.10)
            img[y][x] = base

    for x in range(0, SIZE, 8):
        line(img, x, 92, 64, 58, COLORS["grid"])
        line(img, x, 127, 64, 58, COLORS["grid"])
    for y in range(64, SIZE, 8):
        line(img, 0, y, 127, y, COLORS["grid"])
    line(img, 5, 101, 124, 63, COLORS["grid_bright"])
    line(img, 3, 113, 126, 82, COLORS["grid_bright"])

    rect(img, 18, 61, 61, 41, COLORS["terminal_shadow"])
    rect(img, 15, 57, 62, 39, COLORS["terminal"])
    rect(img, 15, 57, 62, 3, COLORS["terminal_edge"])
    rect(img, 18, 63, 56, 23, COLORS["screen"])
    rect(img, 21, 67, 17, 3, COLORS["screen_glow"])
    rect(img, 21, 74, 41, 2, COLORS["screen_dim"])
    rect(img, 21, 80, 31, 2, COLORS["screen_dim"])
    rect(img, 57, 67, 9, 3, COLORS["amber"])
    rect(img, 23, 90, 8, 3, COLORS["terminal_edge"])
    rect(img, 37, 90, 8, 3, COLORS["terminal_edge"])
    rect(img, 51, 90, 8, 3, COLORS["terminal_edge"])
    rect(img, 66, 90, 4, 3, COLORS["red"])

    rect(img, 91, 52, 8, 37, COLORS["terminal_shadow"])
    rect(img, 88, 48, 10, 41, COLORS["terminal_edge"])
    rect(img, 91, 42, 4, 11, COLORS["amber"])
    circle(img, 93, 38, 8, COLORS["orange"])
    circle(img, 93, 38, 5, COLORS["amber"])
    circle(img, 93, 38, 2, COLORS["white"])
    for r, color in [(13, "orange"), (20, "amber"), (27, "mint")]:
        for a in range(220, 321, 8):
            rad = math.radians(a)
            x = round(93 + math.cos(rad) * r)
            y = round(38 + math.sin(rad) * r)
            if 0 <= x < SIZE and 0 <= y < SIZE:
                img[y][x] = blend(COLORS[color], COLORS["bg"], 0.18)

    for px, py in [(83, 76), (96, 80), (106, 72), (111, 91), (72, 106), (51, 110), (31, 106)]:
        circle(img, px, py, 2, COLORS["mint"])
    for start, end in [((77, 76), (83, 76)), ((96, 80), (106, 72)), ((106, 72), (111, 91)), ((51, 110), (72, 106)), ((31, 106), (51, 110)), ((72, 106), (93, 89))]:
        line(img, start[0], start[1], end[0], end[1], COLORS["screen_dim"])

    rect(img, 82, 94, 24, 15, COLORS["amber"])
    rect(img, 85, 91, 18, 6, COLORS["amber"])
    rect(img, 87, 97, 14, 3, COLORS["white"])
    rect(img, 89, 103, 10, 2, COLORS["orange"])
    rect(img, 80, 109, 28, 3, COLORS["terminal_shadow"])

    for x, y, color in [(12, 19, "mint"), (26, 32, "amber"), (47, 19, "blue"), (111, 19, "white"), (116, 63, "mint"), (101, 116, "amber")]:
        rect(img, x, y, 2, 2, COLORS[color])

    return img


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    write_png(OUTPUT, make_art())
    print(OUTPUT)


if __name__ == "__main__":
    main()
