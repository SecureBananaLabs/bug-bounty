#!/usr/bin/env python3
"""Generate the bounty semaphore pixel-art asset with the Python stdlib."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 128
OUT = Path(__file__).with_name("bounty-semaphore.png")

PALETTE = {
    "bg": (9, 14, 31),
    "bg2": (13, 23, 47),
    "grid": (29, 48, 84),
    "grid_hi": (45, 76, 124),
    "steel": (88, 111, 144),
    "steel_dark": (41, 58, 89),
    "paper": (219, 229, 216),
    "paper_shadow": (145, 165, 160),
    "blue": (71, 153, 231),
    "cyan": (88, 211, 213),
    "green": (76, 205, 127),
    "gold": (245, 184, 74),
    "amber": (213, 119, 48),
    "red": (217, 76, 80),
    "purple": (154, 112, 222),
    "ink": (20, 26, 42),
    "white": (241, 247, 255),
}


def new_canvas() -> list[list[tuple[int, int, int]]]:
    pixels = [[PALETTE["bg"] for _ in range(SIZE)] for _ in range(SIZE)]
    for y in range(SIZE):
        for x in range(SIZE):
            if y > 76:
                pixels[y][x] = PALETTE["bg2"]
            if (x + 2 * y) % 37 == 0 and y < 70:
                pixels[y][x] = (18, 30, 58)
    return pixels


def rect(pixels, x, y, w, h, color):
    for yy in range(max(0, y), min(SIZE, y + h)):
        row = pixels[yy]
        for xx in range(max(0, x), min(SIZE, x + w)):
            row[xx] = PALETTE[color] if isinstance(color, str) else color


def line(pixels, x0, y0, x1, y1, color):
    c = PALETTE[color] if isinstance(color, str) else color
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        rect(pixels, x0, y0, 2, 2, c)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def outline(pixels, x, y, w, h, fill, border="ink"):
    rect(pixels, x, y, w, h, border)
    rect(pixels, x + 1, y + 1, w - 2, h - 2, fill)


def diamond(pixels, cx, cy, r, color):
    for yy in range(cy - r, cy + r + 1):
        span = r - abs(cy - yy)
        rect(pixels, cx - span, yy, span * 2 + 1, 1, color)


def write_png(path: Path, pixels):
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk("IHDR".encode(), struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
    png += chunk("IDAT".encode(), zlib.compress(bytes(raw), 9))
    png += chunk("IEND".encode(), b"")
    path.write_bytes(png)


def build():
    pixels = new_canvas()

    # Perspective work grid.
    for y in range(84, 128, 8):
        line(pixels, 0, y, 127, min(127, y + 12), "grid")
    for x in range(0, 128, 12):
        line(pixels, x, 127, 64, 78, "grid")
    line(pixels, 0, 87, 127, 87, "grid_hi")

    # Ticket rail and staged status lamps.
    rect(pixels, 19, 99, 90, 4, "steel_dark")
    for x, color in [(27, "blue"), (46, "cyan"), (65, "green"), (84, "gold")]:
        rect(pixels, x, 94, 10, 10, "ink")
        rect(pixels, x + 2, 96, 6, 6, color)
        rect(pixels, x + 4, 92, 2, 2, "white")

    # Work ticket with check mark.
    outline(pixels, 48, 105, 32, 15, "paper")
    rect(pixels, 52, 109, 18, 2, "paper_shadow")
    line(pixels, 57, 114, 61, 118, "green")
    line(pixels, 61, 118, 72, 108, "green")

    # Central semaphore mast.
    rect(pixels, 61, 31, 6, 61, "steel_dark")
    rect(pixels, 63, 31, 2, 61, "steel")
    rect(pixels, 57, 89, 14, 8, "steel_dark")
    rect(pixels, 53, 96, 22, 4, "steel")
    diamond(pixels, 64, 27, 6, "gold")
    diamond(pixels, 64, 27, 3, "white")

    # Semaphore arms and color-coded flags.
    line(pixels, 64, 45, 32, 32, "steel")
    line(pixels, 64, 50, 96, 37, "steel")
    line(pixels, 64, 58, 36, 72, "steel")
    line(pixels, 64, 63, 95, 78, "steel")

    outline(pixels, 20, 22, 17, 14, "blue")
    rect(pixels, 24, 26, 9, 3, "cyan")
    outline(pixels, 95, 27, 18, 15, "green")
    rect(pixels, 99, 31, 10, 3, "white")
    outline(pixels, 25, 70, 18, 15, "purple")
    rect(pixels, 29, 74, 10, 3, "gold")
    outline(pixels, 91, 78, 18, 14, "gold")
    rect(pixels, 95, 82, 10, 3, "amber")

    # Signal traces from ticket to beacon.
    line(pixels, 64, 104, 64, 93, "gold")
    line(pixels, 64, 88, 64, 70, "gold")
    rect(pixels, 63, 72, 2, 2, "white")
    rect(pixels, 63, 61, 2, 2, "white")
    rect(pixels, 63, 50, 2, 2, "white")

    # Corner markers make the asset read as a review signal plate.
    for x, y, color in [(9, 9, "cyan"), (112, 10, "gold"), (10, 113, "green"), (112, 112, "purple")]:
        rect(pixels, x, y, 6, 6, "ink")
        rect(pixels, x + 2, y + 2, 2, 2, color)

    write_png(OUT, pixels)


if __name__ == "__main__":
    build()
    print(OUT)
