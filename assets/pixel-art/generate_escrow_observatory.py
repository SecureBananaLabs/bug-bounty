#!/usr/bin/env python3
"""Create an original 128x128 pixel-art PNG for bounty issue #80."""

from __future__ import annotations

import math
import struct
import sys
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUTPUT = Path(__file__).with_name("escrow-observatory.png")

PALETTE = {
    "night": (12, 16, 30),
    "upper": (18, 27, 49),
    "grid": (32, 45, 71),
    "shadow": (7, 10, 18),
    "hill": (26, 63, 61),
    "hill_dark": (14, 36, 39),
    "stone": (60, 75, 91),
    "stone_hi": (100, 122, 146),
    "steel": (42, 53, 75),
    "glass": (65, 209, 226),
    "cyan": (86, 232, 248),
    "gold": (244, 189, 70),
    "amber": (207, 123, 51),
    "coral": (232, 82, 103),
    "green": (108, 218, 132),
    "violet": (141, 124, 248),
    "paper": (223, 232, 222),
    "white": (241, 248, 255),
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
            e2 = err * 2
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

    def filled_circle(self, cx: int, cy: int, radius: int, color: tuple[int, int, int]) -> None:
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius:
                    self.point(x, y, color)

    def arc_dome(self, cx: int, cy: int, radius: int, color: tuple[int, int, int]) -> None:
        for y in range(cy - radius, cy + 1):
            for x in range(cx - radius, cx + radius + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius:
                    self.point(x, y, color)

    def triangle(self, pts: list[tuple[int, int]], color: tuple[int, int, int]) -> None:
        min_y = min(y for _, y in pts)
        max_y = max(y for _, y in pts)
        for y in range(min_y, max_y + 1):
            xs: list[int] = []
            for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
                if y1 == y2:
                    continue
                if min(y1, y2) <= y < max(y1, y2):
                    xs.append(round(x1 + (y - y1) * (x2 - x1) / (y2 - y1)))
            if len(xs) >= 2:
                for x in range(min(xs), max(xs) + 1):
                    self.point(x, y, color)


def draw_background(canvas: Canvas) -> None:
    for y in range(HEIGHT):
        band = min(1, y / 84)
        base = tuple(round(PALETTE["night"][i] * (1 - band) + PALETTE["upper"][i] * band) for i in range(3))
        canvas.rect(0, y, WIDTH, 1, base)

    for x in range(0, WIDTH, 16):
        canvas.line(x, 0, x, 82, PALETTE["grid"])
    for y in range(10, 82, 16):
        canvas.line(0, y, WIDTH - 1, y, PALETTE["grid"])

    for x, y, color in [
        (7, 9, "cyan"),
        (21, 25, "white"),
        (37, 12, "gold"),
        (88, 8, "violet"),
        (112, 29, "green"),
        (101, 63, "coral"),
        (15, 58, "white"),
    ]:
        canvas.rect(x, y, 2, 2, PALETTE[color])
        canvas.point(x + 2, y + 1, PALETTE["shadow"])


def draw_coin(canvas: Canvas) -> None:
    canvas.filled_circle(101, 25, 14, PALETTE["amber"])
    canvas.filled_circle(99, 23, 14, PALETTE["gold"])
    canvas.filled_circle(99, 23, 9, PALETTE["amber"])
    canvas.filled_circle(99, 23, 6, PALETTE["gold"])
    canvas.rect(96, 17, 6, 12, PALETTE["shadow"])
    canvas.rect(94, 22, 10, 4, PALETTE["shadow"])
    canvas.rect(97, 16, 4, 12, PALETTE["white"])
    canvas.rect(95, 21, 8, 3, PALETTE["white"])
    canvas.rect(97, 31, 5, 2, PALETTE["white"])


def draw_observatory(canvas: Canvas) -> None:
    canvas.triangle([(0, 127), (37, 94), (77, 127)], PALETTE["hill_dark"])
    canvas.triangle([(32, 127), (83, 90), (127, 127)], PALETTE["hill"])
    for x in range(0, WIDTH, 14):
        canvas.rect(x, 119 + (x // 14) % 3, 10, 2, PALETTE["green"])

    canvas.rect(39, 81, 47, 35, PALETTE["stone"])
    canvas.rect(43, 86, 39, 26, PALETTE["stone_hi"])
    canvas.outline(39, 81, 47, 35, PALETTE["shadow"])
    canvas.rect(50, 97, 10, 16, PALETTE["shadow"])
    canvas.rect(53, 99, 4, 10, PALETTE["gold"])
    canvas.rect(64, 95, 14, 9, PALETTE["glass"])
    canvas.outline(64, 95, 14, 9, PALETTE["shadow"])

    canvas.arc_dome(62, 82, 27, PALETTE["steel"])
    canvas.arc_dome(60, 79, 22, PALETTE["stone_hi"])
    canvas.rect(35, 81, 55, 5, PALETTE["shadow"])
    canvas.rect(39, 77, 46, 7, PALETTE["steel"])
    canvas.outline(39, 77, 46, 7, PALETTE["white"])
    for x in range(43, 82, 9):
        canvas.line(x, 78, 63, 57, PALETTE["steel"])

    canvas.rect(59, 54, 10, 25, PALETTE["shadow"])
    canvas.rect(61, 52, 7, 26, PALETTE["glass"])
    canvas.line(66, 57, 95, 34, PALETTE["shadow"])
    canvas.line(65, 55, 94, 32, PALETTE["glass"])
    canvas.line(66, 56, 96, 33, PALETTE["cyan"])
    canvas.rect(90, 27, 11, 8, PALETTE["shadow"])
    canvas.rect(88, 25, 12, 8, PALETTE["glass"])
    canvas.outline(88, 25, 12, 8, PALETTE["white"])


def draw_beams_and_panels(canvas: Canvas) -> None:
    for offset, color in [(0, "cyan"), (3, "gold"), (-3, "violet")]:
        canvas.line(93, 30 + offset, 101, 25, PALETTE[color])
        canvas.line(67, 56 + offset, 93, 30 + offset, PALETTE[color])

    canvas.rect(14, 76, 21, 25, PALETTE["shadow"])
    canvas.rect(12, 74, 21, 25, PALETTE["paper"])
    canvas.outline(12, 74, 21, 25, PALETTE["steel"])
    for y, color in [(79, "green"), (85, "gold"), (91, "coral")]:
        canvas.rect(16, y, 4, 3, PALETTE[color])
        canvas.rect(22, y, 7, 2, PALETTE["steel"])

    canvas.rect(92, 77, 24, 19, PALETTE["shadow"])
    canvas.rect(90, 75, 24, 19, PALETTE["steel"])
    canvas.outline(90, 75, 24, 19, PALETTE["white"])
    canvas.rect(96, 81, 12, 8, PALETTE["shadow"])
    canvas.rect(99, 78, 6, 5, PALETTE["gold"])
    canvas.rect(97, 82, 10, 8, PALETTE["gold"])
    canvas.point(102, 86, PALETTE["shadow"])

    for angle, color in [(222, "green"), (242, "gold"), (262, "cyan"), (282, "coral"), (302, "violet")]:
        rad = math.radians(angle)
        x = 99 + round(math.cos(rad) * 25)
        y = 25 + round(math.sin(rad) * 25)
        canvas.rect(x - 2, y - 2, 5, 5, PALETTE[color])
        canvas.line(x, y, 99, 25, PALETTE[color])


def render() -> Canvas:
    canvas = Canvas(WIDTH, HEIGHT, PALETTE["night"])
    draw_background(canvas)
    draw_coin(canvas)
    draw_observatory(canvas)
    draw_beams_and_panels(canvas)
    canvas.rect(0, 123, WIDTH, 5, PALETTE["shadow"])
    return canvas


def chunk(name: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(name + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", crc)


def write_png(canvas: Canvas, output: Path) -> None:
    raw = b"".join(b"\x00" + b"".join(bytes(pixel) for pixel in row) for row in canvas.pixels)
    header = struct.pack(">IIBBBBB", canvas.width, canvas.height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", header)
    png += chunk(b"IDAT", zlib.compress(raw, 9))
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
