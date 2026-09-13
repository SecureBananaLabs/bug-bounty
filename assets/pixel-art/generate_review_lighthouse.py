#!/usr/bin/env python3
"""Generate an original 128x128 pixel-art PNG for bounty issue #80."""

from __future__ import annotations

import struct
import sys
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUTPUT = Path(__file__).with_name("review-lighthouse.png")

COLORS = {
    "sky": (13, 18, 32),
    "grid": (25, 36, 58),
    "sea": (17, 52, 71),
    "foam": (87, 221, 228),
    "rock": (45, 55, 70),
    "shadow": (8, 12, 22),
    "tower": (52, 70, 95),
    "tower_light": (79, 102, 139),
    "edge": (141, 167, 204),
    "cyan": (76, 224, 255),
    "gold": (250, 196, 73),
    "amber": (219, 137, 50),
    "green": (103, 213, 124),
    "rose": (235, 93, 113),
    "violet": (151, 130, 255),
    "white": (237, 245, 255),
}


class Canvas:
    def __init__(self, width: int, height: int, fill: tuple[int, int, int]) -> None:
        self.width = width
        self.height = height
        self.pixels = [[fill for _ in range(width)] for _ in range(height)]

    def point(self, x: int, y: int, color: tuple[int, int, int]) -> None:
        if 0 <= x < self.width and 0 <= y < self.height:
            self.pixels[y][x] = color

    def rect(self, x: int, y: int, width: int, height: int, color: tuple[int, int, int]) -> None:
        for yy in range(y, y + height):
            for xx in range(x, x + width):
                self.point(xx, yy, color)

    def line(self, x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int]) -> None:
        dx = abs(x1 - x0)
        dy = -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        x, y = x0, y0
        while True:
            self.point(x, y, color)
            if x == x1 and y == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x += sx
            if e2 <= dx:
                err += dx
                y += sy

    def outline(self, x: int, y: int, width: int, height: int, color: tuple[int, int, int]) -> None:
        self.line(x, y, x + width - 1, y, color)
        self.line(x, y + height - 1, x + width - 1, y + height - 1, color)
        self.line(x, y, x, y + height - 1, color)
        self.line(x + width - 1, y, x + width - 1, y + height - 1, color)

    def triangle(self, points: list[tuple[int, int]], color: tuple[int, int, int]) -> None:
        min_y = min(y for _, y in points)
        max_y = max(y for _, y in points)
        for y in range(min_y, max_y + 1):
            xs: list[int] = []
            for (x1, y1), (x2, y2) in zip(points, points[1:] + points[:1]):
                if y1 == y2:
                    continue
                if min(y1, y2) <= y < max(y1, y2):
                    xs.append(round(x1 + (y - y1) * (x2 - x1) / (y2 - y1)))
            if len(xs) >= 2:
                for x in range(min(xs), max(xs) + 1):
                    self.point(x, y, color)


def draw_background(canvas: Canvas) -> None:
    for x in range(0, WIDTH, 9):
        canvas.line(x, 0, x, 85, COLORS["grid"])
    for y in range(0, 86, 9):
        canvas.line(0, y, WIDTH - 1, y, COLORS["grid"])
    for x, y in [(8, 9), (119, 10), (19, 23), (104, 28), (111, 58), (32, 6)]:
        canvas.point(x, y, COLORS["cyan"])
        canvas.point(x + 1, y, COLORS["white"])
    canvas.rect(0, 88, WIDTH, 40, COLORS["sea"])
    for y in (94, 105, 116):
        for x in range((y // 2) % 8, WIDTH, 16):
            canvas.rect(x, y, 8, 2, COLORS["foam"])


def draw_lighthouse(canvas: Canvas) -> None:
    canvas.triangle([(38, 116), (58, 82), (78, 116)], COLORS["rock"])
    canvas.triangle([(49, 95), (64, 25), (79, 95)], COLORS["tower"])
    canvas.triangle([(54, 95), (64, 28), (74, 95)], COLORS["tower_light"])
    canvas.line(49, 95, 64, 25, COLORS["edge"])
    canvas.line(79, 95, 64, 25, COLORS["edge"])
    for y in (47, 61, 75):
        canvas.rect(56, y, 16, 3, COLORS["shadow"])
        canvas.rect(57, y, 14, 2, COLORS["edge"])
    canvas.rect(54, 23, 20, 9, COLORS["shadow"])
    canvas.rect(52, 21, 20, 9, COLORS["gold"])
    canvas.outline(52, 21, 20, 9, COLORS["white"])
    canvas.rect(58, 24, 8, 3, COLORS["amber"])
    canvas.rect(60, 15, 8, 6, COLORS["tower"])
    canvas.outline(60, 15, 8, 6, COLORS["edge"])


def draw_beams(canvas: Canvas) -> None:
    source = (62, 25)
    endpoints = [
        (17, 39, COLORS["green"]),
        (111, 39, COLORS["rose"]),
        (21, 74, COLORS["violet"]),
        (107, 74, COLORS["cyan"]),
    ]
    for x, y, color in endpoints:
        canvas.line(source[0], source[1], x, y, color)
        canvas.line(source[0], source[1] + 1, x, y + 1, COLORS["shadow"])
        canvas.rect(x - 7, y - 5, 14, 10, COLORS["shadow"])
        canvas.rect(x - 8, y - 6, 14, 10, color)
        canvas.outline(x - 8, y - 6, 14, 10, COLORS["white"])
        canvas.rect(x - 4, y - 2, 8, 2, COLORS["white"])


def render() -> Canvas:
    canvas = Canvas(WIDTH, HEIGHT, COLORS["sky"])
    draw_background(canvas)
    draw_beams(canvas)
    draw_lighthouse(canvas)
    canvas.rect(46, 118, 37, 4, COLORS["rock"])
    canvas.rect(50, 122, 29, 3, COLORS["shadow"])
    return canvas


def chunk(name: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)


def write_png(canvas: Canvas, output: Path) -> None:
    rows = [b"\x00" + b"".join(bytes(pixel) for pixel in row) for row in canvas.pixels]
    header = struct.pack(">IIBBBBB", canvas.width, canvas.height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", header)
    png += chunk(b"IDAT", zlib.compress(b"".join(rows), 9))
    png += chunk(b"IEND", b"")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(png)


def main() -> int:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else OUTPUT
    write_png(render(), output)
    print(f"wrote {output} ({WIDTH}x{HEIGHT})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
