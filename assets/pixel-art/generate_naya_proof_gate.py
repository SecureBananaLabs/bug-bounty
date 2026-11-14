from __future__ import annotations

import os
import struct
import zlib


SIZE = 128
SCALE = 4
OUT = os.path.join(os.path.dirname(__file__), "naya-proof-gate.png")


PALETTE = {
    "bg": (10, 12, 22),
    "grid": (22, 40, 55),
    "deep": (16, 22, 34),
    "stone": (38, 54, 70),
    "stone_hi": (76, 100, 118),
    "cyan": (39, 232, 224),
    "cyan_dim": (22, 118, 132),
    "lime": (160, 255, 86),
    "amber": (255, 191, 82),
    "rose": (244, 78, 122),
    "violet": (127, 91, 255),
    "white": (234, 248, 255),
}


pixels = [[PALETTE["bg"] for _ in range(SIZE)] for _ in range(SIZE)]


def rect(x: int, y: int, w: int, h: int, color: str) -> None:
    rgb = PALETTE[color]
    for yy in range(max(0, y), min(SIZE, y + h)):
        row = pixels[yy]
        for xx in range(max(0, x), min(SIZE, x + w)):
            row[xx] = rgb


def line_h(y: int, x1: int, x2: int, color: str) -> None:
    rect(x1, y, x2 - x1 + 1, 1, color)


def line_v(x: int, y1: int, y2: int, color: str) -> None:
    rect(x, y1, 1, y2 - y1 + 1, color)


def glow_rect(x: int, y: int, w: int, h: int, core: str, halo: str) -> None:
    rect(x - 2, y - 2, w + 4, h + 4, halo)
    rect(x - 1, y - 1, w + 2, h + 2, "deep")
    rect(x, y, w, h, core)


def draw_scene() -> None:
    # Background code-grid horizon.
    for y in range(12, SIZE, 12):
        line_h(y, 0, SIZE - 1, "grid")
    for x in range(8, SIZE, 12):
        line_v(x, 0, SIZE - 1, "grid")

    # Perspective path tiles.
    for y in range(72, 122, 8):
        width = int((y - 64) * 1.45)
        x1 = SIZE // 2 - width // 2
        x2 = SIZE // 2 + width // 2
        line_h(y, x1, x2, "cyan_dim")
    for offset in [-26, -14, 0, 14, 26]:
        x = SIZE // 2 + offset
        for y in range(72, 124):
            drift = int((y - 72) * offset / 70)
            if 8 <= x + drift < SIZE - 8:
                pixels[y][x + drift] = PALETTE["cyan_dim"]

    # Hard-edged verification gate.
    rect(30, 38, 8, 52, "stone")
    rect(90, 38, 8, 52, "stone")
    rect(27, 34, 14, 6, "stone_hi")
    rect(87, 34, 14, 6, "stone_hi")
    glow_rect(22, 28, 84, 7, "cyan", "cyan_dim")
    glow_rect(28, 22, 72, 5, "violet", "grid")
    rect(36, 40, 56, 6, "deep")
    rect(40, 43, 48, 2, "amber")

    # Central verified mark.
    glow_rect(54, 52, 20, 20, "deep", "grid")
    rect(58, 61, 4, 4, "lime")
    rect(62, 65, 4, 4, "lime")
    rect(66, 57, 4, 4, "lime")
    rect(70, 53, 4, 4, "lime")
    rect(74, 49, 4, 4, "lime")
    rect(53, 51, 22, 2, "cyan")
    rect(53, 71, 22, 2, "cyan")
    rect(52, 52, 2, 20, "cyan")
    rect(74, 52, 2, 20, "cyan")

    # Small checksum beacons.
    for x, y, c in [(18, 52, "rose"), (110, 54, "amber"), (24, 86, "lime"), (104, 88, "violet")]:
        glow_rect(x, y, 5, 5, c, "grid")
        rect(x + 2, y - 6, 1, 4, c)

    # Pixel stars / proof bits.
    for x, y, c in [
        (14, 18, "cyan"),
        (37, 14, "white"),
        (68, 12, "amber"),
        (94, 16, "cyan"),
        (112, 25, "lime"),
        (17, 111, "white"),
        (111, 114, "rose"),
    ]:
        rect(x, y, 2, 2, c)

    # Foreground hard border.
    rect(0, 0, SIZE, 2, "cyan_dim")
    rect(0, SIZE - 2, SIZE, 2, "cyan_dim")
    rect(0, 0, 2, SIZE, "cyan_dim")
    rect(SIZE - 2, 0, 2, SIZE, "cyan_dim")


def write_png(path: str) -> None:
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)


if __name__ == "__main__":
    draw_scene()
    write_png(OUT)
    print(f"Wrote {OUT} ({SIZE}x{SIZE})")
