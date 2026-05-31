from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

SIZE = 128
SCALE = 4
OUT = Path(__file__).with_name("proof-orbit-station.png")


def chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, pixels: list[list[tuple[int, int, int, int]]]) -> None:
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    data = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)),
            chunk(b"IDAT", zlib.compress(bytes(raw), 9)),
            chunk(b"IEND", b""),
        ]
    )
    path.write_bytes(data)


def canvas() -> list[list[tuple[int, int, int, int]]]:
    return [[(13, 18, 34, 255) for _ in range(SIZE)] for _ in range(SIZE)]


def rect(pixels, x, y, w, h, color) -> None:
    for yy in range(max(0, y), min(SIZE, y + h)):
        for xx in range(max(0, x), min(SIZE, x + w)):
            pixels[yy][xx] = color


def circle(pixels, cx, cy, radius, color) -> None:
    rr = radius * radius
    for yy in range(cy - radius, cy + radius + 1):
        for xx in range(cx - radius, cx + radius + 1):
            if 0 <= xx < SIZE and 0 <= yy < SIZE:
                if (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= rr:
                    pixels[yy][xx] = color


def line(pixels, x0, y0, x1, y1, color) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        if 0 <= x0 < SIZE and 0 <= y0 < SIZE:
            pixels[y0][x0] = color
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def draw() -> list[list[tuple[int, int, int, int]]]:
    pixels = canvas()
    navy = (13, 18, 34, 255)
    grid = (24, 39, 66, 255)
    teal = (48, 226, 180, 255)
    mint = (133, 255, 214, 255)
    gold = (255, 205, 93, 255)
    orange = (238, 126, 75, 255)
    blue = (79, 154, 255, 255)
    white = (235, 244, 255, 255)
    purple = (119, 92, 232, 255)
    shadow = (7, 10, 22, 255)

    for i in range(0, SIZE, 8):
        line(pixels, i, 0, i, SIZE - 1, grid)
        line(pixels, 0, i, SIZE - 1, i, grid)

    for x, y, r, c in [
        (18, 17, 1, mint),
        (103, 15, 1, gold),
        (115, 79, 1, blue),
        (18, 104, 1, teal),
        (44, 11, 1, purple),
        (91, 111, 1, white),
    ]:
        circle(pixels, x, y, r, c)

    # Orbit ring around the proof station.
    for deg in range(0, 360, 4):
        rad = math.radians(deg)
        x = int(64 + math.cos(rad) * 42)
        y = int(64 + math.sin(rad) * 25)
        if 0 <= x < SIZE and 0 <= y < SIZE and deg % 16 != 0:
            pixels[y][x] = (54, 88, 128, 255)

    rect(pixels, 38, 44, 52, 38, shadow)
    rect(pixels, 34, 40, 52, 38, (30, 43, 74, 255))
    rect(pixels, 37, 43, 46, 32, (17, 25, 48, 255))
    rect(pixels, 41, 47, 38, 24, (22, 34, 61, 255))

    # Proof checklist display.
    for i, y in enumerate([50, 57, 64]):
        rect(pixels, 44, y, 4, 4, teal if i < 2 else gold)
        line(pixels, 45, y + 2, 46, y + 3, navy)
        line(pixels, 46, y + 3, 49, y, navy)
        rect(pixels, 53, y + 1, 19, 2, white if i < 2 else orange)

    # Antenna and payout beacon.
    line(pixels, 60, 40, 60, 30, teal)
    circle(pixels, 60, 28, 3, gold)
    circle(pixels, 60, 28, 1, white)
    line(pixels, 60, 31, 52, 36, blue)
    line(pixels, 60, 31, 70, 36, blue)

    # Satellite payout coin.
    circle(pixels, 101, 50, 8, gold)
    rect(pixels, 98, 45, 6, 2, navy)
    rect(pixels, 97, 50, 8, 2, navy)
    rect(pixels, 98, 55, 6, 2, navy)
    line(pixels, 91, 53, 84, 59, teal)

    # Review shuttle.
    rect(pixels, 24, 75, 19, 8, (42, 70, 110, 255))
    rect(pixels, 28, 72, 10, 3, blue)
    rect(pixels, 42, 77, 7, 3, orange)
    circle(pixels, 28, 84, 2, teal)
    circle(pixels, 38, 84, 2, teal)
    line(pixels, 45, 81, 55, 73, purple)

    # Foundation pixels.
    rect(pixels, 43, 82, 35, 5, (21, 31, 58, 255))
    rect(pixels, 48, 88, 25, 4, (38, 57, 91, 255))
    for x in [49, 57, 65, 73]:
        rect(pixels, x, 92, 3, 9, (63, 83, 122, 255))
        rect(pixels, x - 1, 101, 5, 3, shadow)

    # Tiny approval sparks.
    for x, y, c in [(33, 38, teal), (83, 30, gold), (96, 86, mint), (25, 56, blue)]:
        pixels[y][x] = c
        pixels[y - 1][x] = c
        pixels[y + 1][x] = c
        pixels[y][x - 1] = c
        pixels[y][x + 1] = c

    return pixels


if __name__ == "__main__":
    write_png(OUT, draw())
    print(f"Wrote {OUT}")
