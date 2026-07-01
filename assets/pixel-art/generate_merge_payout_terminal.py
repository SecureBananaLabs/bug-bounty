#!/usr/bin/env python3
"""Generate an original 128x128 pixel-art PNG for bounty issue #80."""

from __future__ import annotations

import struct
import sys
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUTPUT = Path(__file__).with_name("merge-payout-terminal.png")

COLORS = {
    "bg": (14, 18, 30),
    "grid": (27, 36, 58),
    "terminal": (32, 45, 69),
    "shadow": (9, 13, 24),
    "rim": (91, 119, 160),
    "screen": (12, 28, 38),
    "cyan": (82, 226, 255),
    "teal": (54, 204, 175),
    "violet": (142, 127, 255),
    "gold": (247, 188, 72),
    "amber": (204, 130, 42),
    "rose": (237, 92, 124),
    "green": (103, 217, 124),
    "white": (235, 243, 255),
    "muted": (132, 151, 184),
}


class Canvas:
    def __init__(self, width: int, height: int, color: tuple[int, int, int]) -> None:
        self.width = width
        self.height = height
        self.pixels = [[color for _ in range(width)] for _ in range(height)]

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

    def circle(self, cx: int, cy: int, radius: int, color: tuple[int, int, int]) -> None:
        rr = radius * radius
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= rr:
                    self.point(x, y, color)


def draw_terminal(canvas: Canvas) -> None:
    canvas.rect(16, 20, 98, 82, COLORS["shadow"])
    canvas.rect(12, 16, 98, 82, COLORS["terminal"])
    canvas.outline(12, 16, 98, 82, COLORS["rim"])
    canvas.rect(19, 23, 84, 49, COLORS["screen"])
    canvas.outline(19, 23, 84, 49, COLORS["cyan"])
    canvas.rect(25, 31, 22, 4, COLORS["teal"])
    canvas.rect(52, 31, 35, 4, COLORS["muted"])
    canvas.rect(25, 42, 55, 3, COLORS["violet"])
    canvas.rect(25, 51, 33, 3, COLORS["green"])
    canvas.rect(63, 51, 20, 3, COLORS["gold"])
    canvas.rect(25, 60, 13, 3, COLORS["rose"])
    canvas.rect(43, 60, 44, 3, COLORS["muted"])

    for x in range(24, 96, 12):
        canvas.rect(x, 81, 8, 6, COLORS["shadow"])
        canvas.rect(x + 1, 80, 8, 6, COLORS["rim"])
        canvas.rect(x + 3, 82, 4, 2, COLORS["white"])


def draw_payout_core(canvas: Canvas) -> None:
    canvas.rect(50, 75, 33, 28, COLORS["shadow"])
    canvas.rect(46, 72, 33, 28, COLORS["terminal"])
    canvas.outline(46, 72, 33, 28, COLORS["gold"])
    canvas.rect(51, 78, 23, 5, COLORS["amber"])
    canvas.rect(51, 86, 23, 5, COLORS["gold"])
    canvas.rect(51, 94, 23, 2, COLORS["amber"])
    canvas.circle(62, 63, 10, COLORS["gold"])
    canvas.circle(62, 63, 7, COLORS["amber"])
    canvas.rect(58, 60, 9, 2, COLORS["white"])
    canvas.rect(61, 56, 3, 13, COLORS["white"])


def draw_status_rails(canvas: Canvas) -> None:
    rails = [
        (12, 108, 22, COLORS["teal"]),
        (38, 108, 22, COLORS["violet"]),
        (64, 108, 22, COLORS["green"]),
        (90, 108, 22, COLORS["gold"]),
    ]
    for x, y, width, color in rails:
        canvas.rect(x, y, width, 6, COLORS["shadow"])
        canvas.rect(x + 1, y - 1, width, 6, color)
        canvas.rect(x + 4, y + 1, width - 6, 2, COLORS["white"])
    for x in (24, 50, 76, 102):
        canvas.line(x, 101, x, 107, COLORS["rim"])


def render() -> Canvas:
    canvas = Canvas(WIDTH, HEIGHT, COLORS["bg"])
    for x in range(0, WIDTH, 10):
        canvas.line(x, 0, x, HEIGHT - 1, COLORS["grid"])
    for y in range(0, HEIGHT, 10):
        canvas.line(0, y, WIDTH - 1, y, COLORS["grid"])
    for x, y in [(5, 8), (118, 11), (7, 118), (116, 119), (101, 7), (30, 6)]:
        canvas.point(x, y, COLORS["cyan"])
        canvas.point(x + 1, y + 1, COLORS["teal"])

    draw_terminal(canvas)
    draw_payout_core(canvas)
    draw_status_rails(canvas)

    canvas.line(35, 72, 51, 84, COLORS["teal"])
    canvas.line(89, 72, 73, 84, COLORS["violet"])
    canvas.line(62, 73, 62, 82, COLORS["gold"])
    return canvas


def chunk(name: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)


def write_png(canvas: Canvas, output: Path) -> None:
    rows = [b"\x00" + b"".join(bytes(pixel) for pixel in row) for row in canvas.pixels]
    raw = b"".join(rows)
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
