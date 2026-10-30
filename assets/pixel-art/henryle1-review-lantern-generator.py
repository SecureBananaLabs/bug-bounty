#!/usr/bin/env python3
"""Generate the Review Lantern Desk pixel-art bounty asset."""

from __future__ import annotations

import struct
import zlib


WIDTH = 128
HEIGHT = 128
OUTPUT = "assets/pixel-art/henryle1-review-lantern-desk.png"


def make_canvas() -> list[list[tuple[int, int, int, int]]]:
    return [[(10, 14, 30, 255) for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(canvas: list[list[tuple[int, int, int, int]]], x: int, y: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        for xx in range(max(0, x), min(WIDTH, x + w)):
            canvas[yy][xx] = color


def checker(canvas: list[list[tuple[int, int, int, int]]], x: int, y: int, w: int, h: int, c1: tuple[int, int, int, int], c2: tuple[int, int, int, int]) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            canvas[yy][xx] = c1 if ((xx // 4) + (yy // 4)) % 2 == 0 else c2


def draw() -> list[list[tuple[int, int, int, int]]]:
    canvas = make_canvas()

    # Back wall and desk.
    rect(canvas, 8, 8, 112, 86, (17, 25, 55, 255))
    rect(canvas, 12, 12, 104, 78, (24, 34, 72, 255))
    checker(canvas, 12, 94, 104, 20, (38, 32, 42, 255), (48, 39, 50, 255))
    rect(canvas, 6, 114, 116, 6, (18, 13, 24, 255))

    # Review board.
    rect(canvas, 24, 18, 80, 40, (8, 13, 28, 255))
    rect(canvas, 26, 20, 76, 36, (30, 44, 82, 255))
    for i, x in enumerate((32, 48, 64, 80)):
        color = (70, 214, 140, 255) if i < 3 else (245, 198, 79, 255)
        rect(canvas, x, 28, 10, 10, color)
        rect(canvas, x + 1, 29, 8, 8, (12, 25, 35, 255))
        rect(canvas, x + 3, 31, 4, 4, color)
    rect(canvas, 34, 44, 60, 4, (84, 132, 255, 255))
    rect(canvas, 34, 50, 44, 3, (70, 214, 140, 255))

    # Lantern.
    rect(canvas, 58, 62, 12, 5, (84, 60, 29, 255))
    rect(canvas, 56, 67, 16, 23, (75, 52, 25, 255))
    rect(canvas, 59, 70, 10, 16, (255, 216, 112, 255))
    rect(canvas, 61, 72, 6, 12, (255, 240, 168, 255))
    rect(canvas, 53, 73, 3, 9, (255, 216, 112, 255))
    rect(canvas, 72, 73, 3, 9, (255, 216, 112, 255))

    # Desk items: keyboard, ticket card, bounty coin.
    rect(canvas, 24, 100, 32, 7, (75, 91, 130, 255))
    for x in range(27, 53, 5):
        rect(canvas, x, 102, 3, 2, (180, 204, 255, 255))
    rect(canvas, 72, 96, 26, 14, (232, 239, 255, 255))
    rect(canvas, 76, 100, 18, 2, (84, 132, 255, 255))
    rect(canvas, 76, 105, 12, 2, (70, 214, 140, 255))
    rect(canvas, 102, 94, 12, 12, (245, 198, 79, 255))
    rect(canvas, 105, 97, 6, 6, (137, 89, 26, 255))
    rect(canvas, 107, 98, 2, 4, (245, 198, 79, 255))

    # Pixel glow around the lantern.
    for radius, color in (
        (28, (38, 43, 63, 255)),
        (20, (51, 51, 62, 255)),
        (12, (64, 57, 52, 255)),
    ):
        for yy in range(62 - radius, 84 + radius):
            for xx in range(64 - radius, 64 + radius):
                if 0 <= xx < WIDTH and 0 <= yy < HEIGHT:
                    if abs(xx - 64) + abs(yy - 78) <= radius:
                        base = canvas[yy][xx]
                        canvas[yy][xx] = tuple(max(base[i], color[i]) for i in range(4))

    return canvas


def png_chunk(name: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)


def write_png(path: str, canvas: list[list[tuple[int, int, int, int]]]) -> None:
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    payload = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            png_chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0)),
            png_chunk(b"IDAT", zlib.compress(bytes(raw), level=9)),
            png_chunk(b"IEND", b""),
        ]
    )
    with open(path, "wb") as handle:
        handle.write(payload)


if __name__ == "__main__":
    write_png(OUTPUT, draw())
    print(OUTPUT)
