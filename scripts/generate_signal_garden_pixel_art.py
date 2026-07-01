#!/usr/bin/env python3
"""Generate the issue #80 pixel-art asset with only Python stdlib."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

SIZE = 128
OUTPUT = Path("assets/pixel-art/signal_garden_terminal.png")

PALETTE = {
    "night": (10, 16, 30),
    "panel": (20, 31, 52),
    "panel_edge": (65, 86, 122),
    "rail": (65, 188, 210),
    "rail_dark": (24, 102, 126),
    "leaf": (72, 173, 102),
    "leaf_dark": (36, 108, 74),
    "gold": (246, 196, 83),
    "orange": (232, 118, 64),
    "pink": (214, 88, 137),
    "blue": (94, 156, 255),
    "white": (230, 240, 255),
    "shadow": (4, 8, 16),
}


def put_rect(pixels: list[list[tuple[int, int, int]]], x: int, y: int, w: int, h: int, color: str) -> None:
    rgb = PALETTE[color]
    for yy in range(max(0, y), min(SIZE, y + h)):
        for xx in range(max(0, x), min(SIZE, x + w)):
            pixels[yy][xx] = rgb


def put_line(pixels: list[list[tuple[int, int, int]]], x0: int, y0: int, x1: int, y1: int, color: str) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0

    while True:
        put_rect(pixels, x, y, 2, 2, color)
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def draw() -> list[list[tuple[int, int, int]]]:
    pixels = [[PALETTE["night"] for _ in range(SIZE)] for _ in range(SIZE)]

    # Pixel-grid sky with quiet depth.
    for y in range(0, SIZE, 8):
        shade = "panel" if (y // 8) % 2 == 0 else "night"
        put_rect(pixels, 0, y, SIZE, 1, shade)
    for x in range(0, SIZE, 8):
        put_rect(pixels, x, 0, 1, SIZE, "shadow")

    # Main terminal.
    put_rect(pixels, 18, 20, 92, 62, "shadow")
    put_rect(pixels, 16, 18, 92, 62, "panel")
    put_rect(pixels, 16, 18, 92, 3, "panel_edge")
    put_rect(pixels, 16, 77, 92, 3, "panel_edge")
    put_rect(pixels, 16, 18, 3, 62, "panel_edge")
    put_rect(pixels, 105, 18, 3, 62, "panel_edge")

    # Signal lights.
    for index, color in enumerate(("pink", "gold", "blue", "leaf")):
        put_rect(pixels, 28 + index * 18, 30, 8, 8, color)
        put_rect(pixels, 30 + index * 18, 32, 4, 4, "white")

    # Terminal readout.
    put_rect(pixels, 28, 48, 68, 6, "rail_dark")
    put_rect(pixels, 28, 58, 52, 5, "rail")
    put_rect(pixels, 28, 68, 38, 4, "gold")

    # Garden stems and review branches.
    for x in (30, 46, 62, 78, 94):
        put_line(pixels, x, 82, x - 4, 106, "leaf_dark")
        put_rect(pixels, x - 8, 95, 6, 4, "leaf")
        put_rect(pixels, x + 1, 89, 7, 4, "leaf")
        put_rect(pixels, x - 2, 105, 5, 5, "gold")

    # Payout rails meeting at the root.
    put_line(pixels, 12, 116, 116, 116, "rail")
    put_line(pixels, 24, 112, 104, 112, "rail_dark")
    put_rect(pixels, 57, 108, 14, 14, "orange")
    put_rect(pixels, 61, 112, 6, 6, "white")

    # Small stars.
    for x, y, color in ((11, 12, "blue"), (116, 18, "gold"), (8, 70, "pink"), (118, 88, "leaf")):
        put_rect(pixels, x, y, 2, 2, color)
        put_rect(pixels, x - 1, y + 1, 4, 1, color)

    return pixels


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path: Path, pixels: list[list[tuple[int, int, int]]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for red, green, blue in row:
            raw.extend((red, green, blue))

    data = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            png_chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0)),
            png_chunk(b"IDAT", zlib.compress(bytes(raw), level=9)),
            png_chunk(b"IEND", b""),
        ]
    )
    path.write_bytes(data)


def main() -> None:
    write_png(OUTPUT, draw())
    print(f"wrote {OUTPUT} ({SIZE}x{SIZE})")


if __name__ == "__main__":
    main()
