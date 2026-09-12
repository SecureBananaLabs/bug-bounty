#!/usr/bin/env python3
"""Generate original pixel art for bounty issue #80.

The image is written without third-party dependencies so the asset can be
reproduced from a clean Python installation.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/bounty-metro-map.png")


PALETTE = {
    "ink": (13, 18, 30),
    "deep": (22, 31, 50),
    "grid": (37, 52, 82),
    "muted": (80, 102, 136),
    "paper": (222, 229, 236),
    "gold": (248, 192, 67),
    "lime": (72, 214, 141),
    "cyan": (77, 203, 234),
    "rose": (242, 93, 124),
    "violet": (166, 120, 255),
    "orange": (247, 132, 76),
    "blue": (92, 143, 255),
    "shadow": (8, 12, 22),
}


pixels = [[PALETTE["ink"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(x: int, y: int, w: int, h: int, color: tuple[int, int, int]) -> None:
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        for xx in range(max(0, x), min(WIDTH, x + w)):
            pixels[yy][xx] = color


def line_h(x1: int, x2: int, y: int, color: tuple[int, int, int], thick: int = 3) -> None:
    rect(min(x1, x2), y - thick // 2, abs(x2 - x1) + 1, thick, color)


def line_v(x: int, y1: int, y2: int, color: tuple[int, int, int], thick: int = 3) -> None:
    rect(x - thick // 2, min(y1, y2), thick, abs(y2 - y1) + 1, color)


def station(x: int, y: int, color: tuple[int, int, int]) -> None:
    rect(x - 4, y - 4, 9, 9, PALETTE["paper"])
    rect(x - 3, y - 3, 7, 7, color)
    rect(x - 1, y - 1, 3, 3, PALETTE["ink"])


def ticket(x: int, y: int, color: tuple[int, int, int]) -> None:
    rect(x, y, 19, 13, PALETTE["paper"])
    rect(x + 2, y + 2, 15, 9, color)
    rect(x + 5, y + 5, 9, 2, PALETTE["paper"])


def draw_background() -> None:
    rect(0, 0, WIDTH, HEIGHT, PALETTE["ink"])
    rect(7, 7, 114, 114, PALETTE["deep"])
    rect(10, 10, 108, 108, PALETTE["ink"])
    for x in range(14, 116, 8):
        rect(x, 12, 1, 104, PALETTE["grid"])
    for y in range(14, 116, 8):
        rect(12, y, 104, 1, PALETTE["grid"])
    rect(12, 12, 104, 1, PALETTE["muted"])
    rect(12, 115, 104, 1, PALETTE["muted"])
    rect(12, 12, 1, 104, PALETTE["muted"])
    rect(115, 12, 1, 104, PALETTE["muted"])


def draw_routes() -> None:
    line_h(24, 56, 35, PALETTE["cyan"], 5)
    line_v(56, 35, 73, PALETTE["cyan"], 5)
    line_h(56, 100, 73, PALETTE["cyan"], 5)

    line_v(31, 33, 90, PALETTE["rose"], 5)
    line_h(31, 72, 90, PALETTE["rose"], 5)
    line_v(72, 54, 90, PALETTE["rose"], 5)

    line_h(23, 98, 55, PALETTE["gold"], 5)
    line_v(98, 55, 94, PALETTE["gold"], 5)

    for x, y, c in (
        (24, 35, PALETTE["blue"]),
        (56, 35, PALETTE["cyan"]),
        (56, 73, PALETTE["lime"]),
        (100, 73, PALETTE["orange"]),
        (31, 90, PALETTE["rose"]),
        (72, 90, PALETTE["violet"]),
        (72, 55, PALETTE["gold"]),
        (98, 55, PALETTE["gold"]),
        (98, 94, PALETTE["lime"]),
    ):
        station(x, y, c)


def draw_icons() -> None:
    ticket(17, 20, PALETTE["blue"])
    ticket(88, 87, PALETTE["lime"])

    # Checkmark.
    rect(89, 35, 5, 5, PALETTE["lime"])
    rect(94, 40, 5, 5, PALETTE["lime"])
    rect(99, 31, 5, 14, PALETTE["lime"])
    rect(104, 26, 5, 5, PALETTE["lime"])

    # Pull request fork shape.
    rect(43, 100, 5, 5, PALETTE["violet"])
    rect(60, 100, 5, 5, PALETTE["violet"])
    line_h(47, 61, 102, PALETTE["violet"], 3)
    line_v(52, 86, 102, PALETTE["violet"], 3)
    station(52, 84, PALETTE["violet"])

    # Small payout coin stack.
    rect(83, 17, 23, 5, PALETTE["gold"])
    rect(80, 22, 29, 5, PALETTE["orange"])
    rect(83, 27, 23, 5, PALETTE["gold"])
    rect(88, 19, 3, 11, PALETTE["paper"])
    rect(99, 19, 3, 11, PALETTE["paper"])

    # Four status lights.
    for i, color in enumerate((PALETTE["blue"], PALETTE["cyan"], PALETTE["violet"], PALETTE["lime"])):
        rect(19 + i * 12, 110, 7, 4, color)
        rect(19 + i * 12, 114, 7, 2, PALETTE["shadow"])


def write_png(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw_rows = []
    for row in pixels:
        raw_rows.append(b"\x00" + b"".join(bytes(px) for px in row))
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
    png += chunk("IDAT".encode(), zlib.compress(raw, level=9))
    png += chunk("IEND".encode(), b"")
    path.write_bytes(png)


def main() -> None:
    draw_background()
    draw_routes()
    draw_icons()
    write_png(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
