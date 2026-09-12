#!/usr/bin/env python3
"""Generate the MojoBeep Signal Synth pixel-art asset for issue #80."""

from __future__ import annotations

import hashlib
import os
import struct
import zlib


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, "assets", "pixel-art", "mojobeep-signal-synth.png")
WIDTH = 128
HEIGHT = 128


Palette = tuple[int, int, int, int]


def rgba(hex_color: str) -> Palette:
    value = hex_color.lstrip("#")
    return (
        int(value[0:2], 16),
        int(value[2:4], 16),
        int(value[4:6], 16),
        255,
    )


BG = rgba("#10131b")
GRID = rgba("#1d2634")
GRID_ALT = rgba("#263246")
SHADOW = rgba("#070a10")
PANEL = rgba("#273244")
PANEL_LIGHT = rgba("#39485d")
PANEL_EDGE = rgba("#151b26")
CYAN = rgba("#34d3e6")
CYAN_DARK = rgba("#147887")
MINT = rgba("#7ee787")
MINT_DARK = rgba("#2f8b57")
GOLD = rgba("#f6c65b")
GOLD_DARK = rgba("#a86f2a")
CORAL = rgba("#ff6b6b")
MAGENTA = rgba("#b469ff")
INK = rgba("#0b0f17")
WHITE = rgba("#e8f0ff")


def put(pixels: list[list[Palette]], x: int, y: int, color: Palette) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        pixels[y][x] = color


def rect(
    pixels: list[list[Palette]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: Palette,
) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(pixels, xx, yy, color)


def line(
    pixels: list[list[Palette]],
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    color: Palette,
) -> None:
    dx = abs(x2 - x1)
    dy = -abs(y2 - y1)
    sx = 1 if x1 < x2 else -1
    sy = 1 if y1 < y2 else -1
    err = dx + dy
    x = x1
    y = y1
    while True:
        put(pixels, x, y, color)
        if x == x2 and y == y2:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def draw_mojo(pixels: list[list[Palette]], x: int, y: int) -> None:
    letters = {
        "M": ["101", "111", "111", "101", "101"],
        "O": ["111", "101", "101", "101", "111"],
        "J": ["111", "010", "010", "110", "100"],
    }
    cursor = x
    for char in "MOJO":
        glyph = letters[char]
        for row, bits in enumerate(glyph):
            for col, bit in enumerate(bits):
                if bit == "1":
                    rect(pixels, cursor + col * 2, y + row * 2, 2, 2, WHITE)
        cursor += 8


def build_pixels() -> list[list[Palette]]:
    pixels = [[BG for _ in range(WIDTH)] for _ in range(HEIGHT)]

    for y in range(0, HEIGHT, 8):
        for x in range(WIDTH):
            put(pixels, x, y, GRID)
    for x in range(0, WIDTH, 8):
        for y in range(HEIGHT):
            put(pixels, x, y, GRID)
    for y in range(4, HEIGHT, 16):
        for x in range(4, WIDTH, 16):
            rect(pixels, x, y, 2, 2, GRID_ALT)

    rect(pixels, 12, 96, 104, 12, SHADOW)
    rect(pixels, 18, 58, 92, 44, PANEL_EDGE)
    rect(pixels, 20, 56, 88, 44, PANEL)
    rect(pixels, 24, 60, 80, 4, PANEL_LIGHT)
    rect(pixels, 24, 92, 80, 4, PANEL_EDGE)

    rect(pixels, 30, 68, 32, 14, INK)
    rect(pixels, 32, 70, 28, 10, CYAN_DARK)
    rect(pixels, 34, 72, 4, 6, CYAN)
    rect(pixels, 40, 74, 4, 4, CYAN)
    rect(pixels, 46, 71, 4, 7, CYAN)
    rect(pixels, 52, 75, 4, 3, CYAN)

    for idx, x in enumerate((70, 80, 90)):
        rect(pixels, x, 68, 8, 8, SHADOW)
        rect(pixels, x + 1, 67, 6, 6, (GOLD, MINT, CORAL)[idx])
        rect(pixels, x + 3, 69, 2, 2, WHITE)

    rect(pixels, 28, 86, 68, 4, SHADOW)
    for x, height, color in (
        (30, 5, CYAN),
        (38, 10, MINT),
        (46, 7, GOLD),
        (54, 12, MAGENTA),
        (62, 4, CYAN),
        (70, 9, CORAL),
        (78, 6, MINT),
        (86, 11, GOLD),
    ):
        rect(pixels, x, 86 - height, 5, height, color)

    rect(pixels, 14, 28, 24, 18, SHADOW)
    rect(pixels, 16, 26, 22, 18, PANEL)
    rect(pixels, 18, 28, 18, 10, WHITE)
    rect(pixels, 20, 30, 14, 6, rgba("#cfd8e8"))
    rect(pixels, 22, 39, 12, 3, MINT)

    line(pixels, 44, 50, 58, 38, CYAN)
    line(pixels, 58, 38, 78, 38, CYAN)
    line(pixels, 78, 38, 96, 25, CYAN)
    rect(pixels, 42, 48, 5, 5, MINT)
    rect(pixels, 56, 36, 5, 5, GOLD)
    rect(pixels, 76, 36, 5, 5, CORAL)
    rect(pixels, 94, 23, 5, 5, MINT)

    rect(pixels, 88, 14, 20, 12, SHADOW)
    rect(pixels, 90, 12, 18, 12, PANEL_LIGHT)
    rect(pixels, 94, 15, 10, 6, INK)
    rect(pixels, 96, 16, 6, 4, MINT)

    for radius, color in ((11, CYAN_DARK), (17, GRID_ALT), (23, GRID)):
        for x in range(90 - radius, 90 + radius + 1):
            y_span = int((radius * radius - (x - 90) * (x - 90)) ** 0.5)
            put(pixels, x, 12 - y_span, color)
            put(pixels, x, 12 + y_span, color)
        for y in range(12 - radius, 12 + radius + 1):
            x_span = int((radius * radius - (y - 12) * (y - 12)) ** 0.5)
            put(pixels, 90 - x_span, y, color)
            put(pixels, 90 + x_span, y, color)

    draw_mojo(pixels, 48, 108)
    rect(pixels, 84, 108, 4, 4, CYAN)
    rect(pixels, 90, 110, 4, 4, CYAN)
    rect(pixels, 96, 106, 4, 4, CYAN)
    rect(pixels, 102, 110, 4, 4, CYAN)

    for x in range(WIDTH):
        put(pixels, x, 0, SHADOW)
        put(pixels, x, HEIGHT - 1, SHADOW)
    for y in range(HEIGHT):
        put(pixels, 0, y, SHADOW)
        put(pixels, WIDTH - 1, y, SHADOW)

    return pixels


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path: str, pixels: list[list[Palette]]) -> str:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    raw_rows = []
    for row in pixels:
        raw_rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))
    raw = b"".join(raw_rows)
    payload = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(raw, 9))
        + png_chunk(b"IEND", b"")
    )
    with open(path, "wb") as handle:
        handle.write(payload)
    return hashlib.sha256(payload).hexdigest()


def main() -> None:
    digest = write_png(OUTPUT, build_pixels())
    print(f"Wrote {OUTPUT}")
    print(f"sha256={digest}")


if __name__ == "__main__":
    main()
