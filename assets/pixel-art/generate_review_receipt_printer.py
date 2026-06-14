#!/usr/bin/env python3
import struct
import zlib

SIZE = 128
SCALE = 1
OUT = "assets/pixel-art/review-receipt-printer.png"


def rgba(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in range(0, 6, 2)) + (255,)


palette = {
    "bg": rgba("#12151d"),
    "grid": rgba("#20293a"),
    "grid2": rgba("#182132"),
    "shadow": rgba("#0b0d12"),
    "case_dark": rgba("#263142"),
    "case": rgba("#34465f"),
    "case_light": rgba("#5f7895"),
    "paper": rgba("#eef0da"),
    "paper_shadow": rgba("#b7bea6"),
    "paper_line": rgba("#6f7d74"),
    "green": rgba("#53e089"),
    "green_dark": rgba("#1d8a56"),
    "amber": rgba("#f4b84a"),
    "amber_dark": rgba("#9c6b27"),
    "red": rgba("#df5a5a"),
    "ink": rgba("#1f2834"),
    "coin": rgba("#f6d85e"),
    "coin_dark": rgba("#a06a25"),
    "blue": rgba("#54b8d8"),
    "blue_dark": rgba("#23617c"),
}

img = [[palette["bg"] for _ in range(SIZE)] for _ in range(SIZE)]


def set_px(x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        img[y][x] = color


def rect(x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(xx, yy, color)


def outline(x, y, w, h, color):
    rect(x, y, w, 1, color)
    rect(x, y + h - 1, w, 1, color)
    rect(x, y, 1, h, color)
    rect(x + w - 1, y, 1, h, color)


def dither_rect(x, y, w, h, color_a, color_b):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(xx, yy, color_a if (xx + yy) % 2 else color_b)


def line(x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        set_px(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def disk(cx, cy, r, color, edge=None):
    rr = r * r
    inner = max(0, (r - 2) * (r - 2))
    for yy in range(cy - r, cy + r + 1):
        for xx in range(cx - r, cx + r + 1):
            d = (xx - cx) ** 2 + (yy - cy) ** 2
            if d <= rr:
                set_px(xx, yy, edge if edge and d >= inner else color)


# Background circuit desk.
dither_rect(0, 0, SIZE, SIZE, palette["bg"], palette["grid2"])
for x in range(6, SIZE, 16):
    line(x, 96, x + 18, 127, palette["grid"])
for y in range(98, SIZE, 8):
    line(0, y, SIZE - 1, y, palette["grid"])
for x, y in [(13, 108), (36, 117), (96, 111), (112, 99)]:
    disk(x, y, 2, palette["blue"], palette["blue_dark"])

# Receipt paper.
rect(49, 18, 34, 46, palette["paper_shadow"])
rect(45, 14, 34, 50, palette["paper"])
outline(45, 14, 34, 50, palette["paper_shadow"])
for yy in range(22, 55, 8):
    rect(51, yy, 20, 2, palette["paper_line"])
rect(51, 30, 8, 2, palette["green"])
rect(51, 38, 13, 2, palette["paper_line"])
rect(51, 46, 17, 2, palette["paper_line"])
line(61, 57, 65, 61, palette["green_dark"])
line(65, 61, 74, 50, palette["green"])

# Printer body and receipt slot.
rect(22, 83, 84, 13, palette["shadow"])
rect(25, 55, 78, 36, palette["case_dark"])
rect(30, 50, 68, 34, palette["case"])
outline(30, 50, 68, 34, palette["case_light"])
rect(40, 47, 48, 8, palette["case_dark"])
rect(42, 49, 44, 3, palette["shadow"])
rect(36, 65, 56, 9, palette["ink"])
rect(39, 67, 50, 3, palette["case_light"])
rect(32, 76, 62, 6, palette["case_dark"])
rect(32, 76, 62, 2, palette["case_light"])

# Status lights.
disk(39, 58, 3, palette["green"], palette["green_dark"])
disk(50, 58, 3, palette["amber"], palette["amber_dark"])
disk(61, 58, 3, palette["red"], palette["shadow"])

# Payout coin and proof lights.
disk(94, 78, 11, palette["coin"], palette["coin_dark"])
rect(91, 73, 6, 3, palette["coin_dark"])
rect(89, 79, 10, 2, palette["coin_dark"])
rect(93, 67, 3, 6, palette["coin"])
for x in [28, 38, 48, 58, 68, 78]:
    rect(x, 88, 5, 3, palette["green"] if x in [28, 58, 78] else palette["blue"])

# Tiny checkmark badge.
rect(14, 43, 18, 18, palette["blue_dark"])
outline(14, 43, 18, 18, palette["blue"])
line(19, 53, 23, 57, palette["green"])
line(23, 57, 29, 48, palette["green"])


def write_png(path):
    raw = bytearray()
    for row in img:
        raw.append(0)
        for px in row:
            raw.extend(px)

    def chunk(kind, data):
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    write_png(OUT)
    print(OUT)
