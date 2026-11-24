#!/usr/bin/env python3
"""Generate the milestone train depot pixel-art PNG for issue #80."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path(__file__).with_name("milestone-train-depot.png")

Palette = tuple[int, int, int, int]


def rgba(hex_color: str, alpha: int = 255) -> Palette:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


canvas = [[rgba("#10131f") for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_px(x: int, y: int, color: Palette) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = color


def rect(x: int, y: int, w: int, h: int, color: Palette) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(xx, yy, color)


def outline_rect(x: int, y: int, w: int, h: int, color: Palette) -> None:
    rect(x, y, w, 1, color)
    rect(x, y + h - 1, w, 1, color)
    rect(x, y, 1, h, color)
    rect(x + w - 1, y, 1, h, color)


def line(x0: int, y0: int, x1: int, y1: int, color: Palette) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        set_px(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle(cx: int, cy: int, radius: int, color: Palette) -> None:
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius**2:
                set_px(x, y, color)


def draw_tiny_check(x: int, y: int, color: Palette) -> None:
    set_px(x, y + 3, color)
    set_px(x + 1, y + 4, color)
    set_px(x + 2, y + 5, color)
    set_px(x + 3, y + 4, color)
    set_px(x + 4, y + 3, color)
    set_px(x + 5, y + 2, color)
    set_px(x + 6, y + 1, color)


bg_grid = rgba("#1b2133")
for pos in range(8, 128, 16):
    line(pos, 0, pos, 127, bg_grid)
    line(0, pos, 127, pos, bg_grid)

for x, y in [(14, 12), (40, 9), (77, 15), (112, 10), (102, 34), (25, 42)]:
    rect(x, y, 2, 2, rgba("#ffd166"))

rail = rgba("#5f6c8f")
line(4, 106, 124, 106, rail)
line(4, 112, 124, 112, rail)
for x in range(8, 123, 10):
    line(x, 104, x + 6, 114, rgba("#35405f"))

station = rgba("#2b3655")
station_trim = rgba("#6de4ff")
rect(8, 59, 34, 35, station)
outline_rect(8, 59, 34, 35, station_trim)
rect(13, 66, 24, 7, rgba("#f9c74f"))
rect(13, 78, 8, 11, rgba("#8ecae6"))
rect(25, 78, 10, 11, rgba("#8ecae6"))
line(8, 59, 25, 45, station_trim)
line(42, 59, 25, 45, station_trim)
rect(22, 42, 7, 7, rgba("#ef476f"))
draw_tiny_check(24, 43, rgba("#ffffff"))

train_dark = rgba("#2d314f")
train_mid = rgba("#4451a6")
train_light = rgba("#58d3ff")
rect(43, 79, 62, 22, train_dark)
rect(49, 69, 44, 16, train_mid)
outline_rect(43, 79, 62, 22, train_light)
outline_rect(49, 69, 44, 16, rgba("#ff9f1c"))
rect(53, 73, 8, 7, rgba("#c0fdff"))
rect(66, 73, 8, 7, rgba("#c0fdff"))
rect(79, 73, 8, 7, rgba("#c0fdff"))
rect(103, 86, 9, 8, rgba("#ef476f"))
line(105, 79, 117, 79, rgba("#ffd166"))
line(117, 79, 122, 86, rgba("#ffd166"))

for x in [53, 76, 99]:
    circle(x, 103, 5, rgba("#0b1020"))
    circle(x, 103, 3, rgba("#ffd166"))

ticket = rgba("#f4f1de")
for i, x in enumerate([50, 64, 78, 92]):
    rect(x, 88, 10, 7, ticket)
    rect(x + 1, 89, 8, 1, [rgba("#06d6a0"), rgba("#5e60ce"), rgba("#ef476f"), rgba("#ff9f1c")][i])

colors = [rgba("#06d6a0"), rgba("#5e60ce"), rgba("#ef476f"), rgba("#ff9f1c")]
labels = [(16, 21), (43, 31), (72, 25), (100, 40)]
for idx, (x, y) in enumerate(labels):
    rect(x, y, 17, 10, rgba("#252b44"))
    outline_rect(x, y, 17, 10, colors[idx])
    circle(x + 4, y + 5, 2, colors[idx])
    line(x + 8, y + 4, x + 13, y + 4, rgba("#d9f0ff"))
    line(x + 8, y + 7, x + 13, y + 7, rgba("#d9f0ff"))

line(33, 26, 43, 35, rgba("#06d6a0"))
line(60, 36, 72, 30, rgba("#5e60ce"))
line(89, 30, 100, 44, rgba("#ef476f"))
line(108, 50, 101, 69, rgba("#ff9f1c"))

for cx, cy, color in [(26, 49, rgba("#06d6a0")), (58, 54, rgba("#5e60ce")), (88, 49, rgba("#ef476f")), (112, 64, rgba("#ff9f1c"))]:
    circle(cx, cy, 3, color)
    circle(cx, cy, 1, rgba("#ffffff"))

rect(12, 118, 104, 5, rgba("#1f2a44"))
rect(16, 119, 18, 2, rgba("#06d6a0"))
rect(40, 119, 18, 2, rgba("#5e60ce"))
rect(64, 119, 18, 2, rgba("#ef476f"))
rect(88, 119, 18, 2, rgba("#ff9f1c"))

for x in range(0, WIDTH, 2):
    set_px(x, 0, rgba("#0a0d17"))
    set_px(x, HEIGHT - 1, rgba("#0a0d17"))
for y in range(0, HEIGHT, 2):
    set_px(0, y, rgba("#0a0d17"))
    set_px(WIDTH - 1, y, rgba("#0a0d17"))


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


raw = b"".join(b"\x00" + bytes(channel for px in row for channel in px) for row in canvas)
png = (
    b"\x89PNG\r\n\x1a\n"
    + png_chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    + png_chunk(b"IDAT", zlib.compress(raw, 9))
    + png_chunk(b"IEND", b"")
)

OUT.write_bytes(png)
print(f"wrote {OUT} ({WIDTH}x{HEIGHT})")
