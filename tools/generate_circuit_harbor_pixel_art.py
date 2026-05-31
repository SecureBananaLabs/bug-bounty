from __future__ import annotations

import struct
import zlib
from pathlib import Path

WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/circuit-harbor-beacon.png")

PaletteColor = tuple[int, int, int]


def clamp_channel(value: int) -> int:
    return max(0, min(255, value))


def write_png(path: Path, pixels: list[list[PaletteColor]]) -> None:
    raw_rows = []
    for row in pixels:
        raw_rows.append(b"\x00" + bytes(channel for pixel in row for channel in pixel))
    raw = b"".join(raw_rows)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = [
        b"\x89PNG\r\n\x1a\n",
        chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)),
        chunk(b"IDAT", zlib.compress(raw, 9)),
        chunk(b"IEND", b""),
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"".join(png))


def rect(
    pixels: list[list[PaletteColor]],
    x: int,
    y: int,
    w: int,
    h: int,
    color: PaletteColor,
) -> None:
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        for xx in range(max(0, x), min(WIDTH, x + w)):
            pixels[yy][xx] = color


def line(
    pixels: list[list[PaletteColor]],
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    color: PaletteColor,
    thickness: int = 2,
) -> None:
    if x1 == x2:
        rect(pixels, x1, min(y1, y2), thickness, abs(y2 - y1) + thickness, color)
        return
    if y1 == y2:
        rect(pixels, min(x1, x2), y1, abs(x2 - x1) + thickness, thickness, color)
        return

    dx = 1 if x2 > x1 else -1
    dy = 1 if y2 > y1 else -1
    x, y = x1, y1
    while x != x2 or y != y2:
        rect(pixels, x, y, thickness, thickness, color)
        if x != x2:
            x += dx
        if y != y2:
            y += dy


def main() -> None:
    navy = (9, 16, 36)
    pixels = [[navy for _ in range(WIDTH)] for _ in range(HEIGHT)]

    # Blocky dusk gradient.
    for y in range(HEIGHT):
        band = y // 4
        shade = clamp_channel(22 + band * 2)
        blue = clamp_channel(46 + band * 3)
        for x in range(WIDTH):
            if y < 70:
                pixels[y][x] = (10 + band // 2, shade, blue)
            else:
                pixels[y][x] = (8, 36 + (x // 16), 58 + (band % 5) * 4)

    # Stars and distant signal buoys.
    stars = [
        (12, 12), (25, 28), (42, 16), (74, 9), (108, 22), (118, 40),
        (14, 48), (55, 33), (91, 36), (66, 52), (101, 8)
    ]
    for x, y in stars:
        rect(pixels, x, y, 2, 2, (244, 236, 170))
        if (x + y) % 3 == 0:
            rect(pixels, x - 1, y + 1, 4, 1, (158, 194, 198))

    # Harbor water rows.
    for y in range(76, 126, 6):
        offset = (y * 3) % 17
        for x in range(offset, WIDTH, 24):
            rect(pixels, x, y, 14, 2, (30, 108, 132))
            rect(pixels, x + 4, y + 2, 8, 1, (91, 173, 168))

    # Main dock as a circuit board pier.
    dock_dark = (35, 47, 64)
    dock = (88, 96, 97)
    copper = (226, 161, 77)
    glow = (255, 216, 104)
    aqua = (82, 223, 210)
    rect(pixels, 9, 95, 92, 12, dock_dark)
    rect(pixels, 12, 92, 86, 8, dock)
    for x in range(16, 95, 12):
        rect(pixels, x, 100, 4, 19, dock_dark)
        rect(pixels, x + 1, 100, 2, 19, (58, 70, 82))

    # Circuit lanes on the dock.
    line(pixels, 15, 96, 88, 96, copper, 2)
    line(pixels, 24, 93, 24, 84, aqua, 2)
    line(pixels, 43, 93, 43, 82, copper, 2)
    line(pixels, 62, 93, 62, 84, aqua, 2)
    line(pixels, 81, 93, 81, 76, copper, 2)
    for x, y in [(24, 84), (43, 82), (62, 84), (81, 76), (88, 96)]:
        rect(pixels, x - 2, y - 2, 6, 6, glow)
        rect(pixels, x, y, 2, 2, (255, 249, 188))

    # Work packets traveling toward the beacon.
    packets = [
        (16, 88, (106, 229, 255)),
        (35, 86, (253, 122, 154)),
        (54, 88, (147, 232, 131)),
        (73, 80, (255, 198, 94)),
    ]
    for x, y, color in packets:
        rect(pixels, x, y, 5, 5, color)
        rect(pixels, x + 1, y + 1, 3, 3, (255, 255, 230))

    # Beacon lighthouse at the end of the circuit pier.
    stone = (151, 159, 157)
    shadow = (83, 91, 104)
    red = (203, 67, 79)
    rect(pixels, 92, 61, 22, 45, shadow)
    rect(pixels, 96, 58, 17, 48, stone)
    rect(pixels, 94, 70, 22, 6, red)
    rect(pixels, 95, 88, 20, 6, red)
    rect(pixels, 98, 53, 13, 8, (57, 68, 82))
    rect(pixels, 101, 49, 7, 5, glow)
    rect(pixels, 103, 50, 3, 3, (255, 252, 218))
    rect(pixels, 93, 105, 24, 5, (43, 55, 70))

    # Pixelated light fan and review checkpoints.
    fan_colors = [(255, 230, 128), (244, 191, 93), (129, 216, 202)]
    for step, color in enumerate(fan_colors):
        line(pixels, 103, 51 + step, 75 - step * 10, 42 - step * 8, color, 2)
        line(pixels, 106, 52 + step, 124, 37 + step * 8, color, 2)
    for x, y in [(70, 40), (58, 34), (119, 37), (121, 53)]:
        rect(pixels, x - 1, y - 1, 5, 5, (248, 218, 123))
        rect(pixels, x, y, 3, 3, (255, 255, 224))

    # Foreground rocks and signature pixels.
    for x, y, w, h in [(2, 118, 18, 8), (26, 121, 12, 5), (102, 119, 25, 7)]:
        rect(pixels, x, y, w, h, (31, 38, 48))
        rect(pixels, x + 2, y, max(2, w - 5), 2, (69, 78, 83))

    rect(pixels, 4, 4, 6, 2, (82, 223, 210))
    rect(pixels, 4, 7, 10, 2, (226, 161, 77))

    write_png(OUT, pixels)
    print(f"Wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
