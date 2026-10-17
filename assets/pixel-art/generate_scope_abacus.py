#!/usr/bin/env python3
"""Generate the scope abacus pixel-art bounty asset.

The script intentionally uses only the Python standard library so reviewers can
reproduce the PNG without installing design tools.
"""

from __future__ import annotations

import os
import struct
import zlib

WIDTH = 128
HEIGHT = 128

PALETTE = {
    "bg": (13, 18, 31, 255),
    "bg2": (20, 28, 47, 255),
    "grid": (30, 48, 72, 255),
    "grid_hi": (42, 67, 91, 255),
    "shadow": (7, 10, 18, 255),
    "desk": (55, 42, 50, 255),
    "desk_hi": (86, 64, 72, 255),
    "desk_edge": (28, 24, 35, 255),
    "wood": (143, 92, 63, 255),
    "wood_dark": (95, 58, 49, 255),
    "wood_hi": (196, 135, 80, 255),
    "rail": (205, 214, 226, 255),
    "rail_shadow": (103, 122, 142, 255),
    "gold": (247, 193, 89, 255),
    "gold_hi": (255, 231, 147, 255),
    "green": (74, 222, 128, 255),
    "green_hi": (181, 255, 205, 255),
    "cyan": (56, 189, 248, 255),
    "cyan_hi": (173, 232, 255, 255),
    "pink": (244, 114, 182, 255),
    "pink_hi": (255, 196, 226, 255),
    "purple": (168, 85, 247, 255),
    "purple_hi": (221, 190, 255, 255),
    "orange": (251, 146, 60, 255),
    "orange_hi": (255, 206, 160, 255),
    "red": (248, 81, 73, 255),
    "ink": (27, 31, 44, 255),
    "paper": (235, 241, 248, 255),
    "paper_shadow": (142, 161, 179, 255),
    "white": (255, 255, 255, 255),
}


def new_canvas() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["bg"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_pixel(
    pixels: list[list[tuple[int, int, int, int]]],
    x: int,
    y: int,
    color: tuple[int, int, int, int],
) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        pixels[y][x] = color


def rect(
    pixels: list[list[tuple[int, int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    color_name: str,
) -> None:
    color = PALETTE[color_name]
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_pixel(pixels, xx, yy, color)


def line(
    pixels: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color_name: str,
) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        set_pixel(pixels, x0, y0, PALETTE[color_name])
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle(
    pixels: list[list[tuple[int, int, int, int]]],
    cx: int,
    cy: int,
    radius: int,
    color_name: str,
    outline_name: str | None = None,
) -> None:
    color = PALETTE[color_name]
    outline = PALETTE[outline_name] if outline_name else color
    r2 = radius * radius
    inner = (radius - 1) * (radius - 1)
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy)
            if d2 <= r2:
                set_pixel(pixels, x, y, outline if d2 >= inner else color)


def diamond(
    pixels: list[list[tuple[int, int, int, int]]],
    cx: int,
    cy: int,
    radius: int,
    color_name: str,
    outline_name: str,
) -> None:
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            d = abs(x - cx) + abs(y - cy)
            if d <= radius:
                set_pixel(pixels, x, y, PALETTE[outline_name if d == radius else color_name])


def draw_background(pixels: list[list[tuple[int, int, int, int]]]) -> None:
    rect(pixels, 0, 0, WIDTH, HEIGHT, "bg")
    for y in range(0, HEIGHT, 8):
        line(pixels, 0, y, WIDTH - 1, y, "grid")
    for x in range(0, WIDTH, 8):
        line(pixels, x, 0, x, HEIGHT - 1, "grid")
    for y in range(4, HEIGHT, 16):
        line(pixels, 0, y, WIDTH - 1, y, "grid_hi")
    for x in range(4, WIDTH, 16):
        line(pixels, x, 0, x, HEIGHT - 1, "grid_hi")

    for i in range(0, 128, 11):
        set_pixel(pixels, i, (i * 5 + 9) % 54, PALETTE["cyan"])
        set_pixel(pixels, (i * 3 + 18) % 128, 10 + (i * 7) % 45, PALETTE["purple"])


def draw_desk(pixels: list[list[tuple[int, int, int, int]]]) -> None:
    rect(pixels, 8, 96, 112, 10, "shadow")
    rect(pixels, 10, 86, 108, 22, "desk")
    rect(pixels, 10, 84, 108, 5, "desk_hi")
    rect(pixels, 10, 106, 108, 4, "desk_edge")
    for x in range(16, 112, 12):
        line(pixels, x, 87, x + 6, 107, "desk_edge")
    rect(pixels, 18, 91, 21, 10, "paper")
    rect(pixels, 18, 100, 21, 2, "paper_shadow")
    rect(pixels, 22, 94, 13, 2, "cyan")
    rect(pixels, 22, 98, 10, 1, "green")
    diamond(pixels, 103, 96, 8, "gold", "orange")
    rect(pixels, 100, 95, 7, 3, "white")
    rect(pixels, 102, 92, 3, 9, "white")


def draw_abacus_frame(pixels: list[list[tuple[int, int, int, int]]]) -> None:
    rect(pixels, 21, 28, 86, 6, "wood_hi")
    rect(pixels, 18, 32, 92, 7, "wood")
    rect(pixels, 18, 73, 92, 8, "wood_dark")
    rect(pixels, 21, 39, 5, 34, "wood")
    rect(pixels, 102, 39, 5, 34, "wood")
    rect(pixels, 17, 80, 94, 4, "shadow")

    for x in (26, 102):
        rect(pixels, x - 2, 35, 4, 42, "wood_dark")
        rect(pixels, x - 1, 35, 2, 42, "wood_hi")

    rail_y = [43, 52, 61, 70]
    for y in rail_y:
        rect(pixels, 25, y, 78, 2, "rail_shadow")
        rect(pixels, 25, y - 1, 78, 1, "rail")


def draw_bead(
    pixels: list[list[tuple[int, int, int, int]]],
    cx: int,
    cy: int,
    color_name: str,
    highlight_name: str,
) -> None:
    circle(pixels, cx, cy, 5, color_name, "ink")
    rect(pixels, cx - 2, cy - 4, 3, 2, highlight_name)
    set_pixel(pixels, cx + 3, cy + 3, PALETTE["shadow"])


def draw_beads(pixels: list[list[tuple[int, int, int, int]]]) -> None:
    rows = [
        (43, [(36, "cyan", "cyan_hi"), (49, "cyan", "cyan_hi"), (80, "cyan", "cyan_hi")]),
        (52, [(42, "green", "green_hi"), (61, "green", "green_hi"), (74, "green", "green_hi")]),
        (61, [(35, "pink", "pink_hi"), (69, "pink", "pink_hi"), (87, "pink", "pink_hi")]),
        (70, [(47, "purple", "purple_hi"), (60, "purple", "purple_hi"), (92, "orange", "orange_hi")]),
    ]
    for y, beads in rows:
        for x, color, highlight in beads:
            draw_bead(pixels, x, y, color, highlight)


def draw_status_lights(pixels: list[list[tuple[int, int, int, int]]]) -> None:
    labels = [
        (31, 21, "cyan"),
        (48, 21, "green"),
        (65, 21, "pink"),
        (82, 21, "purple"),
        (99, 21, "gold"),
    ]
    for cx, cy, color in labels:
        circle(pixels, cx, cy, 3, color, "ink")
        set_pixel(pixels, cx - 1, cy - 1, PALETTE["white"])
        line(pixels, cx, cy + 5, cx, cy + 9, color)


def write_png(path: str, pixels: list[list[tuple[int, int, int, int]]]) -> None:
    rows = []
    for row in pixels:
        raw = b"".join(bytes(pixel) for pixel in row)
        rows.append(b"\x00" + raw)
    compressed = zlib.compress(b"".join(rows), 9)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", compressed)
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def main() -> None:
    pixels = new_canvas()
    draw_background(pixels)
    draw_desk(pixels)
    draw_abacus_frame(pixels)
    draw_beads(pixels)
    draw_status_lights(pixels)

    out_dir = os.path.dirname(__file__)
    write_png(os.path.join(out_dir, "scope-abacus.png"), pixels)


if __name__ == "__main__":
    main()
