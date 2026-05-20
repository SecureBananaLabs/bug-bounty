#!/usr/bin/env python3
"""Generate an original verification-kiln pixel-art asset."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 192

COLORS = {
    "bg_top": (7, 10, 23),
    "bg_mid": (13, 20, 38),
    "bg_low": (18, 29, 49),
    "grid": (28, 45, 74),
    "grid_dim": (17, 29, 52),
    "grid_hot": (54, 90, 132),
    "shadow": (3, 6, 14),
    "ink": (8, 12, 24),
    "panel": (31, 43, 62),
    "panel_dark": (20, 28, 43),
    "panel_light": (77, 94, 124),
    "stone": (81, 91, 113),
    "stone_dark": (44, 52, 72),
    "stone_light": (132, 143, 164),
    "steel": (101, 119, 148),
    "steel_dark": (48, 61, 83),
    "coal": (19, 17, 23),
    "ember_dark": (143, 46, 39),
    "ember": (235, 83, 48),
    "ember_light": (255, 181, 79),
    "heat": (255, 228, 128),
    "blue": (55, 190, 255),
    "blue_dark": (26, 92, 153),
    "cyan": (105, 232, 255),
    "green": (72, 226, 136),
    "green_dark": (28, 119, 78),
    "mint": (155, 255, 198),
    "gold": (248, 196, 82),
    "gold_dark": (160, 104, 36),
    "gold_light": (255, 231, 136),
    "violet": (151, 110, 255),
    "violet_dark": (72, 54, 142),
    "paper": (222, 233, 244),
    "paper_shadow": (142, 159, 179),
    "red": (244, 78, 86),
    "white": (241, 248, 255),
}

FONT = {
    "A": ["010", "101", "111", "101", "101"],
    "B": ["110", "101", "110", "101", "110"],
    "C": ["111", "100", "100", "100", "111"],
    "D": ["110", "101", "101", "101", "110"],
    "E": ["111", "100", "110", "100", "111"],
    "F": ["111", "100", "110", "100", "100"],
    "G": ["111", "100", "101", "101", "111"],
    "H": ["101", "101", "111", "101", "101"],
    "I": ["111", "010", "010", "010", "111"],
    "J": ["001", "001", "001", "101", "111"],
    "K": ["101", "101", "110", "101", "101"],
    "L": ["100", "100", "100", "100", "111"],
    "M": ["101", "111", "111", "101", "101"],
    "N": ["101", "111", "111", "111", "101"],
    "O": ["111", "101", "101", "101", "111"],
    "P": ["111", "101", "111", "100", "100"],
    "Q": ["111", "101", "101", "111", "001"],
    "R": ["110", "101", "110", "101", "101"],
    "S": ["111", "100", "111", "001", "111"],
    "T": ["111", "010", "010", "010", "010"],
    "U": ["101", "101", "101", "101", "111"],
    "V": ["101", "101", "101", "101", "010"],
    "W": ["101", "101", "111", "111", "101"],
    "X": ["101", "101", "010", "101", "101"],
    "Y": ["101", "101", "010", "010", "010"],
    "Z": ["111", "001", "010", "100", "111"],
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    "#": ["101", "111", "101", "111", "101"],
    "-": ["000", "000", "111", "000", "000"],
}


Color = tuple[int, int, int] | str
Canvas = list[list[tuple[int, int, int]]]


def blend(a: tuple[int, int, int], b: tuple[int, int, int], amount: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * amount) for i in range(3))


def color(value: Color) -> tuple[int, int, int]:
    return COLORS[value] if isinstance(value, str) else value


def new_canvas() -> Canvas:
    canvas: Canvas = []
    for y in range(SIZE):
        if y < 86:
            row_color = blend(COLORS["bg_top"], COLORS["bg_mid"], y / 86)
        else:
            row_color = blend(COLORS["bg_mid"], COLORS["bg_low"], (y - 86) / 106)
        canvas.append([row_color for _ in range(SIZE)])
    return canvas


def set_pixel(canvas: Canvas, x: int, y: int, value: Color) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        canvas[y][x] = color(value)


def rect(canvas: Canvas, x: int, y: int, w: int, h: int, value: Color) -> None:
    fill = color(value)
    for yy in range(y, y + h):
        if 0 <= yy < SIZE:
            for xx in range(x, x + w):
                if 0 <= xx < SIZE:
                    canvas[yy][xx] = fill


def line(canvas: Canvas, x1: int, y1: int, x2: int, y2: int, value: Color) -> None:
    dx = abs(x2 - x1)
    dy = -abs(y2 - y1)
    sx = 1 if x1 < x2 else -1
    sy = 1 if y1 < y2 else -1
    err = dx + dy
    while True:
        set_pixel(canvas, x1, y1, value)
        if x1 == x2 and y1 == y2:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x1 += sx
        if e2 <= dx:
            err += dx
            y1 += sy


def circle(canvas: Canvas, cx: int, cy: int, radius: int, value: Color) -> None:
    r2 = radius * radius
    for yy in range(cy - radius, cy + radius + 1):
        for xx in range(cx - radius, cx + radius + 1):
            if (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= r2:
                set_pixel(canvas, xx, yy, value)


def outline_rect(canvas: Canvas, x: int, y: int, w: int, h: int, fill: Color, border: Color) -> None:
    rect(canvas, x, y, w, h, border)
    rect(canvas, x + 1, y + 1, w - 2, h - 2, fill)


def text(canvas: Canvas, label: str, x: int, y: int, value: Color, scale: int = 1) -> None:
    cursor = x
    for char in label.upper():
        if char == " ":
            cursor += 4 * scale
            continue
        glyph = FONT.get(char)
        if glyph is None:
            cursor += 2 * scale
            continue
        for row, pattern in enumerate(glyph):
            for col, bit in enumerate(pattern):
                if bit == "1":
                    rect(canvas, cursor + col * scale, y + row * scale, scale, scale, value)
        cursor += 4 * scale


def draw_background(canvas: Canvas) -> None:
    for n in range(0, SIZE, 12):
        for i in range(SIZE):
            set_pixel(canvas, n, i, "grid_dim")
            set_pixel(canvas, i, n, "grid_dim")
    for n in range(0, SIZE, 48):
        for i in range(SIZE):
            if i % 2 == 0:
                set_pixel(canvas, n, i, "grid")
                set_pixel(canvas, i, n, "grid")
    for y in range(8, 146, 8):
        for x in range(8, 184, 8):
            if (x * 13 + y * 7) % 37 == 0:
                rect(canvas, x, y, 2, 2, "grid_hot")
    for x, y, c in [
        (20, 24, "blue"),
        (52, 18, "violet"),
        (153, 19, "gold"),
        (169, 47, "green"),
        (24, 128, "blue"),
        (172, 126, "violet"),
    ]:
        rect(canvas, x, y, 2, 2, c)
        set_pixel(canvas, x + 1, y - 2, c)
        set_pixel(canvas, x + 1, y + 3, c)
        set_pixel(canvas, x - 2, y + 1, c)
        set_pixel(canvas, x + 3, y + 1, c)


def draw_tile(canvas: Canvas, x: int, y: int, label: str, fill: Color, accent: Color) -> None:
    rect(canvas, x + 3, y + 4, 39, 20, "shadow")
    outline_rect(canvas, x, y, 39, 20, fill, accent)
    rect(canvas, x + 3, y + 3, 33, 3, "panel_light")
    text(canvas, label, x + 5, y + 9, "white", 1)
    rect(canvas, x + 31, y + 12, 3, 3, accent)


def draw_coin(canvas: Canvas, cx: int, cy: int) -> None:
    circle(canvas, cx + 3, cy + 4, 22, "shadow")
    circle(canvas, cx, cy, 23, "gold_dark")
    circle(canvas, cx, cy, 19, "gold")
    circle(canvas, cx - 6, cy - 7, 5, "gold_light")
    rect(canvas, cx - 2, cy + 7, 20, 3, "gold_dark")
    line(canvas, cx - 12, cy + 1, cx - 4, cy + 10, "green_dark")
    line(canvas, cx - 11, cy, cx - 4, cy + 8, "green")
    line(canvas, cx - 4, cy + 10, cx + 13, cy - 11, "green_dark")
    line(canvas, cx - 4, cy + 8, cx + 12, cy - 12, "mint")
    text(canvas, "PAY", cx - 10, cy + 25, "gold_light", 1)


def draw_kiln(canvas: Canvas) -> None:
    rect(canvas, 59, 145, 75, 7, "shadow")
    rect(canvas, 57, 136, 79, 12, "steel_dark")
    rect(canvas, 62, 128, 69, 10, "steel")
    rect(canvas, 68, 119, 57, 10, "stone_dark")

    for x, y, w in [(57, 68, 78), (61, 62, 70), (67, 56, 58), (75, 50, 42)]:
        rect(canvas, x, y, w, 7, "stone")
        rect(canvas, x + 2, y + 1, w - 4, 2, "stone_light")
        for seam in range(x + 10, x + w - 4, 14):
            rect(canvas, seam, y + 4, 2, 3, "stone_dark")
    rect(canvas, 57, 75, 78, 50, "stone_dark")
    rect(canvas, 61, 79, 70, 42, "stone")
    rect(canvas, 66, 84, 60, 32, "coal")
    rect(canvas, 70, 88, 52, 24, "ember_dark")
    rect(canvas, 75, 91, 42, 21, "ember")
    rect(canvas, 82, 84, 13, 31, "ember_light")
    rect(canvas, 99, 87, 9, 28, "heat")
    rect(canvas, 89, 96, 4, 17, "white")
    rect(canvas, 112, 94, 4, 15, "ember_light")

    rect(canvas, 77, 36, 39, 7, "stone_light")
    rect(canvas, 82, 42, 29, 10, "stone_dark")
    rect(canvas, 88, 27, 17, 10, "steel")
    rect(canvas, 92, 19, 9, 9, "steel_dark")
    for x, y in [(84, 24), (104, 31), (75, 35), (113, 38)]:
        rect(canvas, x, y, 3, 3, "ember_light")

    rect(canvas, 49, 105, 21, 8, "blue_dark")
    rect(canvas, 122, 105, 22, 8, "gold_dark")
    line(canvas, 47, 109, 64, 109, "blue")
    line(canvas, 128, 109, 146, 105, "gold_light")


def draw_scene(canvas: Canvas) -> None:
    rect(canvas, 13, 158, 165, 14, "shadow")
    rect(canvas, 18, 150, 156, 14, "panel_dark")
    rect(canvas, 21, 147, 150, 5, "panel_light")
    for x, c in [(30, "blue"), (45, "green"), (60, "gold"), (75, "violet"), (90, "red")]:
        rect(canvas, x, 154, 6, 4, c)
    text(canvas, "PR #80", 109, 154, "white", 1)

    rect(canvas, 18, 119, 156, 10, "steel_dark")
    rect(canvas, 23, 121, 146, 3, "steel")
    for x in range(26, 166, 16):
        rect(canvas, x, 116, 9, 9, "panel")
        rect(canvas, x + 2, 118, 5, 2, "paper")

    draw_tile(canvas, 15, 55, "SCOPE", "panel", "blue")
    draw_tile(canvas, 15, 82, "TEST", "panel", "green")
    draw_tile(canvas, 15, 109, "REVIEW", "panel", "violet")
    line(canvas, 54, 65, 75, 86, "blue")
    line(canvas, 54, 92, 75, 96, "green")
    line(canvas, 54, 119, 75, 108, "violet")
    for x, y, c in [(58, 69, "blue"), (60, 91, "green"), (61, 116, "violet")]:
        rect(canvas, x, y, 4, 4, c)

    draw_kiln(canvas)
    draw_coin(canvas, 154, 91)

    rect(canvas, 139, 33, 33, 20, "shadow")
    outline_rect(canvas, 136, 30, 33, 20, "panel", "gold")
    text(canvas, "DONE", 140, 38, "gold_light", 1)
    line(canvas, 131, 73, 143, 51, "gold")
    line(canvas, 132, 74, 144, 52, "gold_light")

    outline_rect(canvas, 68, 14, 56, 15, "panel_dark", "grid_hot")
    text(canvas, "FLOW", 78, 19, "cyan", 1)
    rect(canvas, 72, 33, 7, 3, "blue")
    rect(canvas, 88, 33, 7, 3, "green")
    rect(canvas, 104, 33, 7, 3, "gold")
    line(canvas, 79, 34, 88, 34, "grid_hot")
    line(canvas, 95, 34, 104, 34, "grid_hot")


def write_png(canvas: Canvas, path: Path) -> None:
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0)))
    png.extend(chunk(b"IDAT", zlib.compress(bytes(raw), level=9)))
    png.extend(chunk(b"IEND", b""))
    path.write_bytes(bytes(png))


def main() -> None:
    canvas = new_canvas()
    draw_background(canvas)
    draw_scene(canvas)
    output = Path(__file__).with_name("verification-kiln.png")
    write_png(canvas, output)
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
