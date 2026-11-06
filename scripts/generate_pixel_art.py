#!/usr/bin/env python3
"""Generate the original pixel-art bounty asset for issue #80."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pixel-art" / "audit-lantern-grid.png"

WIDTH = 128
HEIGHT = 128

PALETTE = {
    "void": (10, 13, 20, 255),
    "deep": (16, 23, 34, 255),
    "grid": (28, 63, 70, 255),
    "trace": (62, 172, 140, 255),
    "trace_hi": (125, 238, 194, 255),
    "gold": (235, 184, 76, 255),
    "gold_hi": (255, 226, 132, 255),
    "amber": (211, 112, 57, 255),
    "shadow": (51, 36, 36, 255),
    "glass": (115, 196, 213, 255),
    "white": (235, 244, 241, 255),
}


def blank() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["void"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def dot(img: list[list[tuple[int, int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        img[y][x] = PALETTE[color]


def rect(
    img: list[list[tuple[int, int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: str,
) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            dot(img, xx, yy, color)


def line(
    img: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: str,
) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        dot(img, x0, y0, color)
        if x0 == x1 and y0 == y1:
            return
        twice = 2 * err
        if twice >= dy:
            err += dy
            x0 += sx
        if twice <= dx:
            err += dx
            y0 += sy


def fill_circle(
    img: list[list[tuple[int, int, int, int]]], cx: int, cy: int, radius: int, color: str
) -> None:
    r2 = radius * radius
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                dot(img, x, y, color)


def pixelate_shadow(img: list[list[tuple[int, int, int, int]]]) -> None:
    for y in range(0, HEIGHT, 4):
        for x in range(0, WIDTH, 4):
            if ((x * 17 + y * 23) % 37) in {0, 1, 2}:
                rect(img, x, y, 2, 2, "deep")


def draw_grid(img: list[list[tuple[int, int, int, int]]]) -> None:
    for x in range(8, WIDTH, 12):
        line(img, x, 10, x, 116, "grid")
    for y in range(14, HEIGHT, 12):
        line(img, 8, y, 119, y, "grid")

    traces = [
        (14, 97, 45, 97, 45, 76),
        (82, 97, 111, 97, 111, 70),
        (25, 35, 48, 35, 48, 55),
        (101, 31, 82, 31, 82, 54),
        (21, 74, 37, 74, 37, 62),
        (92, 74, 109, 74, 109, 58),
    ]
    for x0, y0, x1, y1, x2, y2 in traces:
        line(img, x0, y0, x1, y1, "trace")
        line(img, x1, y1, x2, y2, "trace")
        fill_circle(img, x0, y0, 2, "trace_hi")
        fill_circle(img, x2, y2, 2, "trace_hi")


def draw_lantern(img: list[list[tuple[int, int, int, int]]]) -> None:
    fill_circle(img, 64, 62, 29, "amber")
    fill_circle(img, 64, 62, 23, "gold")
    fill_circle(img, 64, 62, 15, "gold_hi")

    rect(img, 45, 42, 38, 48, "shadow")
    rect(img, 49, 46, 30, 40, "glass")
    rect(img, 53, 50, 22, 32, "deep")
    rect(img, 57, 54, 14, 24, "gold_hi")
    rect(img, 60, 58, 8, 16, "white")

    rect(img, 42, 39, 44, 5, "gold")
    rect(img, 47, 35, 34, 4, "gold_hi")
    rect(img, 55, 30, 18, 5, "gold")
    line(img, 58, 30, 58, 22, "gold_hi")
    line(img, 70, 30, 70, 22, "gold_hi")
    line(img, 58, 22, 70, 22, "gold")

    rect(img, 42, 90, 44, 6, "gold")
    rect(img, 49, 96, 30, 4, "gold_hi")
    rect(img, 55, 100, 18, 4, "gold")

    line(img, 50, 46, 78, 82, "trace_hi")
    line(img, 78, 46, 50, 82, "trace_hi")
    for x, y in [(52, 49), (75, 49), (52, 79), (75, 79)]:
        fill_circle(img, x, y, 2, "white")


def draw_foreground_marks(img: list[list[tuple[int, int, int, int]]]) -> None:
    for x, y in [(20, 106), (33, 111), (94, 110), (108, 104), (17, 25), (111, 24)]:
        rect(img, x, y, 5, 5, "gold")
        rect(img, x + 1, y + 1, 3, 3, "gold_hi")
    for x, y in [(30, 84), (98, 84), (64, 111), (64, 18)]:
        fill_circle(img, x, y, 3, "trace_hi")
        fill_circle(img, x, y, 1, "white")


def write_png(path: Path, img: list[list[tuple[int, int, int, int]]]) -> None:
    raw = b"".join(b"\x00" + b"".join(bytes(pixel) for pixel in row) for row in img)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def main() -> None:
    img = blank()
    pixelate_shadow(img)
    draw_grid(img)
    draw_lantern(img)
    draw_foreground_marks(img)
    write_png(OUT, img)
    print(OUT)


if __name__ == "__main__":
    main()
