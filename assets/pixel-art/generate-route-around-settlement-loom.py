#!/usr/bin/env python3
"""Generate route-around-settlement-loom.png deterministically.

The image is original pixel art for SecureBananaLabs/bug-bounty issue #80.
It uses only the Python standard library so reviewers can reproduce the PNG
without installing drawing dependencies.
"""
from __future__ import annotations

import hashlib
import pathlib
import struct
import zlib

WIDTH = 128
HEIGHT = 128
OUT = pathlib.Path(__file__).with_name("route-around-settlement-loom.png")

Color = tuple[int, int, int]
CANVAS: list[list[Color]] = [[(10, 13, 26) for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_px(x: int, y: int, color: Color) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        CANVAS[y][x] = color


def rect(x: int, y: int, w: int, h: int, color: Color) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(xx, yy, color)


def outline(x: int, y: int, w: int, h: int, color: Color) -> None:
    rect(x, y, w, 1, color)
    rect(x, y + h - 1, w, 1, color)
    rect(x, y, 1, h, color)
    rect(x + w - 1, y, 1, h, color)


def line_h(x: int, y: int, length: int, color: Color) -> None:
    rect(x, y, length, 1, color)


def line_v(x: int, y: int, length: int, color: Color) -> None:
    rect(x, y, 1, length, color)


def diamond(cx: int, cy: int, radius: int, color: Color) -> None:
    for dy in range(-radius, radius + 1):
        span = radius - abs(dy)
        for dx in range(-span, span + 1):
            set_px(cx + dx, cy + dy, color)


def circle(cx: int, cy: int, r: int, color: Color) -> None:
    rr = r * r
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= rr:
                set_px(cx + dx, cy + dy, color)


# Subtle circuit-grid background.
for x in range(0, WIDTH, 8):
    for y in range(HEIGHT):
        if y % 16 in (0, 1):
            set_px(x, y, (20, 31, 55))
for y in range(0, HEIGHT, 8):
    for x in range(WIDTH):
        if x % 16 in (0, 1):
            set_px(x, y, (18, 28, 48))

# Distant packet stars and checksum sparks.
for x, y, c in [
    (14, 18, (91, 210, 255)), (107, 16, (255, 213, 91)), (116, 71, (87, 244, 174)),
    (20, 101, (166, 126, 255)), (96, 111, (91, 210, 255)), (36, 30, (255, 119, 168)),
    (73, 22, (255, 213, 91)), (8, 62, (87, 244, 174)), (121, 39, (166, 126, 255)),
]:
    rect(x, y, 2, 2, c)

# Platform floor and outer observatory frame.
rect(18, 100, 92, 5, (34, 45, 78))
rect(24, 105, 80, 6, (21, 27, 48))
outline(21, 35, 86, 66, (91, 210, 255))
outline(24, 38, 80, 60, (28, 50, 88))

# Central settlement loom: payout rails, audit shuttle, and review light stack.
rect(56, 43, 16, 48, (32, 39, 67))
outline(54, 41, 20, 52, (255, 213, 91))
for x in (39, 48, 81, 90):
    line_v(x, 44, 45, (42, 92, 132))
    rect(x - 1, 89, 3, 3, (91, 210, 255))
for y in (50, 62, 74, 86):
    line_h(37, y, 54, (24, 72, 103))

# Woven route-around paths.
for step, color in enumerate([(87, 244, 174), (255, 119, 168), (166, 126, 255), (91, 210, 255)]):
    y = 48 + step * 11
    for x in range(34, 95):
        if (x + step * 5) % 10 < 5:
            set_px(x, y + (x // 7 + step) % 3, color)

# Audit shuttle in the middle.
rect(48, 59, 32, 18, (15, 20, 37))
outline(48, 59, 32, 18, (87, 244, 174))
rect(53, 64, 10, 5, (91, 210, 255))
rect(66, 64, 10, 5, (255, 213, 91))
line_h(54, 72, 21, (87, 244, 174))

# Review lanterns and claim diamonds.
for x, c in [(33, (255, 119, 168)), (64, (255, 213, 91)), (97, (87, 244, 174))]:
    circle(x, 31, 5, c)
    rect(x - 2, 36, 4, 7, (46, 57, 92))
    line_v(x, 23, 8, (32, 61, 91))
for x, y, c in [(33, 94, (87, 244, 174)), (64, 94, (255, 213, 91)), (97, 94, (91, 210, 255))]:
    diamond(x, y, 4, c)
    set_px(x, y, (10, 13, 26))

# Small wing-like side braces, evoking movement without logos or trademarks.
for offset in range(0, 18, 3):
    line_h(16 + offset, 52 + offset // 2, 16 - offset // 2, (91, 210, 255))
    line_h(96, 52 + offset // 2, 16 - offset // 2, (91, 210, 255))
for offset in range(0, 15, 3):
    line_h(20 + offset, 82 - offset // 2, 13 - offset // 2, (166, 126, 255))
    line_h(95, 82 - offset // 2, 13 - offset // 2, (166, 126, 255))

# Bounty settlement tick at the top of the loom.
line_h(58, 53, 5, (87, 244, 174))
line_h(63, 54, 3, (87, 244, 174))
line_h(66, 52, 8, (87, 244, 174))
line_h(69, 51, 5, (87, 244, 174))

# PNG writer.
def png_bytes() -> bytes:
    raw = bytearray()
    for row in CANVAS:
        raw.append(0)  # no filter
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    return b"\x89PNG\r\n\x1a\n" + chunk(
        b"IHDR",
        struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0),
    ) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")


def main() -> None:
    data = png_bytes()
    OUT.write_bytes(data)
    print(f"wrote={OUT}")
    print(f"size={WIDTH}x{HEIGHT}")
    print(f"sha256={hashlib.sha256(data).hexdigest()}")


if __name__ == "__main__":
    main()
