#!/usr/bin/env python3
"""Generate an original 128x128 pixel-art PNG for bounty issue #80."""

from __future__ import annotations

import struct
import sys
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUTPUT = Path(__file__).with_name("claim-routing-switchboard.png")

PALETTE = {
    "bg": (18, 25, 41),
    "grid": (31, 45, 68),
    "panel": (37, 54, 79),
    "panel_shadow": (20, 30, 48),
    "edge": (82, 105, 139),
    "teal": (40, 198, 182),
    "cyan": (91, 219, 255),
    "gold": (250, 190, 76),
    "amber": (215, 139, 50),
    "coral": (239, 101, 101),
    "green": (104, 213, 133),
    "white": (232, 241, 255),
    "muted": (124, 145, 177),
    "dark": (8, 12, 22),
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

    def outline(self, x: int, y: int, width: int, height: int, color: tuple[int, int, int]) -> None:
        self.line(x, y, x + width - 1, y, color)
        self.line(x, y + height - 1, x + width - 1, y + height - 1, color)
        self.line(x, y, x, y + height - 1, color)
        self.line(x + width - 1, y, x + width - 1, y + height - 1, color)

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

    def diamond(self, cx: int, cy: int, radius: int, color: tuple[int, int, int]) -> None:
        for y in range(cy - radius, cy + radius + 1):
            span = radius - abs(y - cy)
            for x in range(cx - span, cx + span + 1):
                self.point(x, y, color)

    def circle(self, cx: int, cy: int, radius: int, color: tuple[int, int, int]) -> None:
        radius_sq = radius * radius
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= radius_sq:
                    self.point(x, y, color)


def draw_node(canvas: Canvas, x: int, y: int, accent: tuple[int, int, int], icon: str) -> None:
    canvas.rect(x - 12, y - 10, 24, 20, PALETTE["panel_shadow"])
    canvas.rect(x - 11, y - 11, 24, 20, PALETTE["panel"])
    canvas.outline(x - 11, y - 11, 24, 20, PALETTE["edge"])
    canvas.rect(x - 8, y - 8, 18, 3, accent)

    if icon == "scope":
        canvas.rect(x - 6, y - 2, 12, 2, PALETTE["white"])
        canvas.rect(x - 6, y + 3, 9, 2, PALETTE["muted"])
        canvas.rect(x - 6, y + 7, 11, 1, PALETTE["muted"])
    elif icon == "tests":
        for offset in (0, 5, 10):
            canvas.rect(x - 7 + offset, y - 1, 3, 8, PALETTE["dark"])
            canvas.rect(x - 7 + offset, y + 4, 3, 3, accent)
    elif icon == "review":
        canvas.circle(x - 3, y + 1, 5, PALETTE["white"])
        canvas.circle(x - 3, y + 1, 3, PALETTE["panel"])
        canvas.line(x + 1, y + 5, x + 8, y + 9, accent)
    elif icon == "payout":
        canvas.rect(x - 5, y - 3, 12, 3, PALETTE["gold"])
        canvas.rect(x - 7, y + 1, 14, 3, PALETTE["amber"])
        canvas.rect(x - 5, y + 5, 12, 3, PALETTE["gold"])


def render() -> Canvas:
    canvas = Canvas(WIDTH, HEIGHT, PALETTE["bg"])

    for pos in range(0, WIDTH, 8):
        canvas.line(pos, 0, pos, HEIGHT - 1, PALETTE["grid"])
        canvas.line(0, pos, WIDTH - 1, pos, PALETTE["grid"])

    for x, y in [(9, 10), (116, 14), (17, 116), (111, 111), (58, 8), (77, 120)]:
        canvas.point(x, y, PALETTE["cyan"])
        canvas.point(x + 1, y, PALETTE["teal"])

    canvas.rect(13, 15, 102, 98, PALETTE["panel_shadow"])
    canvas.rect(10, 12, 104, 98, PALETTE["panel"])
    canvas.outline(10, 12, 104, 98, PALETTE["edge"])
    canvas.rect(16, 18, 92, 5, PALETTE["dark"])
    canvas.rect(18, 19, 12, 3, PALETTE["teal"])
    canvas.rect(33, 19, 22, 3, PALETTE["muted"])
    canvas.rect(84, 19, 18, 3, PALETTE["gold"])

    node_specs = [
        (28, 39, PALETTE["teal"], "scope"),
        (98, 39, PALETTE["green"], "tests"),
        (28, 88, PALETTE["coral"], "review"),
        (98, 88, PALETTE["gold"], "payout"),
    ]

    for x, y, accent, _ in node_specs:
        canvas.line(64, 64, x, y, accent)
        canvas.line(64, 65, x, y + 1, PALETTE["dark"])

    canvas.diamond(64, 64, 15, PALETTE["dark"])
    canvas.diamond(64, 64, 12, PALETTE["cyan"])
    canvas.diamond(64, 64, 8, PALETTE["teal"])
    canvas.rect(58, 61, 12, 2, PALETTE["white"])
    canvas.rect(60, 66, 8, 2, PALETTE["white"])

    for spec in node_specs:
        draw_node(canvas, *spec)

    for index, x in enumerate(range(20, 106, 9)):
        color = PALETTE["teal"] if index % 3 == 0 else PALETTE["gold"] if index % 3 == 1 else PALETTE["green"]
        canvas.rect(x, 119, 4, 3, color)

    canvas.rect(18, 104, 90, 2, PALETTE["dark"])
    canvas.rect(18, 105, 28, 1, PALETTE["teal"])
    canvas.rect(50, 105, 20, 1, PALETTE["coral"])
    canvas.rect(74, 105, 34, 1, PALETTE["gold"])
    return canvas


def png_chunk(name: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)


def write_png(canvas: Canvas, path: Path) -> None:
    raw_rows = []
    for row in canvas.pixels:
        raw_rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))
    raw = b"".join(raw_rows)
    header = struct.pack(">IIBBBBB", canvas.width, canvas.height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += png_chunk(b"IHDR", header)
    png += png_chunk(b"IDAT", zlib.compress(raw, level=9))
    png += png_chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def main() -> int:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else OUTPUT
    write_png(render(), output)
    print(f"wrote {output} ({WIDTH}x{HEIGHT})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
