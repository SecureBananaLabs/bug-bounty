#!/usr/bin/env python3
"""Generate the checksum sundial pixel-art bounty asset."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "pixel-art" / "checksum-sundial.png"

Color = tuple[int, int, int, int]

PALETTE: dict[str, Color] = {
    "bg": (13, 19, 34, 255),
    "tile": (18, 28, 48, 255),
    "tile_alt": (23, 36, 60, 255),
    "trace": (41, 92, 111, 255),
    "trace_lit": (73, 188, 184, 255),
    "node": (118, 229, 205, 255),
    "shadow": (5, 8, 17, 255),
    "plate_shadow": (77, 48, 30, 255),
    "plate_dark": (117, 71, 29, 255),
    "plate": (197, 128, 44, 255),
    "plate_mid": (225, 167, 64, 255),
    "plate_hi": (255, 214, 110, 255),
    "gnomon": (78, 51, 33, 255),
    "gnomon_hi": (246, 202, 105, 255),
    "blue": (84, 165, 255, 255),
    "green": (89, 219, 121, 255),
    "pink": (226, 102, 189, 255),
    "gold": (255, 204, 82, 255),
    "white": (224, 239, 245, 255),
    "ink": (30, 25, 39, 255),
}


def canvas() -> list[list[Color]]:
    return [[PALETTE["bg"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def px(img: list[list[Color]], x: int, y: int, color: Color) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        img[y][x] = color


def rect(img: list[list[Color]], x: int, y: int, w: int, h: int, color: Color) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px(img, xx, yy, color)


def outline_rect(
    img: list[list[Color]], x: int, y: int, w: int, h: int, color: Color
) -> None:
    rect(img, x, y, w, 1, color)
    rect(img, x, y + h - 1, w, 1, color)
    rect(img, x, y, 1, h, color)
    rect(img, x + w - 1, y, 1, h, color)


def line(
    img: list[list[Color]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: Color,
    thickness: int = 1,
) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy

    while True:
        rect(img, x0 - thickness // 2, y0 - thickness // 2, thickness, thickness, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle(img: list[list[Color]], cx: int, cy: int, r: int, color: Color) -> None:
    rr = r * r
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= rr:
                px(img, x, y, color)


def ellipse(
    img: list[list[Color]], cx: int, cy: int, rx: int, ry: int, color: Color
) -> None:
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) ** 2) * ry * ry + ((y - cy) ** 2) * rx * rx <= rx * rx * ry * ry:
                px(img, x, y, color)


def ellipse_outline(
    img: list[list[Color]],
    cx: int,
    cy: int,
    rx: int,
    ry: int,
    color: Color,
    thickness: int = 2,
) -> None:
    outer = rx * rx * ry * ry
    inner_rx = max(1, rx - thickness)
    inner_ry = max(1, ry - thickness)
    inner = inner_rx * inner_rx * inner_ry * inner_ry
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            value = ((x - cx) ** 2) * ry * ry + ((y - cy) ** 2) * rx * rx
            inner_value = ((x - cx) ** 2) * inner_ry * inner_ry + (
                (y - cy) ** 2
            ) * inner_rx * inner_rx
            if value <= outer and inner_value >= inner:
                px(img, x, y, color)


def polygon(img: list[list[Color]], points: list[tuple[int, int]], color: Color) -> None:
    min_y = max(0, min(y for _, y in points))
    max_y = min(HEIGHT - 1, max(y for _, y in points))
    for y in range(min_y, max_y + 1):
        intersections: list[float] = []
        scan_y = y + 0.5
        for i, (x0, y0) in enumerate(points):
            x1, y1 = points[(i + 1) % len(points)]
            if y0 == y1:
                continue
            if (y0 <= scan_y < y1) or (y1 <= scan_y < y0):
                intersections.append(x0 + (scan_y - y0) * (x1 - x0) / (y1 - y0))
        intersections.sort()
        for left, right in zip(intersections[0::2], intersections[1::2]):
            for x in range(math.ceil(left), math.floor(right) + 1):
                px(img, x, y, color)


def draw_background(img: list[list[Color]]) -> None:
    for y in range(0, HEIGHT, 8):
        for x in range(0, WIDTH, 8):
            if ((x // 8) + (y // 8)) % 2 == 0:
                rect(img, x, y, 8, 8, PALETTE["tile"])
            else:
                rect(img, x, y, 8, 8, PALETTE["tile_alt"])

    for x in range(0, WIDTH, 16):
        line(img, x, 0, x, HEIGHT - 1, (16, 27, 47, 255))
    for y in range(0, HEIGHT, 16):
        line(img, 0, y, WIDTH - 1, y, (16, 27, 47, 255))

    for y in range(6, HEIGHT, 13):
        for x in range(4, WIDTH, 17):
            if (x * 3 + y * 5) % 11 == 0:
                px(img, x, y, (42, 60, 83, 255))


def draw_circuitry(img: list[list[Color]]) -> None:
    traces = [
        ((7, 22), (34, 22), (45, 42)),
        ((101, 18), (113, 18), (113, 47), (91, 56)),
        ((12, 101), (35, 101), (47, 85)),
        ((85, 108), (116, 108), (116, 83), (96, 73)),
        ((24, 62), (42, 62)),
        ((86, 63), (107, 63)),
        ((64, 18), (64, 40)),
        ((64, 91), (64, 111)),
    ]
    for path in traces:
        for start, end in zip(path, path[1:]):
            line(img, *start, *end, PALETTE["trace"], thickness=4)
            line(img, *start, *end, PALETTE["trace_lit"], thickness=2)

    for x, y in [(7, 22), (101, 18), (12, 101), (116, 108), (24, 62), (107, 63)]:
        circle(img, x, y, 4, PALETTE["trace"])
        circle(img, x, y, 2, PALETTE["node"])


def draw_badges(img: list[list[Color]]) -> None:
    badges = [
        (55, 8, PALETTE["green"], "proof"),
        (104, 55, PALETTE["blue"], "review"),
        (55, 104, PALETTE["pink"], "merge"),
        (8, 55, PALETTE["gold"], "payout"),
    ]
    for x, y, color, kind in badges:
        rect(img, x + 2, y + 3, 18, 18, PALETTE["shadow"])
        rect(img, x, y, 18, 18, PALETTE["ink"])
        outline_rect(img, x, y, 18, 18, color)
        rect(img, x + 2, y + 2, 14, 14, (20, 31, 50, 255))

        if kind == "proof":
            line(img, x + 4, y + 9, x + 8, y + 13, color, 2)
            line(img, x + 8, y + 13, x + 14, y + 5, color, 2)
        elif kind == "review":
            circle(img, x + 8, y + 8, 5, color)
            circle(img, x + 8, y + 8, 3, (20, 31, 50, 255))
            line(img, x + 12, y + 12, x + 15, y + 15, color, 2)
        elif kind == "merge":
            circle(img, x + 5, y + 6, 2, color)
            circle(img, x + 13, y + 6, 2, color)
            circle(img, x + 9, y + 13, 2, color)
            line(img, x + 5, y + 6, x + 9, y + 13, color, 1)
            line(img, x + 13, y + 6, x + 9, y + 13, color, 1)
        else:
            circle(img, x + 9, y + 9, 6, color)
            circle(img, x + 9, y + 9, 3, PALETTE["plate_hi"])
            line(img, x + 9, y + 4, x + 9, y + 14, PALETTE["plate_dark"], 1)


def draw_sundial(img: list[list[Color]]) -> None:
    cx, cy = 64, 68

    ellipse(img, cx + 3, cy + 8, 36, 23, PALETTE["shadow"])
    ellipse(img, cx, cy + 4, 35, 23, PALETTE["plate_shadow"])
    ellipse(img, cx, cy, 36, 24, PALETTE["plate_dark"])
    ellipse(img, cx, cy - 1, 33, 21, PALETTE["plate"])
    ellipse(img, cx - 5, cy - 5, 22, 11, PALETTE["plate_mid"])
    ellipse_outline(img, cx, cy - 1, 36, 24, PALETTE["ink"], thickness=2)

    checksum = "10110100111001011100101100101110"
    for i, bit in enumerate(checksum):
        angle = math.radians(202 + i * 136 / (len(checksum) - 1))
        outer_x = round(cx + math.cos(angle) * 29)
        outer_y = round(cy - 1 + math.sin(angle) * 18)
        size = 3 if bit == "1" else 2
        color = PALETTE["plate_hi"] if bit == "1" else PALETTE["plate_dark"]
        rect(img, outer_x - size // 2, outer_y - size // 2, size, size, color)

    for angle_deg in [212, 232, 252, 272, 292, 312, 332]:
        angle = math.radians(angle_deg)
        x0 = round(cx + math.cos(angle) * 12)
        y0 = round(cy - 1 + math.sin(angle) * 7)
        x1 = round(cx + math.cos(angle) * 25)
        y1 = round(cy - 1 + math.sin(angle) * 16)
        line(img, x0, y0, x1, y1, PALETTE["plate_dark"], 1)

    polygon(img, [(64, 67), (85, 78), (67, 74)], (36, 57, 79, 255))
    polygon(img, [(63, 66), (73, 40), (70, 70)], PALETTE["gnomon"])
    polygon(img, [(64, 64), (72, 43), (69, 66)], PALETTE["plate_hi"])
    line(img, 63, 66, 70, 70, PALETTE["ink"], 1)
    line(img, 73, 40, 70, 70, PALETTE["ink"], 1)
    circle(img, 64, 67, 3, PALETTE["plate_hi"])

    for x, y, color in [
        (42, 53, PALETTE["green"]),
        (86, 54, PALETTE["blue"]),
        (45, 82, PALETTE["gold"]),
        (84, 84, PALETTE["pink"]),
    ]:
        rect(img, x - 2, y - 2, 5, 5, PALETTE["ink"])
        rect(img, x - 1, y - 1, 3, 3, color)


def write_png(path: Path, img: list[list[Color]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw_rows = []
    for row in img:
        raw_rows.append(b"\x00" + b"".join(bytes(pixel) for pixel in row))
    raw = b"".join(raw_rows)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, level=9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    img = canvas()
    draw_background(img)
    draw_circuitry(img)
    draw_badges(img)
    draw_sundial(img)
    write_png(OUTPUT, img)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
