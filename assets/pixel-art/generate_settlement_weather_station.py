#!/usr/bin/env python3
"""Generate the Settlement Weather Station pixel-art bounty asset."""

from __future__ import annotations

import argparse
import os
import struct
import zlib
from pathlib import Path

SIZE = 128
SCALE = 4

PALETTE = {
    "sky": (20, 28, 44),
    "sky2": (35, 45, 68),
    "floor": (25, 29, 39),
    "shadow": (12, 14, 22),
    "panel": (47, 57, 78),
    "panel2": (61, 73, 96),
    "edge": (122, 144, 167),
    "glass": (66, 124, 158),
    "glass_hi": (120, 202, 224),
    "amber": (238, 174, 74),
    "green": (108, 218, 125),
    "red": (226, 91, 91),
    "blue": (92, 154, 221),
    "white": (232, 240, 238),
    "ink": (8, 10, 16),
    "rail": (101, 111, 133),
}


def put_rect(img: list[list[tuple[int, int, int]]], x: int, y: int, w: int, h: int, color: str) -> None:
    rgb = PALETTE[color]
    for py in range(max(0, y), min(SIZE, y + h)):
        row = img[py]
        for px in range(max(0, x), min(SIZE, x + w)):
            row[px] = rgb


def put_line(img: list[list[tuple[int, int, int]]], x0: int, y0: int, x1: int, y1: int, color: str) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        if 0 <= x < SIZE and 0 <= y < SIZE:
            img[y][x] = PALETTE[color]
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def put_pixelated_text_bar(img: list[list[tuple[int, int, int]]], x: int, y: int, count: int, color: str) -> None:
    for i in range(count):
        put_rect(img, x + i * 5, y + (i % 2), 3, 2, color)


def make_image(frame: int = 0) -> list[list[tuple[int, int, int]]]:
    img = [[PALETTE["sky"] for _ in range(SIZE)] for _ in range(SIZE)]

    for y in range(SIZE):
        band = "sky2" if y > 28 and (y + frame) % 9 < 3 else "sky"
        for x in range(SIZE):
            if (x + y) % 17 == 0:
                img[y][x] = PALETTE[band]

    put_rect(img, 0, 96, 128, 32, "floor")
    put_rect(img, 0, 118, 128, 10, "shadow")

    # Main station body.
    put_rect(img, 17, 44, 94, 58, "panel")
    put_rect(img, 21, 48, 86, 50, "panel2")
    put_rect(img, 17, 44, 94, 4, "edge")
    put_rect(img, 17, 98, 94, 4, "edge")
    put_rect(img, 17, 44, 4, 58, "edge")
    put_rect(img, 107, 44, 4, 58, "edge")

    # Forecast window.
    put_rect(img, 27, 53, 40, 27, "ink")
    put_rect(img, 30, 56, 34, 21, "glass")
    put_rect(img, 33, 59, 9, 5, "glass_hi")
    put_rect(img, 45, 64, 15, 3, "white")
    put_rect(img, 50, 58, 5, 5, "white")
    put_rect(img, 51, 59, 7, 3, "white")

    # Review/proof lights.
    light_on = frame % 4
    light_names = ["green", "amber", "blue", "red"]
    for i, name in enumerate(light_names):
        put_rect(img, 75 + i * 8, 55, 5, 5, name if i != light_on else "white")
        put_rect(img, 75 + i * 8, 61, 5, 2, "ink")

    # Ticket/proof tiles.
    for i in range(3):
        x = 75 + i * 13
        put_rect(img, x, 70, 10, 9, "sky2")
        put_rect(img, x + 2, 72, 6, 2, "amber")
        put_rect(img, x + 2, 76, 4, 1, "white")

    # Payout rails.
    for y in (85, 91):
        put_line(img, 26, y, 101, y, "rail")
    for i in range(8):
        x = 30 + i * 9
        color = "green" if (i + frame) % 3 == 0 else "amber"
        put_rect(img, x, 86, 5, 4, color)

    # Antenna and wind vane.
    put_rect(img, 61, 28, 6, 16, "edge")
    put_line(img, 64, 24, 64, 28, "white")
    put_line(img, 52, 30, 76, 30, "edge")
    put_rect(img, 50, 28, 4, 4, "amber")
    put_rect(img, 76, 28, 4, 4, "green")

    # Title/status strips.
    put_pixelated_text_bar(img, 29, 83, 7, "white")
    put_pixelated_text_bar(img, 75, 83, 6, "white")

    # Pixel grid texture on floor.
    for x in range(0, SIZE, 8):
        put_line(img, x, 104, x + 10, 128, "shadow")

    return img


def write_png(path: Path, img: list[list[tuple[int, int, int]]], scale: int = 1) -> None:
    width = SIZE * scale
    height = SIZE * scale
    rows: list[bytes] = []
    for y in range(SIZE):
        row = bytearray()
        for x in range(SIZE):
            rgb = img[y][x]
            for _ in range(scale):
                row.extend(rgb)
        scaled_row = bytes([0]) + bytes(row)
        for _ in range(scale):
            rows.append(scaled_row)

    def chunk(name: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)

    raw = b"".join(rows)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="assets/pixel-art/settlement-weather-station.png")
    parser.add_argument("--frames-dir", default="")
    args = parser.parse_args()

    write_png(Path(args.output), make_image(0), scale=1)
    if args.frames_dir:
        frames_dir = Path(args.frames_dir)
        frames_dir.mkdir(parents=True, exist_ok=True)
        for frame in range(16):
            write_png(frames_dir / f"frame-{frame:03d}.png", make_image(frame), scale=SCALE)


if __name__ == "__main__":
    main()
