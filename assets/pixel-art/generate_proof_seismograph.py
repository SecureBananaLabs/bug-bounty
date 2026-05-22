#!/usr/bin/env python3
"""Generate the proof seismograph pixel-art bounty asset."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128

PALETTE = {
    "bg": (14, 18, 31, 255),
    "grid": (30, 39, 62, 255),
    "grid_bright": (46, 58, 86, 255),
    "desk": (37, 32, 42, 255),
    "desk_edge": (83, 62, 67, 255),
    "paper": (224, 221, 188, 255),
    "paper_shadow": (151, 138, 112, 255),
    "ink": (31, 48, 61, 255),
    "green": (52, 211, 153, 255),
    "green_dark": (18, 123, 92, 255),
    "amber": (245, 158, 11, 255),
    "orange": (213, 83, 48, 255),
    "cyan": (45, 212, 191, 255),
    "blue": (59, 130, 246, 255),
    "purple": (168, 85, 247, 255),
    "panel": (26, 28, 48, 255),
    "panel_edge": (92, 83, 120, 255),
    "white": (246, 244, 216, 255),
}


pixels = bytearray(PALETTE["bg"] * WIDTH * HEIGHT)


def set_pixel(x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        index = (y * WIDTH + x) * 4
        pixels[index : index + 4] = bytes(color)


def rect(x: int, y: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_pixel(xx, yy, color)


def line(x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int, int]) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy

    while True:
        set_pixel(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def draw_background() -> None:
    for x in range(0, WIDTH, 8):
        for y in range(0, HEIGHT, 2):
            set_pixel(x, y, PALETTE["grid"])
    for y in range(0, HEIGHT, 8):
        for x in range(0, WIDTH, 2):
            set_pixel(x, y, PALETTE["grid"])
    for x in range(0, WIDTH, 32):
        for y in range(0, HEIGHT, 4):
            set_pixel(x, y, PALETTE["grid_bright"])
    for y in range(0, HEIGHT, 32):
        for x in range(0, WIDTH, 4):
            set_pixel(x, y, PALETTE["grid_bright"])


def draw_desk() -> None:
    rect(10, 88, 108, 24, PALETTE["desk"])
    rect(10, 88, 108, 3, PALETTE["desk_edge"])
    rect(14, 112, 100, 4, PALETTE["desk_edge"])
    rect(21, 116, 7, 8, PALETTE["desk"])
    rect(96, 116, 7, 8, PALETTE["desk"])


def draw_paper_tape() -> None:
    rect(16, 60, 96, 26, PALETTE["paper_shadow"])
    rect(18, 57, 92, 26, PALETTE["paper"])

    for x in range(20, 108, 7):
        rect(x, 59, 2, 2, PALETTE["paper_shadow"])
        rect(x, 79, 2, 2, PALETTE["paper_shadow"])

    for x in range(22, 106, 10):
        rect(x, 69, 4, 1, PALETTE["paper_shadow"])

    points = [
        (21, 70),
        (28, 71),
        (35, 68),
        (42, 73),
        (48, 66),
        (55, 67),
        (62, 61),
        (69, 72),
        (75, 65),
        (82, 69),
        (89, 62),
        (96, 64),
        (106, 58),
    ]
    for start, end in zip(points, points[1:]):
        line(*start, *end, PALETTE["green_dark"])
        line(start[0], start[1] - 1, end[0], end[1] - 1, PALETTE["green"])

    for x, y, color in [
        (34, 68, PALETTE["cyan"]),
        (62, 61, PALETTE["amber"]),
        (89, 62, PALETTE["purple"]),
        (106, 58, PALETTE["green"]),
    ]:
        rect(x - 1, y - 1, 3, 3, color)


def draw_machine() -> None:
    rect(32, 30, 63, 30, PALETTE["panel_edge"])
    rect(35, 33, 57, 24, PALETTE["panel"])
    rect(41, 38, 28, 5, PALETTE["blue"])
    rect(41, 46, 17, 4, PALETTE["cyan"])
    rect(64, 46, 20, 4, PALETTE["purple"])

    for x, color in [(73, PALETTE["green"]), (80, PALETTE["amber"]), (87, PALETTE["orange"])]:
        rect(x, 37, 4, 4, color)
        rect(x + 1, 36, 2, 1, PALETTE["white"])

    rect(59, 60, 10, 13, PALETTE["panel_edge"])
    rect(62, 57, 4, 18, PALETTE["panel"])
    line(64, 58, 72, 51, PALETTE["panel_edge"])
    rect(70, 48, 12, 7, PALETTE["panel_edge"])
    rect(72, 49, 8, 4, PALETTE["green"])


def draw_status_tokens() -> None:
    token_data = [
        (20, 92, PALETTE["cyan"]),
        (38, 94, PALETTE["blue"]),
        (57, 91, PALETTE["purple"]),
        (78, 94, PALETTE["amber"]),
        (98, 92, PALETTE["green"]),
    ]
    for x, y, color in token_data:
        rect(x, y, 10, 10, PALETTE["panel_edge"])
        rect(x + 2, y + 2, 6, 6, color)
        rect(x + 4, y + 1, 2, 1, PALETTE["white"])
    for start, end in zip(token_data, token_data[1:]):
        line(start[0] + 10, start[1] + 5, end[0], end[1] + 5, PALETTE["grid_bright"])


def write_png(path: Path) -> None:
    def chunk(kind: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(kind + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", crc)

    raw_rows = bytearray()
    row_width = WIDTH * 4
    for y in range(HEIGHT):
        raw_rows.append(0)
        start = y * row_width
        raw_rows.extend(pixels[start : start + row_width])

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw_rows), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    draw_background()
    draw_desk()
    draw_machine()
    draw_paper_tape()
    draw_status_tokens()
    write_png(Path(__file__).with_name("proof-seismograph.png"))


if __name__ == "__main__":
    main()
