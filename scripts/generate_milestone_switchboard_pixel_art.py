#!/usr/bin/env python3
"""Generate the milestone switchboard pixel-art asset."""

from __future__ import annotations

import os
import struct
import zlib


WIDTH = 128
HEIGHT = 128

PALETTE = {
    "bg": (14, 18, 32),
    "grid": (25, 34, 54),
    "panel": (37, 47, 72),
    "panel_dark": (22, 29, 49),
    "edge": (82, 105, 146),
    "cyan": (71, 210, 219),
    "blue": (72, 132, 238),
    "gold": (245, 184, 65),
    "green": (78, 205, 128),
    "red": (235, 92, 92),
    "white": (226, 236, 246),
    "shadow": (8, 11, 20),
    "purple": (147, 108, 255),
}


def set_px(pixels: list[list[tuple[int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        pixels[y][x] = PALETTE[color]


def rect(
    pixels: list[list[tuple[int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: str,
) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(pixels, xx, yy, color)


def line_h(pixels: list[list[tuple[int, int, int]]], x1: int, x2: int, y: int, color: str) -> None:
    for x in range(min(x1, x2), max(x1, x2) + 1):
        set_px(pixels, x, y, color)


def line_v(pixels: list[list[tuple[int, int, int]]], x: int, y1: int, y2: int, color: str) -> None:
    for y in range(min(y1, y2), max(y1, y2) + 1):
        set_px(pixels, x, y, color)


def write_png(path: str, pixels: list[list[tuple[int, int, int]]]) -> None:
    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for red, green, blue in row:
            raw.extend((red, green, blue))

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(b"\x89PNG\r\n\x1a\n")
        handle.write(chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)))
        handle.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
        handle.write(chunk(b"IEND", b""))


def main() -> None:
    pixels = [[PALETTE["bg"] for _ in range(WIDTH)] for _ in range(HEIGHT)]

    # Circuit-board background.
    for pos in range(0, WIDTH, 8):
        line_v(pixels, pos, 0, HEIGHT - 1, "grid")
        line_h(pixels, 0, WIDTH - 1, pos, "grid")

    # Main switchboard console.
    rect(pixels, 18, 30, 92, 64, "shadow")
    rect(pixels, 16, 28, 92, 64, "panel")
    rect(pixels, 20, 32, 84, 56, "panel_dark")
    rect(pixels, 16, 28, 92, 3, "edge")
    rect(pixels, 16, 89, 92, 3, "edge")
    rect(pixels, 16, 28, 3, 64, "edge")
    rect(pixels, 105, 28, 3, 64, "edge")

    # Workflow bus lines: scope -> proof -> review -> merge -> payout.
    bus_y = [42, 52, 62, 72, 82]
    colors = ["cyan", "blue", "purple", "green", "gold"]
    for index, y in enumerate(bus_y):
        line_h(pixels, 26, 91, y, colors[index])
        line_h(pixels, 26, 91, y + 1, colors[index])
        rect(pixels, 22, y - 3, 8, 8, colors[index])
        rect(pixels, 88, y - 3, 8, 8, colors[index])

    # Cross-routing wires and tiny switch handles.
    for x, top, bottom, color in [
        (38, 42, 72, "cyan"),
        (50, 52, 82, "blue"),
        (62, 42, 62, "purple"),
        (74, 52, 72, "green"),
        (86, 62, 82, "gold"),
    ]:
        line_v(pixels, x, top, bottom, color)
        rect(pixels, x - 2, (top + bottom) // 2 - 2, 5, 5, "white")

    # Ticket slot and review stamp.
    rect(pixels, 36, 17, 50, 9, "shadow")
    rect(pixels, 34, 15, 50, 9, "panel")
    rect(pixels, 38, 18, 42, 3, "white")
    rect(pixels, 44, 99, 36, 10, "shadow")
    rect(pixels, 42, 97, 36, 10, "gold")
    rect(pixels, 47, 100, 26, 4, "panel_dark")

    # Status lights.
    for x, color in [(24, "cyan"), (38, "blue"), (52, "purple"), (66, "green"), (80, "gold"), (94, "red")]:
        rect(pixels, x, 113, 5, 5, color)
        rect(pixels, x + 1, 114, 3, 3, "white")

    # A compact pixel checkmark on the payout side.
    for x, y in [(98, 78), (99, 79), (100, 80), (101, 79), (102, 78), (103, 77), (104, 76)]:
        rect(pixels, x, y, 2, 2, "green")

    write_png("assets/pixel-art/milestone-switchboard.png", pixels)


if __name__ == "__main__":
    main()
