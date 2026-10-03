#!/usr/bin/env python3
"""Generate the audit-vault pixel art PNG for bounty #80."""

import struct
import zlib
from pathlib import Path

SCALE = 4
SIZE = 40

BG = (8, 11, 24)
GRID = (19, 31, 52)
BLUE = (39, 213, 255)
BLUE_DARK = (12, 74, 113)
GREEN = (92, 255, 169)
YELLOW = (255, 214, 95)
ORANGE = (255, 135, 72)
PURPLE = (178, 117, 255)
WHITE = (220, 244, 255)
BLACK = (3, 5, 12)


def put(canvas, x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        canvas[y][x] = color


def rect(canvas, x0, y0, x1, y1, color):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(canvas, x, y, color)


def line(canvas, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(canvas, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def draw_digit(canvas, x, y, digit, color):
    segments = {
        "0": "abcfed",
        "1": "bc",
        "2": "abged",
        "3": "abgcd",
        "4": "fgbc",
        "5": "afgcd",
        "6": "afgecd",
        "7": "abc",
        "8": "abcdefg",
        "9": "abfgcd",
    }[digit]
    if "a" in segments:
        rect(canvas, x + 1, y, x + 3, y, color)
    if "b" in segments:
        rect(canvas, x + 4, y + 1, x + 4, y + 2, color)
    if "c" in segments:
        rect(canvas, x + 4, y + 4, x + 4, y + 5, color)
    if "d" in segments:
        rect(canvas, x + 1, y + 6, x + 3, y + 6, color)
    if "e" in segments:
        rect(canvas, x, y + 4, x, y + 5, color)
    if "f" in segments:
        rect(canvas, x, y + 1, x, y + 2, color)
    if "g" in segments:
        rect(canvas, x + 1, y + 3, x + 3, y + 3, color)


def build_canvas():
    canvas = [[BG for _ in range(SIZE)] for _ in range(SIZE)]

    for i in range(0, SIZE, 5):
        for p in range(SIZE):
            put(canvas, i, p, GRID)
            put(canvas, p, i, GRID)

    rect(canvas, 3, 4, 36, 35, BLUE_DARK)
    rect(canvas, 4, 5, 35, 34, BLACK)
    rect(canvas, 5, 6, 34, 33, (8, 22, 35))

    rect(canvas, 7, 8, 32, 11, (10, 37, 54))
    rect(canvas, 8, 9, 20, 9, GREEN)
    rect(canvas, 8, 10, 28, 10, BLUE)
    rect(canvas, 30, 9, 31, 10, ORANGE)

    for x in range(11, 29):
        put(canvas, x, 15, BLUE)
        put(canvas, x, 28, BLUE)
    for y in range(16, 28):
        put(canvas, 10, y, BLUE)
        put(canvas, 29, y, BLUE)

    rect(canvas, 14, 16, 25, 27, (13, 39, 51))
    rect(canvas, 15, 17, 24, 26, (7, 15, 24))
    rect(canvas, 17, 14, 22, 17, YELLOW)
    rect(canvas, 18, 13, 21, 13, YELLOW)
    rect(canvas, 18, 14, 18, 16, BLACK)
    rect(canvas, 21, 14, 21, 16, BLACK)
    rect(canvas, 18, 20, 21, 23, GREEN)
    put(canvas, 19, 19, WHITE)
    put(canvas, 20, 19, WHITE)
    rect(canvas, 19, 23, 20, 25, GREEN)

    line(canvas, 12, 29, 20, 25, PURPLE)
    line(canvas, 20, 25, 28, 29, PURPLE)
    line(canvas, 12, 29, 28, 29, PURPLE)

    rect(canvas, 7, 14, 8, 15, ORANGE)
    rect(canvas, 31, 14, 32, 15, ORANGE)
    rect(canvas, 7, 29, 8, 30, GREEN)
    rect(canvas, 31, 29, 32, 30, GREEN)

    draw_digit(canvas, 7, 23, "4", YELLOW)
    draw_digit(canvas, 28, 23, "2", YELLOW)
    rect(canvas, 6, 32, 15, 32, GREEN)
    rect(canvas, 17, 32, 24, 32, BLUE)
    rect(canvas, 26, 32, 33, 32, ORANGE)

    for y in range(6, 34, 3):
        put(canvas, 34, y, GREEN if y % 2 else BLUE)
        put(canvas, 5, y + 1, PURPLE if y % 2 else BLUE)

    return canvas


def scale_canvas(canvas):
    rows = []
    for row in canvas:
        expanded = []
        for pixel in row:
            expanded.extend([pixel] * SCALE)
        for _ in range(SCALE):
            rows.append(expanded[:])
    return rows


def png_chunk(kind, data):
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path, rows):
    height = len(rows)
    width = len(rows[0])
    raw = b"".join(b"\x00" + bytes(channel for pixel in row for channel in pixel) for row in rows)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    payload = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", zlib.compress(raw, level=9))
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(payload)


def main():
    out = Path(__file__).with_name("audit-vault.png")
    write_png(out, scale_canvas(build_canvas()))
    print(f"wrote {out} ({SIZE * SCALE}x{SIZE * SCALE})")


if __name__ == "__main__":
    main()
