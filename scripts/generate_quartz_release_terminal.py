#!/usr/bin/env python3
"""Generate the Quartz Release Terminal pixel-art bounty asset."""

from pathlib import Path
import struct
import zlib


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/quartz-release-terminal.png")

PALETTE = {
    "void": (9, 12, 27),
    "panel": (21, 28, 55),
    "panel_hi": (38, 52, 89),
    "ink": (67, 86, 130),
    "quartz": (224, 235, 255),
    "quartz_mid": (141, 186, 232),
    "quartz_shadow": (78, 121, 174),
    "mint": (91, 235, 176),
    "amber": (255, 198, 91),
    "rose": (255, 107, 133),
    "violet": (161, 124, 255),
    "blue": (58, 159, 255),
}


def blank():
    return [[PALETTE["void"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(img, x, y, w, h, color):
    rgb = PALETTE[color]
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        row = img[yy]
        for xx in range(max(0, x), min(WIDTH, x + w)):
            row[xx] = rgb


def line(img, x0, y0, x1, y1, color):
    rgb = PALETTE[color]
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy

    while True:
        if 0 <= x0 < WIDTH and 0 <= y0 < HEIGHT:
            img[y0][x0] = rgb
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def diamond(img, cx, cy, r, fill, edge):
    for y in range(cy - r, cy + r + 1):
        span = r - abs(cy - y)
        for x in range(cx - span, cx + span + 1):
            if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                img[y][x] = PALETTE[edge if abs(cx - x) + abs(cy - y) == r else fill]


def write_png(path, img):
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def main():
    img = blank()

    for offset, color in [(0, "panel"), (4, "panel_hi"), (8, "panel")]:
        rect(img, 12 + offset, 16 + offset, 104 - 2 * offset, 92 - 2 * offset, color)

    rect(img, 20, 24, 88, 8, "ink")
    rect(img, 108, 24, 4, 8, "mint")
    rect(img, 20, 96, 88, 8, "ink")
    rect(img, 108, 96, 4, 8, "amber")

    diamond(img, 64, 61, 24, "quartz_mid", "quartz")
    diamond(img, 64, 61, 14, "quartz", "quartz_shadow")
    rect(img, 60, 45, 8, 33, "quartz")
    rect(img, 50, 57, 29, 8, "quartz")
    rect(img, 63, 37, 3, 49, "quartz_shadow")

    nodes = [
        (24, 42, "mint"),
        (35, 80, "blue"),
        (94, 42, "amber"),
        (104, 80, "rose"),
        (64, 100, "violet"),
    ]
    for x, y, color in nodes:
        rect(img, x - 4, y - 4, 8, 8, color)
        rect(img, x - 2, y - 2, 4, 4, "quartz")
        line(img, x, y, 64, 61, color)

    for x in range(18, 112, 12):
        rect(img, x, 35, 4, 3, "blue" if x % 24 else "mint")
        rect(img, x, 89, 4, 3, "amber" if x % 24 else "violet")

    for y in range(26, 102, 10):
        rect(img, 16, y, 3, 4, "ink")
        rect(img, 110, y + 3, 3, 4, "ink")

    rect(img, 30, 111, 68, 5, "quartz_shadow")
    rect(img, 40, 116, 48, 4, "ink")
    rect(img, 52, 121, 24, 3, "panel_hi")

    write_png(OUT, img)


if __name__ == "__main__":
    main()
