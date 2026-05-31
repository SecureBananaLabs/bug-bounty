#!/usr/bin/env python3
"""Generate original 128x128 pixel art for the pixel-art bounty."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/proof-compass.png")

PALETTE = {
    "void": (13, 18, 30, 255),
    "panel": (21, 31, 48, 255),
    "grid": (31, 48, 68, 255),
    "blue": (71, 155, 190, 255),
    "cyan": (111, 210, 214, 255),
    "green": (92, 194, 135, 255),
    "gold": (240, 184, 64, 255),
    "amber": (204, 126, 46, 255),
    "cream": (250, 232, 166, 255),
    "red": (221, 82, 77, 255),
    "ink": (8, 12, 20, 255),
    "white": (236, 246, 247, 255),
}


def blank() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["void"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def put(img, x: int, y: int, color: str) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        img[y][x] = PALETTE[color]


def rect(img, x: int, y: int, w: int, h: int, color: str) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(img, xx, yy, color)


def line(img, x0: int, y0: int, x1: int, y1: int, color: str) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(img, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle_outline(img, cx: int, cy: int, radius: int, color: str) -> None:
    for deg in range(0, 360, 2):
        rad = math.radians(deg)
        put(img, round(cx + math.cos(rad) * radius), round(cy + math.sin(rad) * radius), color)


def diamond(img, cx: int, cy: int, radius: int, color: str) -> None:
    for y in range(cy - radius, cy + radius + 1):
        span = radius - abs(y - cy)
        for x in range(cx - span, cx + span + 1):
            put(img, x, y, color)


def write_png(path: Path, img) -> None:
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def build():
    img = blank()

    rect(img, 8, 8, 112, 112, "panel")
    for pos in range(16, 120, 16):
        line(img, pos, 8, pos, 119, "grid")
        line(img, 8, pos, 119, pos, "grid")

    for x, y, color in [(18, 18, "cyan"), (106, 20, "gold"), (22, 104, "green"), (108, 106, "red")]:
        rect(img, x, y, 3, 3, color)

    # Compass body.
    for radius, color in [(40, "ink"), (37, "gold"), (34, "amber"), (30, "panel"), (27, "blue")]:
        circle_outline(img, 64, 64, radius, color)
        circle_outline(img, 64, 64, radius - 1, color)

    for deg, label_color in [(0, "cream"), (90, "cream"), (180, "cream"), (270, "cream")]:
        rad = math.radians(deg)
        x0 = round(64 + math.cos(rad) * 25)
        y0 = round(64 + math.sin(rad) * 25)
        x1 = round(64 + math.cos(rad) * 35)
        y1 = round(64 + math.sin(rad) * 35)
        line(img, x0, y0, x1, y1, label_color)

    # Needle points to a validated path rather than a map direction.
    diamond(img, 64, 64, 8, "cream")
    line(img, 64, 64, 91, 39, "gold")
    line(img, 65, 64, 92, 40, "gold")
    line(img, 64, 64, 38, 89, "cyan")
    line(img, 63, 64, 37, 88, "cyan")
    diamond(img, 64, 64, 3, "ink")

    # Four proof checkpoints.
    checkpoints = [(35, 34, "scope"), (93, 36, "test"), (92, 92, "review"), (35, 94, "paid")]
    for x, y, _ in checkpoints:
        rect(img, x - 6, y - 5, 12, 10, "ink")
        rect(img, x - 5, y - 4, 10, 8, "green")
        line(img, x - 3, y, x - 1, y + 2, "cream")
        line(img, x - 1, y + 2, x + 4, y - 3, "cream")

    for a, b in zip(checkpoints, checkpoints[1:] + checkpoints[:1]):
        line(img, a[0], a[1], b[0], b[1], "cyan")

    rect(img, 44, 110, 40, 5, "ink")
    rect(img, 47, 111, 34, 3, "gold")

    return img


if __name__ == "__main__":
    write_png(OUT, build())
    print(f"wrote {OUT} ({WIDTH}x{HEIGHT})")
