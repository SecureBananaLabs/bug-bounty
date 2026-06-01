from __future__ import annotations

import struct
import zlib
from pathlib import Path

WIDTH = 128
HEIGHT = 128
OUTPUT = Path(__file__).with_name("verification-rails.png")

COLORS = {
    "bg": (13, 18, 26),
    "grid": (25, 35, 46),
    "rail": (64, 201, 220),
    "rail_shadow": (23, 102, 125),
    "green": (126, 211, 98),
    "amber": (238, 174, 64),
    "coral": (232, 92, 91),
    "violet": (128, 112, 232),
    "paper": (230, 226, 204),
    "ink": (45, 54, 71),
    "white": (244, 248, 252),
}


def blank_canvas() -> list[list[tuple[int, int, int]]]:
    return [[COLORS["bg"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_pixel(canvas: list[list[tuple[int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = COLORS[color]


def rect(
    canvas: list[list[tuple[int, int, int]]],
    x: int,
    y: int,
    width: int,
    height: int,
    color: str,
) -> None:
    for yy in range(y, y + height):
        for xx in range(x, x + width):
            set_pixel(canvas, xx, yy, color)


def frame(
    canvas: list[list[tuple[int, int, int]]],
    x: int,
    y: int,
    width: int,
    height: int,
    color: str,
) -> None:
    rect(canvas, x, y, width, 1, color)
    rect(canvas, x, y + height - 1, width, 1, color)
    rect(canvas, x, y, 1, height, color)
    rect(canvas, x + width - 1, y, 1, height, color)


def line(
    canvas: list[list[tuple[int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: str,
) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    error = dx + dy

    while True:
        set_pixel(canvas, x0, y0, color)
        if x0 == x1 and y0 == y1:
            return
        doubled = 2 * error
        if doubled >= dy:
            error += dy
            x0 += sx
        if doubled <= dx:
            error += dx
            y0 += sy


def draw_grid(canvas: list[list[tuple[int, int, int]]]) -> None:
    for x in range(0, WIDTH, 8):
        for y in range(0, HEIGHT, 2):
            set_pixel(canvas, x, y, "grid")
    for y in range(0, HEIGHT, 8):
        for x in range(0, WIDTH, 2):
            set_pixel(canvas, x, y, "grid")


def draw_packet(canvas: list[list[tuple[int, int, int]]], x: int, y: int, color: str) -> None:
    rect(canvas, x, y, 10, 7, color)
    rect(canvas, x + 1, y + 1, 8, 5, "white")
    rect(canvas, x + 3, y + 3, 4, 1, color)


def draw_check(canvas: list[list[tuple[int, int, int]]], x: int, y: int) -> None:
    rect(canvas, x, y + 5, 2, 2, "green")
    rect(canvas, x + 2, y + 7, 2, 2, "green")
    rect(canvas, x + 4, y + 5, 2, 2, "green")
    rect(canvas, x + 6, y + 3, 2, 2, "green")
    rect(canvas, x + 8, y + 1, 2, 2, "green")


def draw_coin(canvas: list[list[tuple[int, int, int]]], x: int, y: int) -> None:
    rows = [4, 8, 10, 12, 12, 10, 8, 4]
    for yy, width in enumerate(rows):
        offset = (12 - width) // 2
        rect(canvas, x + offset, y + yy, width, 1, "amber")
    rect(canvas, x + 5, y + 2, 2, 4, "white")
    rect(canvas, x + 7, y + 5, 2, 1, "white")


def draw_scene(canvas: list[list[tuple[int, int, int]]]) -> None:
    draw_grid(canvas)

    rect(canvas, 6, 14, 30, 28, "ink")
    frame(canvas, 6, 14, 30, 28, "paper")
    rect(canvas, 12, 20, 17, 3, "paper")
    rect(canvas, 12, 27, 13, 2, "paper")
    rect(canvas, 12, 33, 19, 2, "paper")

    rect(canvas, 47, 17, 34, 34, "ink")
    frame(canvas, 47, 17, 34, 34, "rail")
    rect(canvas, 54, 24, 20, 3, "violet")
    draw_check(canvas, 58, 31)
    draw_check(canvas, 66, 31)

    rect(canvas, 93, 14, 27, 31, "ink")
    frame(canvas, 93, 14, 27, 31, "amber")
    draw_coin(canvas, 101, 24)

    rect(canvas, 20, 72, 18, 18, "ink")
    frame(canvas, 20, 72, 18, 18, "coral")
    rect(canvas, 25, 77, 8, 8, "coral")

    rect(canvas, 54, 68, 22, 22, "ink")
    frame(canvas, 54, 68, 22, 22, "green")
    draw_check(canvas, 60, 74)

    rect(canvas, 92, 72, 20, 18, "ink")
    frame(canvas, 92, 72, 20, 18, "amber")
    draw_coin(canvas, 96, 77)

    for y in [56, 60, 64]:
        line(canvas, 13, y, 113, y, "rail_shadow")
        line(canvas, 13, y - 1, 113, y - 1, "rail")

    line(canvas, 35, 28, 47, 33, "rail")
    line(canvas, 81, 33, 93, 29, "rail")
    line(canvas, 29, 72, 49, 63, "rail")
    line(canvas, 76, 79, 92, 80, "rail")

    draw_packet(canvas, 17, 54, "coral")
    draw_packet(canvas, 57, 53, "violet")
    draw_packet(canvas, 99, 54, "green")
    draw_packet(canvas, 39, 92, "paper")
    draw_packet(canvas, 75, 95, "amber")

    rect(canvas, 8, 106, 112, 10, "ink")
    frame(canvas, 8, 106, 112, 10, "grid")
    for x, color in [(15, "coral"), (31, "rail"), (47, "violet"), (63, "green"), (79, "amber"), (95, "paper")]:
        rect(canvas, x, 110, 9, 2, color)


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(canvas: list[list[tuple[int, int, int]]]) -> None:
    raw_rows = []
    for row in canvas:
        raw_rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))

    png = b"\x89PNG\r\n\x1a\n"
    png += png_chunk("IHDR".encode(), struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += png_chunk("IDAT".encode(), zlib.compress(b"".join(raw_rows), level=9))
    png += png_chunk("IEND".encode(), b"")
    OUTPUT.write_bytes(png)


def main() -> None:
    canvas = blank_canvas()
    draw_scene(canvas)
    write_png(canvas)


if __name__ == "__main__":
    main()
