#!/usr/bin/env python3
"""Generate the original pixel-art asset for bounty #80."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/han-river-payout-grid.png")

PALETTE = {
    "sky0": (8, 10, 28),
    "sky1": (14, 18, 44),
    "sky2": (21, 28, 62),
    "river0": (8, 34, 48),
    "river1": (11, 54, 67),
    "river2": (21, 84, 91),
    "bridge": (72, 78, 96),
    "bridge_dark": (42, 48, 66),
    "rail": (152, 162, 178),
    "window": (255, 206, 92),
    "cyan": (64, 218, 220),
    "blue": (70, 122, 246),
    "pink": (238, 97, 166),
    "orange": (246, 136, 64),
    "green": (96, 226, 145),
    "white": (228, 238, 241),
    "shadow": (5, 7, 16),
}


def chunk(kind: bytes, payload: bytes) -> bytes:
    return (
        struct.pack(">I", len(payload))
        + kind
        + payload
        + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
    )


def put(canvas: list[list[tuple[int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = PALETTE[color]


def rect(
    canvas: list[list[tuple[int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: str,
) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(canvas, xx, yy, color)


def line_blocks(
    canvas: list[list[tuple[int, int, int]]],
    start: tuple[int, int],
    end: tuple[int, int],
    color: str,
    size: int = 2,
) -> None:
    x0, y0 = start
    x1, y1 = end
    steps = max(abs(x1 - x0), abs(y1 - y0))
    for i in range(steps + 1):
        t = i / steps if steps else 0
        x = round(x0 + (x1 - x0) * t)
        y = round(y0 + (y1 - y0) * t)
        rect(canvas, x, y, size, size, color)


def draw_packet(
    canvas: list[list[tuple[int, int, int]]], x: int, y: int, color: str
) -> None:
    rect(canvas, x, y, 8, 6, "shadow")
    rect(canvas, x + 1, y + 1, 6, 4, color)
    rect(canvas, x + 2, y + 2, 2, 1, "white")


def draw_coin(canvas: list[list[tuple[int, int, int]]], x: int, y: int) -> None:
    rect(canvas, x + 2, y, 6, 2, "window")
    rect(canvas, x, y + 2, 10, 6, "window")
    rect(canvas, x + 2, y + 8, 6, 2, "window")
    rect(canvas, x + 3, y + 3, 4, 4, "orange")


def draw_check(canvas: list[list[tuple[int, int, int]]], x: int, y: int) -> None:
    rect(canvas, x, y + 5, 2, 2, "green")
    rect(canvas, x + 2, y + 7, 2, 2, "green")
    rect(canvas, x + 4, y + 5, 2, 2, "green")
    rect(canvas, x + 6, y + 3, 2, 2, "green")
    rect(canvas, x + 8, y + 1, 2, 2, "green")


def build_canvas() -> list[list[tuple[int, int, int]]]:
    canvas = [[PALETTE["sky0"] for _ in range(WIDTH)] for _ in range(HEIGHT)]

    for y in range(0, 72):
        color = "sky0" if y < 24 else "sky1" if y < 48 else "sky2"
        rect(canvas, 0, y, WIDTH, 1, color)

    # Moonlit skyline.
    rect(canvas, 92, 10, 16, 16, "window")
    rect(canvas, 96, 10, 12, 12, "sky1")
    buildings = [
        (4, 42, 10, 28),
        (18, 34, 9, 36),
        (31, 45, 14, 25),
        (52, 36, 12, 34),
        (68, 46, 16, 24),
        (88, 38, 10, 32),
        (103, 44, 8, 26),
        (116, 31, 8, 39),
    ]
    for x, y, w, h in buildings:
        rect(canvas, x, y, w, h, "shadow")
        for wy in range(y + 4, y + h - 2, 7):
            for wx in range(x + 2, x + w - 2, 5):
                if (wx + wy) % 3:
                    rect(canvas, wx, wy, 2, 2, "window")

    # River and reflections.
    rect(canvas, 0, 72, WIDTH, 56, "river0")
    for y in range(78, 128, 8):
        color = "river1" if (y // 8) % 2 else "river2"
        for x in range((y * 3) % 11, WIDTH, 18):
            rect(canvas, x, y, 10, 2, color)
    for x in range(18, 112, 16):
        rect(canvas, x, 74, 3, 18, "window")
        rect(canvas, x + 1, 92, 1, 10, "orange")

    # Settlement bridge/control deck.
    rect(canvas, 0, 82, WIDTH, 8, "bridge_dark")
    rect(canvas, 0, 86, WIDTH, 4, "bridge")
    rect(canvas, 14, 90, 4, 28, "bridge_dark")
    rect(canvas, 46, 90, 4, 30, "bridge_dark")
    rect(canvas, 78, 90, 4, 30, "bridge_dark")
    rect(canvas, 110, 90, 4, 28, "bridge_dark")
    line_blocks(canvas, (4, 96), (124, 78), "rail", 2)
    line_blocks(canvas, (4, 104), (124, 88), "rail", 2)

    # Data/payment rails.
    line_blocks(canvas, (12, 65), (57, 82), "cyan", 2)
    line_blocks(canvas, (16, 75), (58, 85), "blue", 2)
    line_blocks(canvas, (68, 82), (111, 62), "pink", 2)
    line_blocks(canvas, (70, 87), (115, 75), "orange", 2)

    # Central settlement grid.
    rect(canvas, 48, 58, 32, 28, "shadow")
    rect(canvas, 50, 60, 28, 24, "sky2")
    rect(canvas, 54, 64, 20, 4, "cyan")
    rect(canvas, 54, 72, 6, 6, "green")
    rect(canvas, 62, 72, 6, 6, "window")
    rect(canvas, 70, 72, 4, 6, "pink")
    for x in range(52, 78, 6):
        rect(canvas, x, 80, 4, 2, "rail")

    # Incoming work packets and outgoing payout coins.
    draw_packet(canvas, 10, 58, "blue")
    draw_packet(canvas, 20, 66, "cyan")
    draw_packet(canvas, 32, 72, "green")
    draw_check(canvas, 83, 55)
    draw_coin(canvas, 101, 58)
    draw_coin(canvas, 113, 70)

    # Pixel sparkles.
    for x, y, color in [
        (24, 18, "cyan"),
        (42, 24, "pink"),
        (73, 18, "green"),
        (112, 25, "window"),
        (12, 24, "white"),
        (86, 30, "blue"),
    ]:
        rect(canvas, x, y, 2, 2, color)

    return canvas


def write_png(canvas: list[list[tuple[int, int, int]]], path: Path) -> None:
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), level=9))
    png += chunk(b"IEND", b"")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def main() -> None:
    write_png(build_canvas(), OUT)
    print(f"Wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
