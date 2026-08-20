#!/usr/bin/env python3
"""Generate the Scope Weather Station pixel-art asset with stdlib only."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path(__file__).with_name("scope-weather-station.png")

PALETTE = {
    "ink": (3, 7, 18, 255),
    "sky0": (12, 18, 32, 255),
    "sky1": (18, 28, 45, 255),
    "sky2": (28, 43, 62, 255),
    "floor0": (35, 49, 67, 255),
    "floor1": (51, 65, 85, 255),
    "floor2": (71, 85, 105, 255),
    "steel0": (15, 23, 42, 255),
    "steel1": (30, 41, 59, 255),
    "steel2": (71, 85, 105, 255),
    "steel3": (100, 116, 139, 255),
    "steel4": (203, 213, 225, 255),
    "cyan0": (8, 47, 73, 255),
    "cyan1": (14, 165, 233, 255),
    "cyan2": (56, 189, 248, 255),
    "cyan3": (125, 211, 252, 255),
    "mint0": (22, 101, 52, 255),
    "mint1": (34, 197, 94, 255),
    "mint2": (110, 231, 183, 255),
    "gold0": (161, 98, 7, 255),
    "gold1": (245, 158, 11, 255),
    "gold2": (250, 204, 21, 255),
    "gold3": (253, 230, 138, 255),
    "red": (248, 113, 113, 255),
    "white": (248, 250, 252, 255),
}


def blank(colour: str) -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE[colour] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(
    pixels: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    colour: str,
) -> None:
    rgba = PALETTE[colour]
    for y in range(max(0, y0), min(HEIGHT, y1 + 1)):
        row = pixels[y]
        for x in range(max(0, x0), min(WIDTH, x1 + 1)):
            row[x] = rgba


def line(
    pixels: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    colour: str,
) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        rect(pixels, x0, y0, x0, y0, colour)
        if x0 == x1 and y0 == y1:
            return
        twice = 2 * err
        if twice >= dy:
            err += dy
            x0 += sx
        if twice <= dx:
            err += dx
            y0 += sy


def write_png(path: Path, pixels: list[list[tuple[int, int, int, int]]]) -> None:
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for rgba in row:
            raw.extend(rgba)

    def chunk(kind: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    data = bytearray(b"\x89PNG\r\n\x1a\n")
    data.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0)))
    data.extend(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
    data.extend(chunk(b"IEND", b""))
    path.write_bytes(data)


def build() -> list[list[tuple[int, int, int, int]]]:
    p = blank("sky0")

    # Layered sky and distant horizon.
    rect(p, 0, 18, 127, 38, "sky1")
    rect(p, 0, 39, 127, 60, "sky2")
    rect(p, 0, 61, 127, 91, "floor0")
    rect(p, 0, 92, 127, 104, "floor1")
    rect(p, 0, 118, 127, 127, "ink")
    rect(p, 0, 105, 127, 108, "floor2")
    rect(p, 0, 112, 127, 116, "floor0")

    # Checksum stars and a small moon.
    for x, y, c in [
        (10, 14, "mint2"),
        (29, 22, "mint2"),
        (57, 9, "mint2"),
        (73, 28, "mint2"),
        (104, 34, "mint2"),
        (117, 12, "mint2"),
        (86, 18, "gold3"),
    ]:
        rect(p, x, y, x + 1, y + 1, c)
    rect(p, 84, 16, 91, 23, "gold1")
    rect(p, 86, 18, 89, 21, "gold3")

    # Left review console.
    rect(p, 13, 42, 72, 86, "steel0")
    rect(p, 16, 46, 69, 82, "steel1")
    rect(p, 20, 50, 65, 78, "cyan2")
    rect(p, 23, 53, 62, 75, "cyan1")
    rect(p, 27, 57, 58, 72, "cyan0")
    rect(p, 31, 60, 43, 62, "cyan3")
    rect(p, 31, 65, 53, 67, "cyan3")
    rect(p, 31, 70, 40, 72, "cyan3")
    rect(p, 48, 58, 55, 65, "white")
    rect(p, 52, 61, 58, 67, "mint1")
    rect(p, 57, 56, 60, 60, "ink")
    rect(p, 57, 66, 60, 69, "ink")
    rect(p, 35, 84, 57, 90, "steel4")
    rect(p, 22, 88, 64, 95, "steel2")
    rect(p, 30, 91, 56, 93, "steel3")

    # Right signal tower with wind/radar head.
    rect(p, 82, 32, 90, 94, "steel1")
    rect(p, 85, 27, 88, 94, "steel3")
    rect(p, 78, 41, 94, 45, "steel2")
    rect(p, 78, 56, 94, 60, "steel2")
    rect(p, 78, 72, 94, 76, "steel2")
    line(p, 85, 31, 76, 51, "steel2")
    line(p, 88, 31, 99, 52, "steel2")
    rect(p, 91, 25, 111, 30, "steel4")
    rect(p, 95, 21, 107, 24, "sky2")
    rect(p, 112, 22, 118, 28, "gold1")
    rect(p, 89, 48, 119, 73, "steel0")
    rect(p, 93, 52, 116, 69, "cyan1")
    rect(p, 97, 56, 112, 65, "cyan0")
    rect(p, 101, 58, 109, 60, "cyan3")
    rect(p, 100, 63, 112, 65, "cyan3")

    # Readiness lights and payout coins.
    rect(p, 77, 85, 97, 92, "mint1")
    rect(p, 80, 88, 100, 96, "mint0")
    rect(p, 84, 87, 90, 89, "mint2")
    rect(p, 93, 89, 98, 91, "mint2")
    rect(p, 106, 82, 114, 90, "gold2")
    rect(p, 114, 84, 121, 92, "gold2")
    rect(p, 108, 89, 116, 95, "gold0")
    rect(p, 116, 91, 123, 96, "gold0")
    rect(p, 108, 83, 111, 86, "gold3")
    rect(p, 116, 85, 119, 88, "gold3")

    # Floor rails, cable shadows, and small status ticks.
    rect(p, 12, 100, 23, 103, "floor2")
    rect(p, 42, 100, 55, 103, "floor2")
    rect(p, 73, 100, 87, 103, "floor2")
    rect(p, 105, 100, 119, 103, "floor2")
    rect(p, 12, 110, 19, 113, "steel2")
    rect(p, 23, 110, 30, 113, "steel2")
    rect(p, 34, 110, 41, 113, "steel2")
    rect(p, 100, 111, 107, 114, "steel2")
    rect(p, 112, 112, 119, 115, "steel2")
    line(p, 67, 95, 78, 91, "ink")
    line(p, 98, 96, 106, 93, "ink")

    # Tiny weather front above the console, making the subject less generic.
    rect(p, 40, 31, 47, 34, "steel3")
    rect(p, 44, 28, 53, 34, "steel3")
    rect(p, 51, 31, 58, 34, "steel3")
    rect(p, 43, 35, 45, 37, "cyan3")
    rect(p, 50, 35, 52, 38, "cyan3")

    return p


def main() -> None:
    write_png(OUT, build())
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
