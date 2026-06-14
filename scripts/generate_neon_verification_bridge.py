#!/usr/bin/env python3
"""Generate the neon verification bridge pixel-art submission."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/neon-verification-bridge.png")


PALETTE = {
    "bg": (12, 16, 34, 255),
    "grid": (22, 40, 64, 255),
    "deep": (8, 12, 24, 255),
    "cyan": (71, 213, 255, 255),
    "blue": (64, 105, 255, 255),
    "violet": (172, 111, 255, 255),
    "green": (54, 211, 153, 255),
    "gold": (255, 205, 88, 255),
    "pink": (255, 92, 160, 255),
    "white": (238, 246, 255, 255),
    "panel": (25, 34, 61, 255),
    "shadow": (3, 7, 18, 255),
}


def new_canvas() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["bg"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_px(canvas: list[list[tuple[int, int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = PALETTE[color]


def rect(
    canvas: list[list[tuple[int, int, int, int]]],
    x: int,
    y: int,
    width: int,
    height: int,
    color: str,
) -> None:
    for yy in range(y, y + height):
        for xx in range(x, x + width):
            set_px(canvas, xx, yy, color)


def line_h(canvas: list[list[tuple[int, int, int, int]]], x1: int, x2: int, y: int, color: str) -> None:
    for x in range(min(x1, x2), max(x1, x2) + 1):
        set_px(canvas, x, y, color)


def line_v(canvas: list[list[tuple[int, int, int, int]]], x: int, y1: int, y2: int, color: str) -> None:
    for y in range(min(y1, y2), max(y1, y2) + 1):
        set_px(canvas, x, y, color)


def draw_background(canvas: list[list[tuple[int, int, int, int]]]) -> None:
    rect(canvas, 0, 74, WIDTH, 54, "deep")
    for x in range(0, WIDTH, 8):
        for y in range(0, 76):
            if (x + y) % 16 == 0:
                set_px(canvas, x, y, "grid")
    for y in range(80, HEIGHT, 10):
        line_h(canvas, 0, WIDTH - 1, y, "grid")
    for x in range(4, WIDTH, 12):
        line_v(canvas, x, 76, HEIGHT - 1, "grid")
    for x, y, color in [
        (16, 16, "cyan"),
        (31, 9, "violet"),
        (91, 14, "gold"),
        (111, 25, "green"),
        (51, 25, "white"),
        (76, 7, "pink"),
    ]:
        rect(canvas, x, y, 2, 2, color)


def draw_bridge(canvas: list[list[tuple[int, int, int, int]]]) -> None:
    rect(canvas, 14, 70, 100, 8, "shadow")
    rect(canvas, 12, 64, 104, 8, "panel")
    line_h(canvas, 12, 115, 63, "cyan")
    line_h(canvas, 14, 113, 72, "blue")
    for x in range(18, 112, 12):
        rect(canvas, x, 58, 4, 20, "panel")
        rect(canvas, x, 58, 4, 2, "cyan")
    for x in range(16, 112, 8):
        set_px(canvas, x, 67, "white")
        set_px(canvas, x + 1, 67, "white")
    for x in range(20, 109, 14):
        line_h(canvas, x, x + 8, 54, "violet")
        set_px(canvas, x + 4, 53, "pink")


def draw_checkpoint(
    canvas: list[list[tuple[int, int, int, int]]],
    x: int,
    color: str,
    tick: bool,
) -> None:
    rect(canvas, x, 42, 12, 23, "panel")
    line_h(canvas, x, x + 11, 42, color)
    line_v(canvas, x, 42, 64, color)
    line_v(canvas, x + 11, 42, 64, color)
    rect(canvas, x + 3, 47, 6, 6, color)
    if tick:
        set_px(canvas, x + 4, 56, "green")
        set_px(canvas, x + 5, 57, "green")
        set_px(canvas, x + 6, 58, "green")
        set_px(canvas, x + 7, 57, "green")
        set_px(canvas, x + 8, 56, "green")


def draw_work_tile(canvas: list[list[tuple[int, int, int, int]]]) -> None:
    rect(canvas, 52, 49, 24, 13, "gold")
    rect(canvas, 54, 51, 20, 9, "panel")
    line_h(canvas, 57, 70, 53, "white")
    line_h(canvas, 57, 67, 56, "green")
    set_px(canvas, 71, 56, "pink")
    rect(canvas, 48, 53, 4, 5, "cyan")
    rect(canvas, 76, 53, 4, 5, "cyan")


def draw_water_and_reflections(canvas: list[list[tuple[int, int, int, int]]]) -> None:
    for y, color in [(86, "blue"), (94, "violet"), (103, "cyan"), (113, "green")]:
        for x in range(10, 118, 18):
            line_h(canvas, x, x + 8, y, color)
    for x in [23, 48, 80, 104]:
        rect(canvas, x, 78, 4, 8, "cyan")
        rect(canvas, x + 1, 88, 2, 5, "blue")


def write_png(canvas: list[list[tuple[int, int, int, int]]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    def chunk(name: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + name
            + payload
            + struct.pack(">I", zlib.crc32(name + payload) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for pixel in row:
            raw.extend(pixel)

    payload = b"\x89PNG\r\n\x1a\n"
    payload += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    payload += chunk(b"IDAT", zlib.compress(bytes(raw), level=9))
    payload += chunk(b"IEND", b"")
    path.write_bytes(payload)


def main() -> None:
    canvas = new_canvas()
    draw_background(canvas)
    draw_water_and_reflections(canvas)
    draw_bridge(canvas)
    for x, color in [(18, "cyan"), (42, "violet"), (74, "green"), (98, "gold")]:
        draw_checkpoint(canvas, x, color, tick=x != 98)
    draw_work_tile(canvas)
    write_png(canvas, OUT)
    print(f"wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
