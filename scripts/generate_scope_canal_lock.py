#!/usr/bin/env python3
"""Generate deterministic pixel art for bounty #80 using only stdlib."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 64
SCALE = 2
OUT = Path("assets/pixel-art/scope-canal-lock.png")

PALETTE = {
    "bg": (13, 19, 33, 255),
    "grid": (23, 34, 55, 255),
    "star": (188, 222, 255, 255),
    "stone": (63, 75, 93, 255),
    "stone_hi": (104, 119, 139, 255),
    "stone_shadow": (34, 44, 64, 255),
    "water": (22, 121, 140, 255),
    "water_hi": (65, 207, 209, 255),
    "water_dark": (12, 76, 99, 255),
    "gate": (190, 133, 63, 255),
    "gate_hi": (246, 199, 101, 255),
    "gate_dark": (111, 74, 43, 255),
    "packet_a": (104, 241, 187, 255),
    "packet_b": (255, 205, 84, 255),
    "packet_c": (255, 127, 102, 255),
    "packet_d": (151, 171, 255, 255),
    "panel": (21, 29, 47, 255),
    "panel_hi": (74, 93, 128, 255),
    "coin": (251, 211, 102, 255),
    "coin_shadow": (172, 111, 49, 255),
    "ok": (69, 224, 159, 255),
}


def blank() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["bg"] for _ in range(SIZE)] for _ in range(SIZE)]


def set_px(img, x: int, y: int, color: str) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        img[y][x] = PALETTE[color]


def rect(img, x: int, y: int, w: int, h: int, color: str) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(img, xx, yy, color)


def outline_rect(img, x: int, y: int, w: int, h: int, fill: str, edge: str, hi: str | None = None) -> None:
    rect(img, x, y, w, h, fill)
    for xx in range(x, x + w):
        set_px(img, xx, y, edge)
        set_px(img, xx, y + h - 1, edge)
    for yy in range(y, y + h):
        set_px(img, x, yy, edge)
        set_px(img, x + w - 1, yy, edge)
    if hi:
        for xx in range(x + 1, x + w - 1):
            set_px(img, xx, y + 1, hi)


def line(img, x0: int, y0: int, x1: int, y1: int, color: str) -> None:
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


def draw_packet(img, x: int, y: int, color: str) -> None:
    outline_rect(img, x, y, 5, 4, color, "bg", "star")
    set_px(img, x + 3, y + 2, "bg")


def draw_check(img, x: int, y: int) -> None:
    set_px(img, x, y + 2, "ok")
    set_px(img, x + 1, y + 3, "ok")
    set_px(img, x + 2, y + 2, "ok")
    set_px(img, x + 3, y + 1, "ok")
    set_px(img, x + 4, y, "ok")


def draw_coin(img, x: int, y: int) -> None:
    rect(img, x + 1, y, 3, 1, "coin")
    rect(img, x, y + 1, 5, 3, "coin")
    rect(img, x + 1, y + 4, 3, 1, "coin_shadow")
    set_px(img, x + 3, y + 1, "gate_hi")


def draw_scene() -> list[list[tuple[int, int, int, int]]]:
    img = blank()

    for y in range(0, SIZE, 4):
        for x in range((y // 4) % 2 * 2, SIZE, 8):
            set_px(img, x, y, "grid")
    for x, y in [(8, 6), (54, 5), (49, 13), (14, 18), (58, 29), (7, 43)]:
        set_px(img, x, y, "star")

    # Canal walls and water channel.
    rect(img, 20, 5, 24, 54, "stone_shadow")
    rect(img, 23, 5, 18, 54, "water_dark")
    rect(img, 24, 6, 16, 52, "water")
    for y in range(8, 58, 4):
        line(img, 25, y, 38, y + 2, "water_hi")
    for y in range(7, 58, 6):
        set_px(img, 23, y, "stone_hi")
        set_px(img, 40, y + 1, "stone_hi")

    # Lock chambers and gates for scope, proof, review, merge, payout.
    for y in [9, 19, 29, 39, 49]:
        outline_rect(img, 19, y - 2, 26, 8, "stone", "stone_shadow", "stone_hi")
        rect(img, 23, y, 18, 4, "water")
        line(img, 21, y + 1, 42, y + 4, "gate_dark")
        line(img, 21, y, 42, y + 3, "gate")
        line(img, 23, y, 40, y + 2, "gate_hi")

    # Work packets moving through the lock.
    draw_packet(img, 29, 7, "packet_a")
    draw_packet(img, 31, 18, "packet_b")
    draw_packet(img, 28, 28, "packet_d")
    draw_packet(img, 32, 39, "packet_c")
    draw_packet(img, 29, 51, "packet_a")

    # Side control panels: checks on the left, payout coins on the right.
    outline_rect(img, 5, 12, 11, 31, "panel", "panel_hi")
    for idx, yy in enumerate([16, 22, 28, 34, 40]):
        rect(img, 8, yy, 3, 2, "grid")
        draw_check(img, 10, yy - 1)

    outline_rect(img, 48, 14, 10, 27, "panel", "panel_hi")
    for yy in [17, 24, 31]:
        draw_coin(img, 51, yy)

    # Small upstream/downstream arrows reinforce the flow.
    for y in [14, 24, 34, 44]:
        set_px(img, 31, y, "star")
        set_px(img, 30, y - 1, "water_hi")
        set_px(img, 32, y - 1, "water_hi")
        set_px(img, 31, y + 1, "water_hi")

    # Pixel frame.
    for x in range(1, 63):
        set_px(img, x, 1, "panel_hi")
        set_px(img, x, 62, "grid")
    for y in range(1, 63):
        set_px(img, 1, y, "panel_hi")
        set_px(img, 62, y, "grid")
    return img


def scale(img):
    scaled = []
    for row in img:
        wide = []
        for px in row:
            wide.extend([px] * SCALE)
        for _ in range(SCALE):
            scaled.append(wide[:])
    return scaled


def png_bytes(img) -> bytes:
    height = len(img)
    width = len(img[0])
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    return b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)),
            chunk(b"IDAT", zlib.compress(bytes(raw), level=9)),
            chunk(b"IEND", b""),
        ]
    )


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = scale(draw_scene())
    OUT.write_bytes(png_bytes(img))
    print(f"Wrote {OUT} ({len(img[0])}x{len(img)})")


if __name__ == "__main__":
    main()
