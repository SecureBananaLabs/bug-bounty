#!/usr/bin/env python3
"""Generate an original 128x128 pixel-art bounty asset."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
SCALE = 4
GRID = WIDTH // SCALE

OUT = Path("assets/pixel-art/latent-market-oracle.png")

PALETTE = {
    "bg": (18, 22, 34),
    "grid": (34, 42, 61),
    "panel": (47, 56, 78),
    "panel_hi": (75, 91, 124),
    "cyan": (86, 216, 221),
    "mint": (100, 228, 159),
    "gold": (247, 196, 83),
    "amber": (211, 125, 65),
    "pink": (229, 100, 145),
    "white": (231, 239, 236),
    "shadow": (9, 11, 18),
}


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def rect(pixels, x0, y0, x1, y1, color):
    for y in range(max(0, y0), min(GRID, y1)):
        for x in range(max(0, x0), min(GRID, x1)):
            pixels[y][x] = color


def line(pixels, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        if 0 <= x < GRID and 0 <= y < GRID:
            pixels[y][x] = color
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def circle(pixels, cx, cy, r, color, fill=True):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if fill and d2 <= r * r:
                if 0 <= x < GRID and 0 <= y < GRID:
                    pixels[y][x] = color
            if not fill and r * r - r <= d2 <= r * r + r:
                if 0 <= x < GRID and 0 <= y < GRID:
                    pixels[y][x] = color


def build_grid():
    pixels = [[PALETTE["bg"] for _ in range(GRID)] for _ in range(GRID)]

    for i in range(0, GRID, 4):
        line(pixels, i, 0, i, GRID - 1, PALETTE["grid"])
        line(pixels, 0, i, GRID - 1, i, PALETTE["grid"])

    rect(pixels, 2, 22, 30, 30, PALETTE["shadow"])
    rect(pixels, 2, 21, 30, 29, PALETTE["panel"])
    rect(pixels, 3, 22, 29, 23, PALETTE["panel_hi"])

    # Radar/telescope dish looking for latent signals.
    circle(pixels, 10, 13, 6, PALETTE["cyan"], fill=False)
    circle(pixels, 10, 13, 3, PALETTE["panel"], fill=True)
    line(pixels, 10, 13, 20, 21, PALETTE["cyan"])
    line(pixels, 11, 13, 21, 21, PALETTE["cyan"])
    rect(pixels, 7, 18, 13, 20, PALETTE["panel_hi"])
    rect(pixels, 9, 20, 11, 24, PALETTE["panel_hi"])

    # Signal paths and discovered nodes.
    for x, y, color in [
        (21, 7, "mint"),
        (25, 11, "pink"),
        (22, 16, "gold"),
        (27, 19, "cyan"),
        (18, 10, "white"),
    ]:
        circle(pixels, x, y, 1, PALETTE[color], fill=True)
        line(pixels, 11, 13, x, y, PALETTE[color])

    # Verified bounty coin.
    circle(pixels, 23, 24, 4, PALETTE["gold"], fill=True)
    circle(pixels, 23, 24, 2, PALETTE["amber"], fill=False)
    line(pixels, 21, 24, 23, 26, PALETTE["shadow"])
    line(pixels, 23, 26, 27, 21, PALETTE["shadow"])
    line(pixels, 21, 23, 23, 25, PALETTE["white"])
    line(pixels, 23, 25, 27, 20, PALETTE["white"])

    # Bottom status lights.
    for i, color in enumerate(["cyan", "mint", "gold", "pink"]):
        rect(pixels, 5 + i * 5, 25, 8 + i * 5, 27, PALETTE[color])

    return pixels


def scale_grid(pixels):
    rows = []
    for row in pixels:
        expanded = []
        for color in row:
            expanded.extend([color] * SCALE)
        for _ in range(SCALE):
            rows.append(expanded)
    return rows


def write_png(path: Path, pixels):
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for red, green, blue in row:
            raw.extend((red, green, blue, 255))

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as fp:
        fp.write(b"\x89PNG\r\n\x1a\n")
        fp.write(png_chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0)))
        fp.write(png_chunk(b"IDAT", zlib.compress(bytes(raw), level=9)))
        fp.write(png_chunk(b"IEND", b""))


def main():
    write_png(OUT, scale_grid(build_grid()))
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
