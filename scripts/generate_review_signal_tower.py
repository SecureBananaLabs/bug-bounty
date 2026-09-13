#!/usr/bin/env python3
from __future__ import annotations

import argparse
import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "assets" / "pixel-art" / "review-signal-tower.png"


PALETTE = {
    "void": (10, 13, 22, 255),
    "night": (16, 23, 37, 255),
    "grid": (23, 39, 59, 255),
    "grid_dim": (17, 30, 47, 255),
    "steel": (54, 69, 87, 255),
    "steel_dark": (31, 43, 61, 255),
    "steel_light": (91, 111, 133, 255),
    "cyan": (75, 212, 230, 255),
    "cyan_dim": (34, 110, 133, 255),
    "mint": (96, 233, 154, 255),
    "gold": (246, 198, 79, 255),
    "orange": (234, 118, 70, 255),
    "red": (218, 66, 76, 255),
    "purple": (136, 103, 241, 255),
    "white": (232, 243, 244, 255),
}


def new_canvas() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["void"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def px(img: list[list[tuple[int, int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        img[y][x] = PALETTE[color]


def rect(
    img: list[list[tuple[int, int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: str,
) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px(img, xx, yy, color)


def line(
    img: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: str,
    size: int = 1,
) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        rect(img, x, y, size, size, color)
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def box_outline(
    img: list[list[tuple[int, int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    edge: str,
    fill: str | None = None,
) -> None:
    if fill:
        rect(img, x + 1, y + 1, w - 2, h - 2, fill)
    rect(img, x, y, w, 1, edge)
    rect(img, x, y + h - 1, w, 1, edge)
    rect(img, x, y, 1, h, edge)
    rect(img, x + w - 1, y, 1, h, edge)


def draw_scene() -> list[list[tuple[int, int, int, int]]]:
    img = new_canvas()

    rect(img, 0, 0, WIDTH, HEIGHT, "night")
    for y in range(10, 118, 8):
        for x in range(0, WIDTH, 2):
            if (x + y) % 16 == 0:
                px(img, x, y, "grid_dim")
    for x in range(0, WIDTH, 16):
        line(img, x, 34, x, 116, "grid_dim")
    for y in range(44, 120, 12):
        line(img, 0, y, WIDTH - 1, y, "grid")

    for x, y, color in [
        (13, 12, "cyan"),
        (30, 25, "purple"),
        (100, 14, "gold"),
        (114, 31, "mint"),
        (82, 8, "white"),
    ]:
        rect(img, x, y, 2, 2, color)

    line(img, 10, 96, 51, 70, "cyan_dim", 2)
    line(img, 117, 96, 76, 70, "cyan_dim", 2)
    line(img, 18, 111, 55, 86, "steel_dark", 2)
    line(img, 110, 111, 72, 86, "steel_dark", 2)

    for x, y, color in [
        (18, 89, "purple"),
        (31, 81, "gold"),
        (43, 73, "mint"),
        (95, 81, "orange"),
        (108, 90, "red"),
    ]:
        box_outline(img, x, y, 7, 7, color, "night")
        rect(img, x + 2, y + 2, 3, 3, color)

    rect(img, 44, 104, 40, 8, "steel_dark")
    rect(img, 36, 112, 56, 6, "steel")
    rect(img, 28, 118, 72, 6, "steel_dark")
    rect(img, 18, 124, 92, 4, "grid")

    rect(img, 51, 49, 26, 56, "steel_dark")
    rect(img, 56, 45, 16, 62, "steel")
    rect(img, 60, 45, 4, 62, "steel_light")
    rect(img, 52, 56, 24, 3, "cyan_dim")
    rect(img, 52, 76, 24, 3, "cyan_dim")
    rect(img, 52, 96, 24, 3, "cyan_dim")

    for y in [53, 64, 85]:
        rect(img, 58, y, 4, 5, "mint")
        rect(img, 66, y, 4, 5, "gold")
    for y in [72, 92]:
        rect(img, 58, y, 4, 5, "purple")
        rect(img, 66, y, 4, 5, "cyan")

    rect(img, 47, 43, 34, 6, "steel_dark")
    rect(img, 53, 36, 22, 9, "steel")
    rect(img, 59, 30, 10, 8, "gold")
    rect(img, 61, 24, 6, 6, "white")
    rect(img, 60, 22, 8, 2, "gold")
    rect(img, 62, 17, 4, 5, "cyan")

    line(img, 64, 25, 33, 19, "cyan_dim")
    line(img, 64, 25, 95, 19, "cyan_dim")
    line(img, 64, 24, 21, 35, "purple")
    line(img, 64, 24, 107, 35, "purple")
    for x, y in [(29, 18), (93, 18), (17, 34), (105, 34)]:
        rect(img, x, y, 5, 5, "cyan")
        rect(img, x + 1, y + 1, 3, 3, "white")

    for x, label_color in [(8, "red"), (20, "orange"), (32, "gold")]:
        rect(img, x, 116, 8, 4, label_color)
    for x, label_color in [(88, "mint"), (100, "cyan"), (112, "purple")]:
        rect(img, x, 116, 8, 4, label_color)

    box_outline(img, 7, 52, 25, 18, "cyan_dim", "night")
    rect(img, 10, 56, 6, 3, "mint")
    rect(img, 18, 56, 10, 3, "grid")
    rect(img, 10, 62, 15, 3, "gold")

    box_outline(img, 96, 52, 25, 18, "purple", "night")
    rect(img, 100, 56, 7, 3, "red")
    rect(img, 109, 56, 8, 3, "grid")
    rect(img, 100, 62, 16, 3, "mint")

    for i in range(0, 128, 4):
        if i < 34 or i > 94:
            px(img, i, 40, "grid")
            px(img, i + 1, 40, "grid")

    return img


def write_png(path: Path, img: list[list[tuple[int, int, int, int]]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    payload = b"\x89PNG\r\n\x1a\n"
    payload += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    payload += chunk(b"IDAT", zlib.compress(bytes(raw), level=9))
    payload += chunk(b"IEND", b"")
    path.write_bytes(payload)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the review signal tower pixel art PNG.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    write_png(args.out, draw_scene())
    print(f"Wrote {args.out} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
