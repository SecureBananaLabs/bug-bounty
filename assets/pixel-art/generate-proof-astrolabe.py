#!/usr/bin/env python3
"""Generate the proof astrolabe pixel-art asset for issue #80."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128

INK = (12, 14, 26)
NIGHT = (20, 24, 43)
DEEP = (29, 35, 59)
BRASS = (221, 178, 84)
GOLD = (246, 213, 121)
TEAL = (76, 201, 187)
CYAN = (120, 230, 224)
GREEN = (88, 220, 143)
ROSE = (231, 104, 128)
VIOLET = (132, 111, 232)
CREAM = (245, 237, 195)
SHADOW = (7, 9, 18)


def put(pixels: list[list[tuple[int, int, int]]], x: int, y: int, color: tuple[int, int, int]) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        pixels[y][x] = color


def rect(
    pixels: list[list[tuple[int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: tuple[int, int, int],
) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(pixels, xx, yy, color)


def line(
    pixels: list[list[tuple[int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: tuple[int, int, int],
) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(pixels, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle(
    pixels: list[list[tuple[int, int, int]]],
    cx: int,
    cy: int,
    radius: int,
    color: tuple[int, int, int],
    thickness: int = 1,
) -> None:
    outer = radius * radius
    inner = max(0, radius - thickness) ** 2
    for y in range(cy - radius - 1, cy + radius + 2):
        for x in range(cx - radius - 1, cx + radius + 2):
            dist = (x - cx) * (x - cx) + (y - cy) * (y - cy)
            if inner <= dist <= outer:
                put(pixels, x, y, color)


def diamond(
    pixels: list[list[tuple[int, int, int]]],
    cx: int,
    cy: int,
    radius: int,
    color: tuple[int, int, int],
) -> None:
    for y in range(cy - radius, cy + radius + 1):
        span = radius - abs(y - cy)
        for x in range(cx - span, cx + span + 1):
            put(pixels, x, y, color)


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path: Path, pixels: list[list[tuple[int, int, int]]]) -> None:
    rows = []
    for row in pixels:
        scanline = bytearray([0])
        for red, green, blue in row:
            scanline.extend((red, green, blue))
        rows.append(bytes(scanline))

    ihdr = struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)
    payload = b"".join(rows)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", zlib.compress(payload, 9))
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def main() -> None:
    pixels: list[list[tuple[int, int, int]]] = [[NIGHT for _ in range(WIDTH)] for _ in range(HEIGHT)]

    for y in range(HEIGHT):
        for x in range(WIDTH):
            if (x * 5 + y * 3) % 29 == 0:
                put(pixels, x, y, DEEP)

    for x, y, color in [
        (13, 18, CREAM),
        (24, 31, TEAL),
        (41, 14, GOLD),
        (93, 18, CREAM),
        (111, 35, CYAN),
        (18, 70, VIOLET),
        (104, 72, GOLD),
        (116, 86, TEAL),
    ]:
        rect(pixels, x, y, 2, 2, color)
        put(pixels, x + 2, y + 1, color)

    rect(pixels, 6, 6, 116, 116, SHADOW)
    rect(pixels, 8, 8, 112, 112, INK)
    rect(pixels, 10, 10, 108, 108, NIGHT)
    for x in range(14, 115, 8):
        put(pixels, x, 11, BRASS)
        put(pixels, x, 116, BRASS)
    for y in range(14, 115, 8):
        put(pixels, 11, y, TEAL)
        put(pixels, 116, y, TEAL)

    cx, cy = 64, 55
    circle(pixels, cx, cy, 40, BRASS, 2)
    circle(pixels, cx, cy, 34, GOLD, 1)
    circle(pixels, cx, cy, 24, TEAL, 1)
    circle(pixels, cx, cy, 14, VIOLET, 1)
    rect(pixels, cx - 2, cy - 2, 5, 5, CREAM)

    for angle in range(0, 360, 15):
        radians = math.radians(angle)
        x0 = cx + int(math.cos(radians) * 35)
        y0 = cy + int(math.sin(radians) * 35)
        x1 = cx + int(math.cos(radians) * 39)
        y1 = cy + int(math.sin(radians) * 39)
        line(pixels, x0, y0, x1, y1, BRASS if angle % 45 else GOLD)

    for angle in (0, 45, 90, 135):
        radians = math.radians(angle)
        x = cx + int(math.cos(radians) * 33)
        y = cy + int(math.sin(radians) * 33)
        line(pixels, cx, cy, x, y, DEEP)

    line(pixels, cx, cy, 91, 28, CYAN)
    line(pixels, cx + 1, cy, 92, 28, TEAL)
    diamond(pixels, 93, 26, 4, GOLD)
    rect(pixels, 88, 31, 3, 3, ROSE)

    constellation = [(35, 43), (45, 34), (55, 39), (49, 51), (59, 59), (77, 39), (86, 48), (80, 62)]
    for start, end in zip(constellation, constellation[1:]):
        line(pixels, start[0], start[1], end[0], end[1], DEEP)
    for index, (x, y) in enumerate(constellation):
        rect(pixels, x - 1, y - 1, 3, 3, CYAN if index % 2 else CREAM)

    rect(pixels, 24, 93, 80, 17, SHADOW)
    rect(pixels, 26, 91, 76, 17, DEEP)
    rect(pixels, 30, 95, 14, 8, TEAL)
    rect(pixels, 48, 95, 14, 8, GOLD)
    rect(pixels, 66, 95, 14, 8, VIOLET)
    rect(pixels, 84, 95, 14, 8, GREEN)
    for x in (34, 52, 70, 88):
        rect(pixels, x, 97, 4, 4, INK)
        rect(pixels, x + 5, 97, 2, 4, CREAM)
    rect(pixels, 31, 106, 66, 2, BRASS)
    rect(pixels, 37, 109, 54, 2, GOLD)

    diamond(pixels, 64, 82, 6, GREEN)
    rect(pixels, 62, 80, 5, 5, CYAN)
    line(pixels, 58, 87, 70, 87, GOLD)
    line(pixels, 60, 90, 68, 90, BRASS)

    for x, y in [(17, 104), (108, 103), (19, 25), (108, 23)]:
        rect(pixels, x, y, 4, 4, GOLD)
        rect(pixels, x + 1, y + 1, 2, 2, GREEN)

    output = Path(__file__).with_name("proof-astrolabe.png")
    write_png(output, pixels)
    print(f"wrote {output} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
