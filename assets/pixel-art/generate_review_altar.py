#!/usr/bin/env python3
"""Generate the review altar pixel-art bounty asset.

The script uses only the Python standard library so the PNG can be
recreated without installing image tooling.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 128
OUT = Path(__file__).with_name("review-altar.png")

BLACK = (8, 8, 7, 255)
ASH = (15, 14, 12, 255)
CHARCOAL = (24, 22, 19, 255)
OAK_DARK = (39, 28, 21, 255)
OAK = (68, 47, 31, 255)
OAK_LIGHT = (112, 78, 44, 255)
BRASS_DARK = (105, 74, 33, 255)
BRASS = (189, 139, 65, 255)
BRASS_LIGHT = (232, 178, 86, 255)
BONE = (215, 204, 177, 255)
SAGE = (76, 116, 98, 255)
MINT = (103, 186, 137, 255)
OXIDE = (128, 52, 39, 255)
INK = (5, 5, 5, 255)


def mix(a: tuple[int, int, int, int], b: tuple[int, int, int, int], t: float) -> tuple[int, int, int, int]:
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(4))  # type: ignore[return-value]


pixels = [[ASH for _ in range(SIZE)] for _ in range(SIZE)]


def set_px(x: int, y: int, colour: tuple[int, int, int, int]) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        pixels[y][x] = colour


def rect(x: int, y: int, w: int, h: int, colour: tuple[int, int, int, int]) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(xx, yy, colour)


def frame(x: int, y: int, w: int, h: int, colour: tuple[int, int, int, int]) -> None:
    rect(x, y, w, 1, colour)
    rect(x, y + h - 1, w, 1, colour)
    rect(x, y, 1, h, colour)
    rect(x + w - 1, y, 1, h, colour)


def line(x0: int, y0: int, x1: int, y1: int, colour: tuple[int, int, int, int]) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        set_px(x0, y0, colour)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def disc(cx: int, cy: int, radius: int, colour: tuple[int, int, int, int], dither: bool = False) -> None:
    r2 = radius * radius
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            dist = (x - cx) * (x - cx) + (y - cy) * (y - cy)
            if dist <= r2 and (not dither or (x + y + dist) % 3):
                set_px(x, y, colour)


def shade_rect(x: int, y: int, w: int, h: int, top: tuple[int, int, int, int], bottom: tuple[int, int, int, int]) -> None:
    for yy in range(h):
        t = yy / max(h - 1, 1)
        colour = mix(top, bottom, t)
        rect(x, y + yy, w, 1, colour)


# Charred timber wall.
for x in range(SIZE):
    plank = x // 16
    base = [ASH, CHARCOAL, OAK_DARK, ASH][plank % 4]
    for y in range(SIZE):
        grain = ((x * 19 + y * 7 + plank * 31) % 23) / 160
        pixels[y][x] = mix(base, OAK, grain)

for x in range(0, SIZE, 16):
    rect(x, 0, 1, SIZE, INK)
    rect(x + 15, 0, 1, SIZE, mix(OAK_DARK, BLACK, 0.35))

for y in range(9, 76, 11):
    for x in range(3, SIZE - 4, 5):
        if (x * 3 + y) % 17 < 8:
            set_px(x, y, mix(OAK_LIGHT, OAK, 0.45))

# Quiet material grid behind the altar.
for x in range(8, 121, 8):
    line(x, 92, 64, 56, mix(BRASS_DARK, ASH, 0.55))
for y in range(64, 121, 8):
    line(14, y, 114, y, mix(BRASS_DARK, ASH, 0.62))

# Low brass halo, intentionally pixel-stepped.
for r, colour in [(30, mix(BRASS, ASH, 0.72)), (24, mix(BRASS, ASH, 0.58)), (17, mix(BRASS_LIGHT, ASH, 0.48))]:
    disc(64, 55, r, colour, dither=True)

# Review altar plinth and blackened-oak slab.
shade_rect(20, 88, 88, 15, OAK, OAK_DARK)
rect(16, 101, 96, 10, OAK_DARK)
rect(12, 111, 104, 8, BLACK)
rect(22, 89, 84, 2, OAK_LIGHT)
rect(16, 101, 96, 1, BRASS_DARK)
rect(12, 111, 104, 1, BRASS)

rect(41, 35, 46, 56, BLACK)
shade_rect(43, 37, 42, 52, CHARCOAL, OAK_DARK)
frame(41, 35, 46, 56, BRASS_DARK)
frame(44, 38, 40, 50, mix(BRASS, ASH, 0.34))
rect(48, 82, 32, 3, BRASS)

# Central claim seal.
disc(64, 60, 15, BRASS_DARK)
disc(64, 60, 10, BLACK)
disc(64, 60, 7, mix(BRASS, OAK_LIGHT, 0.18))
rect(59, 55, 10, 10, BLACK)
rect(61, 57, 6, 6, MINT)
set_px(63, 59, BONE)
set_px(64, 59, BONE)
set_px(64, 60, BONE)
set_px(65, 60, BONE)

# Four workflow markers: scope, proof, merge, payout.
markers = [
    (31, 82, SAGE, "scope"),
    (48, 79, BONE, "proof"),
    (80, 79, MINT, "merge"),
    (97, 82, BRASS_LIGHT, "payout"),
]
for cx, cy, colour, name in markers:
    rect(cx - 4, cy - 3, 8, 6, BLACK)
    frame(cx - 4, cy - 3, 8, 6, colour)
    if name == "scope":
        set_px(cx, cy, colour)
        line(cx - 2, cy, cx + 2, cy, colour)
        line(cx, cy - 2, cx, cy + 2, colour)
    elif name == "proof":
        line(cx - 2, cy, cx - 1, cy + 1, colour)
        line(cx - 1, cy + 1, cx + 3, cy - 2, colour)
    elif name == "merge":
        line(cx - 3, cy + 1, cx, cy - 2, colour)
        line(cx, cy - 2, cx + 3, cy + 1, colour)
        line(cx, cy - 2, cx, cy + 3, colour)
    else:
        disc(cx, cy, 2, colour)
        set_px(cx, cy, BLACK)

# Signal conduits from markers into the central seal.
for cx, cy, colour, _ in markers:
    line(cx, cy - 4, 64, 68, mix(colour, ASH, 0.32))

# Evidence tablets on the altar face.
for i, x in enumerate([28, 42, 72, 86]):
    rect(x, 94, 10, 5, mix(OAK_LIGHT, BRASS_DARK, 0.4))
    rect(x + 1, 95, 8, 1, BLACK)
    if i % 2 == 0:
        rect(x + 2, 97, 4, 1, MINT)
    else:
        rect(x + 2, 97, 5, 1, BONE)

# Brass pin lights and restrained glow.
for x, y, colour in [(24, 106, MINT), (104, 106, MINT), (33, 116, BRASS_LIGHT), (95, 116, BRASS_LIGHT)]:
    disc(x, y, 3, mix(colour, ASH, 0.55), dither=True)
    set_px(x, y, colour)
    set_px(x + 1, y, colour)

# Tiny oxide cuts in the wood for warmth.
for x, y in [(18, 25), (102, 31), (10, 73), (118, 87), (35, 17), (89, 18)]:
    rect(x, y, 3, 1, OXIDE)
    rect(x + 1, y + 1, 2, 1, mix(OXIDE, BLACK, 0.25))


def png_bytes() -> bytes:
    raw_rows = []
    for row in pixels:
        raw_rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))
    data = zlib.compress(b"".join(raw_rows), level=9)

    def chunk(kind: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", data) + chunk(b"IEND", b"")


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(png_bytes())
    print(f"Wrote {OUT} ({SIZE}x{SIZE})")


if __name__ == "__main__":
    main()
