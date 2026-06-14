#!/usr/bin/env python3
"""Generate the milestone koi pond pixel-art bounty asset."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/milestone-koi-pond.png")

PALETTE = {
    "ink": (18, 27, 35),
    "deep": (18, 49, 56),
    "water": (30, 92, 96),
    "water_hi": (45, 130, 123),
    "mint": (107, 184, 155),
    "foam": (170, 226, 198),
    "stone": (104, 126, 132),
    "stone_hi": (157, 178, 174),
    "stone_shadow": (57, 74, 82),
    "card": (223, 229, 210),
    "card_dark": (145, 154, 141),
    "banana": (245, 198, 67),
    "banana_hi": (255, 229, 118),
    "orange": (217, 117, 62),
    "coral": (225, 92, 86),
    "leaf": (58, 143, 83),
    "leaf_hi": (102, 188, 105),
    "pink": (231, 149, 176),
    "night": (12, 18, 28),
}


def new_canvas(color: tuple[int, int, int]) -> list[list[tuple[int, int, int]]]:
    return [[color for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_px(img, x: int, y: int, color: tuple[int, int, int]) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        img[y][x] = color


def rect(img, x: int, y: int, w: int, h: int, color: tuple[int, int, int]) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(img, xx, yy, color)


def ellipse(img, cx: int, cy: int, rx: int, ry: int, color: tuple[int, int, int]) -> None:
    rxs = rx * rx
    rys = ry * ry
    lim = rxs * rys
    for yy in range(cy - ry, cy + ry + 1):
        for xx in range(cx - rx, cx + rx + 1):
            if ((xx - cx) ** 2) * rys + ((yy - cy) ** 2) * rxs <= lim:
                set_px(img, xx, yy, color)


def line(img, x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int]) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
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


def outline_rect(img, x: int, y: int, w: int, h: int, color: tuple[int, int, int]) -> None:
    rect(img, x, y, w, 1, color)
    rect(img, x, y + h - 1, w, 1, color)
    rect(img, x, y, 1, h, color)
    rect(img, x + w - 1, y, 1, h, color)


def add_ripples(img) -> None:
    rings = [
        (32, 39, 12, 4),
        (57, 54, 14, 4),
        (83, 69, 15, 5),
        (55, 101, 20, 6),
        (95, 93, 15, 5),
    ]
    for cx, cy, rx, ry in rings:
        for offset in (0, 2):
            for x in range(cx - rx, cx + rx + 1, 2):
                yy = cy + (((x - cx) * (x - cx) * ry) // max(rx * rx, 1)) - ry + offset
                set_px(img, x, yy, PALETTE["water_hi"])
                set_px(img, x, cy + (cy - yy) + offset, PALETTE["water_hi"])


def add_work_cards(img) -> None:
    cards = [
        (15, 29, 21, 13, PALETTE["mint"]),
        (40, 42, 22, 13, PALETTE["banana"]),
        (67, 56, 22, 13, PALETTE["coral"]),
        (92, 70, 22, 13, PALETTE["foam"]),
    ]
    for x, y, w, h, accent in cards:
        rect(img, x + 2, y + 2, w, h, PALETTE["stone_shadow"])
        rect(img, x, y, w, h, PALETTE["card"])
        outline_rect(img, x, y, w, h, PALETTE["card_dark"])
        rect(img, x + 3, y + 3, w - 6, 2, accent)
        rect(img, x + 4, y + 7, w - 8, 1, PALETTE["card_dark"])
        rect(img, x + 4, y + 10, w - 11, 1, PALETTE["card_dark"])
    for start, end in [((36, 37), (40, 47)), ((62, 49), (67, 61)), ((89, 63), (92, 75))]:
        line(img, start[0], start[1], end[0], end[1], PALETTE["foam"])


def add_koi(img) -> None:
    ellipse(img, 67, 92, 23, 10, PALETTE["orange"])
    ellipse(img, 72, 90, 19, 8, PALETTE["banana"])
    ellipse(img, 76, 88, 12, 5, PALETTE["banana_hi"])
    ellipse(img, 48, 94, 8, 6, PALETTE["orange"])
    line(img, 44, 88, 52, 94, PALETTE["orange"])
    line(img, 45, 101, 52, 95, PALETTE["orange"])
    ellipse(img, 72, 103, 9, 5, PALETTE["banana"])
    ellipse(img, 77, 81, 7, 4, PALETTE["banana"])
    rect(img, 90, 89, 2, 2, PALETTE["night"])
    rect(img, 62, 87, 8, 3, PALETTE["coral"])
    rect(img, 80, 96, 7, 3, PALETTE["coral"])
    for x, y in [(58, 89), (67, 97), (78, 86), (85, 93)]:
        set_px(img, x, y, PALETTE["foam"])


def add_plants_and_fireflies(img) -> None:
    for cx, cy in [(21, 89), (31, 99), (102, 103), (111, 43)]:
        ellipse(img, cx, cy, 8, 4, PALETTE["leaf"])
        ellipse(img, cx + 2, cy - 1, 4, 2, PALETTE["leaf_hi"])
        rect(img, cx + 1, cy - 1, 2, 2, PALETTE["pink"])
    for x, y in [(22, 23), (52, 28), (73, 39), (96, 54), (107, 66), (36, 68), (30, 51)]:
        rect(img, x, y, 2, 2, PALETTE["banana_hi"])
        set_px(img, x - 1, y, PALETTE["mint"])
        set_px(img, x + 2, y + 1, PALETTE["mint"])


def add_border_and_texture(img) -> None:
    rect(img, 0, 0, WIDTH, 4, PALETTE["ink"])
    rect(img, 0, HEIGHT - 4, WIDTH, 4, PALETTE["ink"])
    rect(img, 0, 0, 4, HEIGHT, PALETTE["ink"])
    rect(img, WIDTH - 4, 0, 4, HEIGHT, PALETTE["ink"])
    rect(img, 5, 5, WIDTH - 10, 2, PALETTE["water_hi"])
    rect(img, 5, HEIGHT - 7, WIDTH - 10, 2, PALETTE["water_hi"])
    rect(img, 5, 5, 2, HEIGHT - 10, PALETTE["water_hi"])
    rect(img, WIDTH - 7, 5, 2, HEIGHT - 10, PALETTE["water_hi"])
    for y in range(8, HEIGHT - 8):
        for x in range(8, WIDTH - 8):
            if (x * 7 + y * 11) % 37 == 0:
                set_px(img, x, y, PALETTE["deep"])
            elif (x * 5 + y * 3) % 53 == 0:
                set_px(img, x, y, PALETTE["water"])


def write_png(path: Path, img) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw_rows = []
    for row in img:
        raw_rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))
    raw = b"".join(raw_rows)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk("IHDR".encode(), struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += chunk("IDAT".encode(), zlib.compress(raw, 9))
    png += chunk("IEND".encode(), b"")
    path.write_bytes(png)


def main() -> None:
    img = new_canvas(PALETTE["water"])
    add_border_and_texture(img)
    add_ripples(img)
    add_work_cards(img)
    add_koi(img)
    add_plants_and_fireflies(img)
    write_png(OUT, img)
    print(f"Wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
