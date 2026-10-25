from __future__ import annotations

import argparse
import struct
import zlib
from pathlib import Path


SIZE = 128

PALETTE = {
    "bg": (14, 17, 32, 255),
    "bg2": (20, 26, 49, 255),
    "grid": (30, 40, 73, 255),
    "grid_hi": (44, 58, 98, 255),
    "frame_shadow": (47, 35, 38, 255),
    "frame": (111, 80, 64, 255),
    "frame_hi": (191, 137, 91, 255),
    "gold": (244, 194, 74, 255),
    "gold_hi": (255, 231, 127, 255),
    "cyan": (68, 213, 221, 255),
    "mint": (99, 230, 166, 255),
    "violet": (169, 129, 255, 255),
    "rose": (245, 111, 150, 255),
    "orange": (255, 145, 75, 255),
    "blue": (83, 144, 255, 255),
    "white": (238, 242, 255, 255),
    "dark": (8, 10, 20, 255),
}


def canvas() -> list[list[tuple[int, int, int, int]]]:
    return [[PALETTE["bg"] for _ in range(SIZE)] for _ in range(SIZE)]


def put(img, x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        img[y][x] = color


def fill(img, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(img, xx, yy, color)


def rect(img, x, y, w, h, color):
    for xx in range(x, x + w):
        put(img, xx, y, color)
        put(img, xx, y + h - 1, color)
    for yy in range(y, y + h):
        put(img, x, yy, color)
        put(img, x + w - 1, yy, color)


def line(img, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(img, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def glow_square(img, x, y, color, hi=None):
    hi = hi or PALETTE["white"]
    fill(img, x - 2, y - 2, 8, 8, PALETTE["bg2"])
    rect(img, x - 1, y - 1, 6, 6, color)
    fill(img, x + 1, y + 1, 2, 2, hi)


def diamond(img, cx, cy, radius, color, hi):
    for offset in range(radius + 1):
        width = radius - offset
        fill(img, cx - width, cy - offset, width * 2 + 1, 1, color)
        fill(img, cx - width, cy + offset, width * 2 + 1, 1, color)
    put(img, cx, cy - radius + 1, hi)
    put(img, cx + 1, cy - radius + 2, hi)


def make_art():
    img = canvas()

    for y in range(0, SIZE, 8):
        for x in range(SIZE):
            put(img, x, y, PALETTE["grid"])
    for x in range(0, SIZE, 8):
        for y in range(SIZE):
            put(img, x, y, PALETTE["grid"])
    for y in range(4, SIZE, 16):
        for x in range(4, SIZE, 16):
            put(img, x, y, PALETTE["grid_hi"])

    stars = [(11, 18), (23, 9), (39, 20), (73, 12), (95, 18), (116, 9), (7, 74), (120, 74)]
    for x, y in stars:
        put(img, x, y, PALETTE["gold_hi"])
        put(img, x + 1, y, PALETTE["white"])

    fill(img, 13, 106, 102, 9, PALETTE["dark"])
    rect(img, 12, 105, 104, 11, PALETTE["grid_hi"])
    for x in range(17, 111, 8):
        fill(img, x, 109, 4, 2, PALETTE["gold"])

    fill(img, 18, 22, 7, 88, PALETTE["frame_shadow"])
    fill(img, 103, 22, 7, 88, PALETTE["frame_shadow"])
    fill(img, 21, 20, 8, 90, PALETTE["frame"])
    fill(img, 99, 20, 8, 90, PALETTE["frame"])
    fill(img, 20, 18, 88, 8, PALETTE["frame"])
    fill(img, 20, 101, 88, 8, PALETTE["frame"])
    fill(img, 24, 21, 80, 2, PALETTE["frame_hi"])
    fill(img, 24, 104, 80, 2, PALETTE["frame_hi"])

    warp_colors = [PALETTE["gold"], PALETTE["cyan"], PALETTE["mint"], PALETTE["violet"], PALETTE["orange"]]
    for i, x in enumerate(range(35, 94, 7)):
        color = warp_colors[i % len(warp_colors)]
        line(img, x, 27, x, 100, color)
        if i % 2:
            line(img, x + 1, 27, x + 1, 100, PALETTE["grid_hi"])

    thread_rows = [
        (34, PALETTE["cyan"]),
        (45, PALETTE["mint"]),
        (56, PALETTE["violet"]),
        (67, PALETTE["rose"]),
        (78, PALETTE["orange"]),
        (89, PALETTE["gold"]),
    ]
    for idx, (y, color) in enumerate(thread_rows):
        line(img, 26, y, 101, y, color)
        line(img, 27, y + 1, 100, y + 1, PALETTE["bg2"])
        for x in range(33 + (idx % 2) * 5, 99, 18):
            fill(img, x, y - 2, 5, 5, color)
            put(img, x + 1, y - 1, PALETTE["white"])

    diamond(img, 64, 61, 13, PALETTE["blue"], PALETTE["white"])
    fill(img, 56, 59, 17, 5, PALETTE["gold"])
    fill(img, 59, 56, 11, 11, PALETTE["gold_hi"])
    fill(img, 63, 54, 3, 15, PALETTE["white"])

    nodes = [
        (22, 34, PALETTE["cyan"]),
        (106, 45, PALETTE["mint"]),
        (22, 56, PALETTE["violet"]),
        (106, 78, PALETTE["orange"]),
        (22, 89, PALETTE["gold"]),
    ]
    for x, y, color in nodes:
        glow_square(img, x, y, color)
    line(img, 26, 36, 36, 42, PALETTE["cyan"])
    line(img, 102, 47, 92, 52, PALETTE["mint"])
    line(img, 26, 58, 41, 66, PALETTE["violet"])
    line(img, 102, 80, 91, 72, PALETTE["orange"])
    line(img, 26, 91, 45, 83, PALETTE["gold"])

    fill(img, 48, 113, 32, 5, PALETTE["frame_shadow"])
    fill(img, 51, 111, 26, 5, PALETTE["frame"])
    for x in range(54, 76, 5):
        fill(img, x, 112, 3, 3, PALETTE["gold_hi"])

    rect(img, 10, 10, 108, 108, PALETTE["grid_hi"])
    rect(img, 11, 11, 106, 106, PALETTE["dark"])
    return img


def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + chunk_type
        + data
        + struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, img):
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))
    payload = b"\x89PNG\r\n\x1a\n"
    payload += png_chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
    payload += png_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    payload += png_chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def main():
    parser = argparse.ArgumentParser(description="Generate Codex verification loom pixel art.")
    parser.add_argument(
        "--out",
        default="assets/pixel-art/codex-verification-loom.png",
        help="PNG output path.",
    )
    args = parser.parse_args()
    out = Path(args.out)
    write_png(out, make_art())
    print(f"Wrote {out} ({SIZE}x{SIZE})")


if __name__ == "__main__":
    main()
