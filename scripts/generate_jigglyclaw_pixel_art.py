#!/usr/bin/env python3
"""Generate the Jigglyclaw bounty sentinel pixel-art PNG.

The output is deterministic and uses only the Python standard library so the
asset can be regenerated/reviewed without opaque image tooling.
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

SIZE = 128
SCALE = 1
OUT = Path(__file__).resolve().parents[1] / "assets" / "pixel-art" / "jigglyclaw-bounty-sentinel.png"

PALETTE = {
    "bg0": (11, 16, 32, 255),
    "bg1": (18, 25, 48, 255),
    "grid": (28, 49, 78, 255),
    "grid2": (17, 95, 118, 255),
    "cyan": (78, 224, 255, 255),
    "cyan2": (33, 156, 204, 255),
    "pink": (255, 105, 180, 255),
    "pink2": (205, 65, 135, 255),
    "shell": (235, 92, 130, 255),
    "shell_dark": (145, 43, 87, 255),
    "claw": (255, 145, 170, 255),
    "gold": (255, 204, 86, 255),
    "gold_dark": (178, 121, 43, 255),
    "green": (80, 255, 160, 255),
    "white": (239, 250, 255, 255),
    "black": (3, 7, 16, 255),
}

img = [[PALETTE["bg0"] for _ in range(SIZE)] for _ in range(SIZE)]

def setp(x: int, y: int, color: str) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        img[y][x] = PALETTE[color]

def rect(x0: int, y0: int, x1: int, y1: int, color: str) -> None:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            setp(x, y, color)

def ellipse(cx: int, cy: int, rx: int, ry: int, color: str) -> None:
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) * (x - cx)) * ry * ry + ((y - cy) * (y - cy)) * rx * rx <= rx * rx * ry * ry:
                setp(x, y, color)

def line(x0: int, y0: int, x1: int, y1: int, color: str) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        setp(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy

# background scan/grid
for y in range(SIZE):
    for x in range(SIZE):
        if (x + y) % 17 == 0:
            setp(x, y, "bg1")
for x in range(8, SIZE, 16):
    for y in range(12, 116):
        if y % 2 == 0:
            setp(x, y, "grid")
for y in range(16, SIZE, 16):
    for x in range(8, 120):
        if x % 2 == 0:
            setp(x, y, "grid")

# neon bounty frame
rect(13, 13, 114, 15, "cyan")
rect(13, 113, 114, 115, "cyan2")
rect(13, 13, 15, 114, "cyan2")
rect(113, 13, 115, 114, "cyan")
for i in range(5):
    setp(17 + i, 19 + i, "gold")
    setp(110 - i, 19 + i, "gold")
    setp(17 + i, 109 - i, "gold")
    setp(110 - i, 109 - i, "gold")

# payout coin / verified node
ellipse(64, 30, 15, 15, "gold_dark")
ellipse(64, 29, 12, 12, "gold")
rect(61, 20, 67, 23, "white")
rect(59, 25, 69, 28, "white")
rect(61, 30, 67, 33, "white")
rect(59, 35, 69, 38, "white")
line(56, 49, 41, 65, "grid2")
line(72, 49, 88, 65, "grid2")
line(64, 45, 64, 55, "green")

# Jigglyclaw lobster body
ellipse(64, 74, 22, 18, "shell_dark")
ellipse(64, 70, 20, 17, "shell")
ellipse(54, 63, 8, 9, "claw")
ellipse(74, 63, 8, 9, "claw")
rect(52, 72, 76, 82, "shell")
rect(57, 83, 71, 88, "shell_dark")
# shell segments
for y in (66, 71, 76):
    line(47, y, 81, y, "pink2")
# eyes
ellipse(57, 59, 3, 4, "white")
ellipse(71, 59, 3, 4, "white")
setp(58, 60, "black")
setp(72, 60, "black")
setp(56, 58, "cyan")
setp(70, 58, "cyan")
# antennae
line(55, 55, 41, 40, "pink")
line(73, 55, 87, 40, "pink")
setp(40, 39, "cyan")
setp(88, 39, "cyan")
# claws holding checkmarks
ellipse(38, 73, 10, 9, "shell_dark")
ellipse(35, 70, 7, 6, "claw")
ellipse(42, 69, 6, 6, "claw")
ellipse(90, 73, 10, 9, "shell_dark")
ellipse(86, 69, 6, 6, "claw")
ellipse(93, 70, 7, 6, "claw")
line(44, 67, 51, 65, "shell")
line(84, 67, 77, 65, "shell")
line(32, 78, 36, 83, "green")
line(36, 83, 45, 72, "green")
line(83, 77, 88, 82, "green")
line(88, 82, 98, 69, "green")
# legs
for sx in (-1, 1):
    for i, y in enumerate((78, 83, 88)):
        line(64 + sx * (8 + i * 4), y, 64 + sx * (23 + i * 5), y + 9, "pink2")
        setp(64 + sx * (24 + i * 5), y + 10, "cyan2")

# lower secure payout pad
rect(36, 99, 92, 106, "grid2")
rect(39, 96, 89, 101, "cyan2")
for x in range(43, 86, 7):
    rect(x, 98, x + 3, 101, "green" if x % 2 else "gold")
line(50, 111, 78, 111, "gold")

# Write PNG
OUT.parent.mkdir(parents=True, exist_ok=True)
raw = bytearray()
for row in img:
    raw.append(0)  # no filter
    for r, g, b, a in row:
        raw.extend((r, g, b, a))

def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += chunk(b"IEND", b"")
OUT.write_bytes(png)
print(OUT)
