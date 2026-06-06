#!/usr/bin/env python3
"""Generate the Escrow Circuit Garden pixel-art asset."""

from __future__ import annotations

import hashlib
import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path(__file__).with_name("escrow-circuit-garden.png")

PALETTE = {
    "sky": (12, 18, 31),
    "panel": (26, 36, 62),
    "panel_dark": (15, 23, 42),
    "rail": (79, 178, 204),
    "rail_shadow": (31, 92, 124),
    "gold": (238, 188, 83),
    "gold_dark": (160, 105, 41),
    "leaf": (83, 192, 120),
    "leaf_dark": (37, 112, 79),
    "proof": (225, 235, 246),
    "ink": (58, 72, 104),
    "review": (239, 92, 99),
    "glow": (245, 239, 159),
    "violet": (139, 115, 230),
}


def chunk(kind: bytes, data: bytes) -> bytes:
    payload = kind + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)


def rect(pixels: list[list[tuple[int, int, int]]], x: int, y: int, w: int, h: int, color: str) -> None:
    rgb = PALETTE[color]
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        for xx in range(max(0, x), min(WIDTH, x + w)):
            pixels[yy][xx] = rgb


def outline_rect(pixels: list[list[tuple[int, int, int]]], x: int, y: int, w: int, h: int, fill: str, border: str) -> None:
    rect(pixels, x, y, w, h, border)
    rect(pixels, x + 2, y + 2, w - 4, h - 4, fill)


def write_png(pixels: list[list[tuple[int, int, int]]]) -> None:
    rows = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in pixels)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(rows, 9))
        + chunk(b"IEND", b"")
    )
    OUT.write_bytes(png)
    print(f"{OUT.name} {WIDTH}x{HEIGHT} sha256={hashlib.sha256(png).hexdigest()}")


def main() -> None:
    pixels = [[PALETTE["sky"] for _ in range(WIDTH)] for _ in range(HEIGHT)]

    # Dithered night-grid backdrop.
    for y in range(0, HEIGHT, 8):
        rect(pixels, 0, y, WIDTH, 1, "panel_dark")
    for x in range(0, WIDTH, 8):
        rect(pixels, x, 0, 1, HEIGHT, "panel_dark")

    # Escrow terminal and verification board.
    outline_rect(pixels, 20, 72, 88, 32, "panel", "ink")
    outline_rect(pixels, 38, 52, 52, 24, "panel", "rail_shadow")
    rect(pixels, 44, 58, 12, 8, "proof")
    rect(pixels, 60, 58, 8, 8, "gold")
    rect(pixels, 72, 58, 12, 8, "leaf")
    rect(pixels, 26, 82, 12, 10, "proof")
    rect(pixels, 42, 82, 12, 10, "proof")
    rect(pixels, 58, 82, 12, 10, "proof")
    rect(pixels, 74, 82, 12, 10, "proof")
    rect(pixels, 90, 82, 12, 10, "proof")
    for x in (29, 45, 61, 77, 93):
        rect(pixels, x, 85, 6, 2, "ink")

    # Payout rails and proof packets.
    rect(pixels, 12, 108, 104, 4, "rail_shadow")
    rect(pixels, 16, 112, 96, 4, "rail")
    for x in (18, 34, 50, 66, 82, 98):
        rect(pixels, x, 105, 8, 8, "gold")
        rect(pixels, x + 2, 107, 4, 4, "gold_dark")

    # Circuit garden stems.
    for x, h in ((30, 28), (48, 36), (66, 30), (84, 40), (100, 24)):
        rect(pixels, x, 52 - h // 2, 4, h, "leaf_dark")
        rect(pixels, x + 2, 52 - h // 2, 2, h, "leaf")
        rect(pixels, x - 6, 48 - h // 2, 10, 6, "leaf")
        rect(pixels, x + 4, 42 - h // 2, 10, 6, "leaf")

    # Review lights and status beacon.
    outline_rect(pixels, 52, 18, 24, 18, "panel", "violet")
    rect(pixels, 58, 23, 4, 4, "review")
    rect(pixels, 64, 23, 4, 4, "glow")
    rect(pixels, 70, 23, 4, 4, "leaf")
    rect(pixels, 60, 31, 16, 4, "rail")
    rect(pixels, 62, 14, 12, 4, "glow")

    # Pixel sparks around the successful settlement.
    for x, y, color in (
        (18, 30, "gold"),
        (24, 42, "rail"),
        (96, 26, "leaf"),
        (112, 44, "gold"),
        (106, 64, "review"),
        (14, 66, "violet"),
        (118, 94, "glow"),
        (8, 100, "leaf"),
    ):
        rect(pixels, x, y, 4, 4, color)

    write_png(pixels)


if __name__ == "__main__":
    main()
