#!/usr/bin/env python3
"""Generate a deterministic pixel-art asset for bounty issue #80."""

from __future__ import annotations

import argparse
import os
import struct
import zlib


WIDTH = 128
HEIGHT = 128

PALETTE = {
    "bg": (10, 14, 28, 255),
    "grid": (24, 34, 55, 255),
    "panel": (24, 30, 48, 255),
    "panel_hi": (50, 63, 93, 255),
    "panel_shadow": (5, 8, 15, 255),
    "cyan": (49, 217, 255, 255),
    "green": (57, 255, 136, 255),
    "gold": (255, 205, 74, 255),
    "purple": (172, 122, 255, 255),
    "red": (255, 83, 112, 255),
    "white": (219, 236, 255, 255),
    "muted": (91, 111, 145, 255),
}


def blank(color: tuple[int, int, int, int]) -> list[list[tuple[int, int, int, int]]]:
    return [[color for _ in range(WIDTH)] for _ in range(HEIGHT)]


def pixel(img, x, y, color):
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        img[y][x] = color


def rect(img, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            pixel(img, xx, yy, color)


def border(img, x, y, w, h, color):
    rect(img, x, y, w, 1, color)
    rect(img, x, y + h - 1, w, 1, color)
    rect(img, x, y, 1, h, color)
    rect(img, x + w - 1, y, 1, h, color)


def line(img, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        pixel(img, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def diamond(img, cx, cy, r, color):
    for y in range(cy - r, cy + r + 1):
        span = r - abs(cy - y)
        rect(img, cx - span, y, span * 2 + 1, 1, color)


def draw_icon(img, index, cx, cy, color):
    if index == 0:
        border(img, cx - 4, cy - 4, 9, 9, color)
        rect(img, cx - 2, cy - 2, 5, 5, PALETTE["bg"])
    elif index == 1:
        line(img, cx - 5, cy, cx - 1, cy + 4, color)
        line(img, cx - 1, cy + 4, cx + 5, cy - 4, color)
    elif index == 2:
        line(img, cx - 6, cy, cx, cy - 4, color)
        line(img, cx, cy - 4, cx + 6, cy, color)
        line(img, cx + 6, cy, cx, cy + 4, color)
        line(img, cx, cy + 4, cx - 6, cy, color)
        rect(img, cx - 1, cy - 1, 3, 3, color)
    elif index == 3:
        line(img, cx - 5, cy + 4, cx, cy - 1, color)
        line(img, cx, cy - 1, cx + 5, cy + 4, color)
        line(img, cx, cy - 5, cx, cy + 5, color)
        rect(img, cx - 1, cy - 6, 3, 3, color)
        rect(img, cx - 6, cy + 3, 3, 3, color)
        rect(img, cx + 4, cy + 3, 3, 3, color)
    else:
        diamond(img, cx, cy, 6, color)
        rect(img, cx - 2, cy - 4, 5, 9, PALETTE["bg"])
        rect(img, cx - 1, cy - 3, 3, 7, color)


def draw_art(active_step: int = 4):
    img = blank(PALETTE["bg"])

    for n in range(0, WIDTH, 8):
        for p in range(0, HEIGHT, 4):
            pixel(img, n, p, PALETTE["grid"])
            pixel(img, p, n, PALETTE["grid"])

    for x in range(18, 111, 11):
        line(img, x, 22, 64, 40, PALETTE["grid"])
        line(img, x, 106, 64, 88, PALETTE["grid"])

    rect(img, 18, 30, 92, 68, PALETTE["panel_shadow"])
    rect(img, 15, 27, 92, 68, PALETTE["panel"])
    border(img, 15, 27, 92, 68, PALETTE["panel_hi"])
    rect(img, 19, 31, 84, 8, PALETTE["panel_shadow"])
    rect(img, 22, 34, 16, 2, PALETTE["cyan"])
    rect(img, 42, 34, 23, 2, PALETTE["muted"])
    rect(img, 69, 34, 11, 2, PALETTE["muted"])
    rect(img, 84, 34, 15, 2, PALETTE["green"])

    colors = [
        PALETTE["cyan"],
        PALETTE["green"],
        PALETTE["purple"],
        PALETTE["white"],
        PALETTE["gold"],
    ]
    xs = [28, 46, 64, 82, 100]
    for i, cx in enumerate(xs):
        light = colors[i] if i <= active_step else PALETTE["muted"]
        rect(img, cx - 7, 51, 14, 21, PALETTE["panel_shadow"])
        border(img, cx - 7, 51, 14, 21, PALETTE["panel_hi"])
        draw_icon(img, i, cx, 61, light)
        rect(img, cx - 4, 76, 9, 2, light)

    line(img, 28, 84, 100, 84, PALETTE["muted"])
    for i, cx in enumerate(xs):
        diamond(img, cx, 84, 3, colors[i] if i <= active_step else PALETTE["muted"])

    rect(img, 23, 89, 78, 2, PALETTE["cyan"])
    rect(img, 23, 92, 52, 2, PALETTE["green"])
    rect(img, 23, 95, 68, 2, PALETTE["gold"])

    diamond(img, 64, 19, 8, PALETTE["gold"])
    rect(img, 62, 14, 5, 11, PALETTE["bg"])
    rect(img, 63, 15, 3, 9, PALETTE["gold"])

    return img


def write_png(path: str, img):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    raw = bytearray()
    for row in img:
        raw.append(0)
        for rgba in row:
            raw.extend(rgba)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")

    with open(path, "wb") as f:
        f.write(png)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        default="assets/pixel-art/bounty-signal-console.png",
        help="PNG output path",
    )
    parser.add_argument(
        "--frames-dir",
        help="Optional directory for demo animation frames",
    )
    args = parser.parse_args()

    write_png(args.output, draw_art(active_step=4))

    if args.frames_dir:
        os.makedirs(args.frames_dir, exist_ok=True)
        frame = 0
        for active in [0, 1, 2, 3, 4, 3, 4, 4]:
            for _ in range(6):
                frame += 1
                write_png(
                    os.path.join(args.frames_dir, f"frame-{frame:03d}.png"),
                    draw_art(active_step=active),
                )


if __name__ == "__main__":
    main()
