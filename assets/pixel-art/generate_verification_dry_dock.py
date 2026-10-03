#!/usr/bin/env python3
"""Generate the verification dry dock pixel-art bounty asset.

The script intentionally uses only the Python standard library so reviewers can
recreate the submitted PNG without installing image tooling.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path(__file__).with_name("verification-dry-dock.png")

TRANSPARENT = (0, 0, 0, 0)
INK = (9, 14, 28, 255)
NIGHT = (13, 19, 38, 255)
DEEP = (9, 30, 49, 255)
WATER = (12, 55, 73, 255)
WATER_LIGHT = (28, 99, 118, 255)
DOCK = (93, 74, 55, 255)
DOCK_DARK = (53, 43, 38, 255)
ROPE = (198, 159, 93, 255)
HULL = (177, 91, 70, 255)
HULL_DARK = (114, 54, 57, 255)
PAPER = (233, 229, 196, 255)
PAPER_SHADE = (183, 178, 146, 255)
CHECK = (102, 229, 170, 255)
BUOY = (241, 99, 80, 255)
BUOY_LIGHT = (255, 205, 121, 255)
CRANE = (229, 184, 74, 255)
CRANE_DARK = (142, 104, 47, 255)
COIN = (255, 214, 91, 255)
COIN_DARK = (185, 122, 42, 255)
LAMP = (111, 226, 255, 255)
LAMP_DIM = (42, 117, 148, 255)
WINDOW = (61, 211, 255, 255)


def blank() -> list[list[tuple[int, int, int, int]]]:
    return [[TRANSPARENT for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_px(img: list[list[tuple[int, int, int, int]]], x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        img[y][x] = color


def rect(
    img: list[list[tuple[int, int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: tuple[int, int, int, int],
) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(img, xx, yy, color)


def line(
    img: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: tuple[int, int, int, int],
) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        set_px(img, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def diamond(
    img: list[list[tuple[int, int, int, int]]],
    cx: int,
    cy: int,
    radius: int,
    color: tuple[int, int, int, int],
) -> None:
    for yy in range(cy - radius, cy + radius + 1):
        span = radius - abs(cy - yy)
        for xx in range(cx - span, cx + span + 1):
            set_px(img, xx, yy, color)


def circle(
    img: list[list[tuple[int, int, int, int]]],
    cx: int,
    cy: int,
    radius: int,
    color: tuple[int, int, int, int],
) -> None:
    r2 = radius * radius
    for yy in range(cy - radius, cy + radius + 1):
        for xx in range(cx - radius, cx + radius + 1):
            if (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= r2:
                set_px(img, xx, yy, color)


def polygon_fill(
    img: list[list[tuple[int, int, int, int]]],
    points: list[tuple[int, int]],
    color: tuple[int, int, int, int],
) -> None:
    min_y = max(min(y for _, y in points), 0)
    max_y = min(max(y for _, y in points), HEIGHT - 1)
    for y in range(min_y, max_y + 1):
        xs: list[int] = []
        for i, (x0, y0) in enumerate(points):
            x1, y1 = points[(i + 1) % len(points)]
            if y0 == y1:
                continue
            if (y >= min(y0, y1)) and (y < max(y0, y1)):
                xs.append(int(x0 + (y - y0) * (x1 - x0) / (y1 - y0)))
        xs.sort()
        for left, right in zip(xs[0::2], xs[1::2]):
            for x in range(left, right + 1):
                set_px(img, x, y, color)


def draw_scene() -> list[list[tuple[int, int, int, int]]]:
    img = blank()

    rect(img, 0, 0, WIDTH, HEIGHT, NIGHT)
    rect(img, 0, 48, WIDTH, 80, DEEP)
    for y in range(54, 126, 8):
        for x in range((y // 2) % 12, 128, 22):
            rect(img, x, y, 10, 1, WATER)
    for y in range(64, 122, 12):
        for x in range((y // 3) % 18, 128, 30):
            rect(img, x, y, 6, 1, WATER_LIGHT)

    # Distant dock wall and marker lamps.
    rect(img, 8, 42, 112, 6, DOCK_DARK)
    for x in range(12, 118, 16):
        rect(img, x, 39, 4, 10, DOCK)
        rect(img, x + 1, 37, 2, 2, LAMP)
        rect(img, x, 36, 4, 1, LAMP_DIM)

    # Dry dock pier.
    rect(img, 8, 88, 92, 11, DOCK)
    rect(img, 8, 97, 92, 6, DOCK_DARK)
    for x in range(14, 98, 12):
        rect(img, x, 86, 3, 20, DOCK_DARK)
        rect(img, x + 1, 86, 1, 20, ROPE)
    for x in range(10, 100, 10):
        rect(img, x, 91, 6, 1, ROPE)

    # Small review vessel carrying a scope document.
    polygon_fill(img, [(30, 70), (75, 70), (66, 87), (38, 87)], HULL)
    polygon_fill(img, [(38, 87), (66, 87), (60, 92), (44, 92)], HULL_DARK)
    rect(img, 43, 58, 22, 14, PAPER)
    rect(img, 47, 62, 12, 2, PAPER_SHADE)
    rect(img, 47, 67, 7, 2, PAPER_SHADE)
    line(img, 58, 64, 62, 68, CHECK)
    line(img, 62, 68, 69, 58, CHECK)
    rect(img, 35, 66, 8, 4, WINDOW)
    rect(img, 75, 72, 5, 8, ROPE)

    # Proof buoys mark the route into the dock.
    for bx, by in [(20, 62), (88, 58), (106, 73)]:
        diamond(img, bx, by, 5, BUOY)
        rect(img, bx - 2, by - 1, 4, 2, BUOY_LIGHT)
        rect(img, bx - 1, by + 5, 2, 7, ROPE)

    # Payout crane and suspended coin.
    rect(img, 101, 48, 6, 49, CRANE_DARK)
    rect(img, 97, 45, 26, 5, CRANE)
    rect(img, 116, 50, 2, 19, CRANE)
    line(img, 100, 50, 121, 64, CRANE_DARK)
    circle(img, 117, 76, 8, COIN_DARK)
    circle(img, 117, 74, 7, COIN)
    rect(img, 114, 69, 2, 9, COIN_DARK)
    rect(img, 119, 69, 2, 9, COIN_DARK)
    rect(img, 115, 73, 6, 2, COIN_DARK)

    # Review-light gantry.
    rect(img, 10, 22, 49, 5, DOCK_DARK)
    for i, color in enumerate([CHECK, LAMP, COIN, BUOY_LIGHT]):
        rect(img, 15 + i * 10, 18, 5, 5, color)
        rect(img, 16 + i * 10, 19, 3, 3, (255, 255, 255, 90))
    rect(img, 12, 27, 3, 18, DOCK_DARK)
    rect(img, 55, 27, 3, 18, DOCK_DARK)

    # Pixel stars and small signal ticks.
    for x, y, color in [
        (9, 9, LAMP),
        (29, 13, COIN),
        (52, 7, LAMP_DIM),
        (84, 14, PAPER),
        (112, 11, CHECK),
        (119, 31, LAMP),
        (74, 30, BUOY_LIGHT),
    ]:
        rect(img, x, y, 2, 2, color)
    for x in [18, 32, 48, 74, 90, 112]:
        rect(img, x, 110 + (x % 3), 7, 1, WATER_LIGHT)
    rect(img, 0, 0, WIDTH, 3, INK)
    rect(img, 0, 125, WIDTH, 3, INK)
    rect(img, 0, 0, 3, HEIGHT, INK)
    rect(img, 125, 0, 3, HEIGHT, INK)
    return img


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    return (
        struct.pack(">I", len(payload))
        + kind
        + payload
        + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
    )


def write_png(path: Path, img: list[list[tuple[int, int, int, int]]]) -> None:
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))
    payload = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            png_chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0)),
            png_chunk(b"IDAT", zlib.compress(bytes(raw), 9)),
            png_chunk(b"IEND", b""),
        ],
    )
    path.write_bytes(payload)


if __name__ == "__main__":
    write_png(OUT, draw_scene())
    print(OUT)
