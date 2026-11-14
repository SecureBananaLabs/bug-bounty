from __future__ import annotations

import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pixel-art" / "handoff-relay.png"
CELL = 4
GRID = 32
SIZE = CELL * GRID

TRANSPARENT = (0, 0, 0, 0)
INK = (19, 25, 41, 255)
NAVY = (28, 36, 61, 255)
NIGHT = (12, 18, 34, 255)
GRID_BLUE = (43, 72, 105, 255)
TEAL = (68, 216, 180, 255)
MINT = (120, 244, 186, 255)
GOLD = (247, 185, 80, 255)
AMBER = (255, 222, 121, 255)
PINK = (237, 105, 171, 255)
VIOLET = (127, 100, 255, 255)
SKY = (91, 188, 255, 255)
WHITE = (239, 247, 255, 255)
SHADOW = (6, 10, 19, 255)


pixels = [[TRANSPARENT for _ in range(SIZE)] for _ in range(SIZE)]


def put_cell(x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if not (0 <= x < GRID and 0 <= y < GRID):
        return
    for py in range(y * CELL, (y + 1) * CELL):
        for px in range(x * CELL, (x + 1) * CELL):
            pixels[py][px] = color


def rect(x: int, y: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put_cell(xx, yy, color)


def line(points: list[tuple[int, int]], color: tuple[int, int, int, int]) -> None:
    for x, y in points:
        put_cell(x, y, color)


def circle(cx: int, cy: int, r: int, color: tuple[int, int, int, int]) -> None:
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                put_cell(x, y, color)


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path: Path) -> None:
    raw_rows = []
    for row in pixels:
        raw_rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))
    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    payload = zlib.compress(b"".join(raw_rows), 9)
    data = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", payload) + png_chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


# Background and floor grid.
rect(0, 0, GRID, GRID, NIGHT)
rect(0, 23, GRID, 9, INK)
for x in range(0, GRID, 4):
    rect(x, 23, 1, 9, GRID_BLUE)
for y in (25, 28, 31):
    rect(0, y, GRID, 1, GRID_BLUE)

# Checkpoint booth and relay gate.
rect(3, 8, 8, 15, SHADOW)
rect(4, 7, 8, 15, NAVY)
rect(5, 9, 6, 4, SKY)
rect(6, 10, 4, 2, WHITE)
rect(4, 18, 8, 2, VIOLET)
rect(12, 7, 2, 16, TEAL)
rect(23, 7, 2, 16, TEAL)
rect(12, 6, 13, 2, MINT)
rect(14, 9, 9, 1, GRID_BLUE)
rect(15, 11, 7, 1, GRID_BLUE)
rect(16, 13, 5, 1, GRID_BLUE)

# Status lights: scope, proof, review, payout.
for i, color in enumerate((SKY, TEAL, PINK, GOLD)):
    circle(15 + i * 2, 5, 1, color)
    put_cell(15 + i * 2, 5, WHITE)

# Courier.
circle(17, 17, 2, GOLD)
rect(16, 19, 3, 4, VIOLET)
rect(15, 21, 1, 3, SKY)
rect(19, 21, 1, 3, SKY)
rect(15, 23, 2, 1, SHADOW)
rect(18, 23, 2, 1, SHADOW)
rect(20, 18, 4, 3, AMBER)
rect(21, 19, 2, 1, WHITE)
line([(22, 19), (23, 18), (24, 17)], MINT)

# Package path and review markers.
line([(9, 18), (10, 17), (11, 16), (12, 15), (13, 15), (14, 15)], TEAL)
line([(24, 17), (25, 16), (26, 15), (27, 15)], GOLD)
rect(26, 18, 3, 3, PINK)
line([(27, 20), (28, 19), (29, 18)], WHITE)

# Payout coin and proof ticks.
circle(7, 26, 3, GOLD)
circle(7, 26, 1, AMBER)
line([(6, 26), (7, 27), (9, 25)], WHITE)
rect(20, 27, 8, 2, TEAL)
rect(22, 26, 4, 1, MINT)
line([(20, 29), (21, 30), (22, 29), (23, 30), (24, 29), (25, 30), (26, 29), (27, 30)], SKY)

# Corner spark pixels.
for point, color in {
    (2, 3): TEAL,
    (6, 4): VIOLET,
    (27, 4): GOLD,
    (29, 8): PINK,
    (3, 28): SKY,
    (30, 25): MINT,
}.items():
    put_cell(*point, color)


if __name__ == "__main__":
    write_png(OUT)
    print(f"wrote {OUT.relative_to(ROOT)} ({SIZE}x{SIZE})")
