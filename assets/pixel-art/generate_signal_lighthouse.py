from pathlib import Path
import struct
import zlib


WIDTH = 128
HEIGHT = 128
OUT = Path(__file__).with_name("signal-lighthouse.png")


def rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


palette = {
    "sky_0": rgb("#071323"),
    "sky_1": rgb("#0b1f35"),
    "sky_2": rgb("#102f48"),
    "grid": rgb("#1d6a88"),
    "grid_dim": rgb("#123c55"),
    "beam": rgb("#ffe28a"),
    "beam_dim": rgb("#7bc8b8"),
    "light": rgb("#fff4b8"),
    "tower": rgb("#c9f3e5"),
    "tower_shadow": rgb("#4f8ea1"),
    "tower_dark": rgb("#1d4b65"),
    "accent": rgb("#ff6b8f"),
    "water_0": rgb("#082235"),
    "water_1": rgb("#0e3a4c"),
    "white": rgb("#f8fbff"),
}

canvas = [[palette["sky_0"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def put(x, y, color):
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = color


def rect(x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(xx, yy, color)


def line(x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        put(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def write_png(path):
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(kind, data):
        body = kind + data
        return (
            struct.pack(">I", len(data))
            + body
            + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


# Layered night sky.
for y in range(HEIGHT):
    shade = "sky_0" if y < 32 else "sky_1" if y < 72 else "sky_2"
    for x in range(WIDTH):
        canvas[y][x] = palette[shade]

# Distant data skyline.
for x, h in [(5, 9), (13, 14), (25, 7), (34, 18), (45, 11), (84, 14), (95, 8), (109, 17), (119, 10)]:
    rect(x, 72 - h, 5, h, palette["tower_dark"])
    rect(x + 1, 72 - h + 2, 1, h - 4, palette["grid_dim"])

# Signal beams as pixel steps.
for step in range(9):
    rect(26 - step * 2, 38 + step * 3, 28 + step * 3, 2, palette["beam_dim"])
    rect(73, 39 + step * 3, 30 + step * 3, 2, palette["beam_dim"])
for step in range(7):
    rect(36 - step * 2, 39 + step * 3, 19 + step * 2, 1, palette["beam"])
    rect(72, 40 + step * 3, 21 + step * 2, 1, palette["beam"])

# Stars and scan points.
for x, y in [(9, 10), (21, 24), (39, 13), (52, 27), (79, 12), (101, 25), (116, 10), (121, 38)]:
    rect(x, y, 2, 2, palette["white"])
for x, y in [(18, 42), (30, 52), (92, 51), (110, 43)]:
    rect(x, y, 3, 3, palette["accent"])

# Water/circuit plane.
rect(0, 88, WIDTH, 40, palette["water_0"])
for y in range(92, 128, 8):
    line(0, y, WIDTH - 1, y + (y - 92) // 3, palette["grid_dim"])
for x in range(0, WIDTH, 12):
    line(x, 88, max(0, x - 18), 127, palette["grid_dim"])
    line(x, 88, min(WIDTH - 1, x + 18), 127, palette["grid"])
for x, y in [(14, 105), (31, 96), (48, 115), (83, 101), (103, 118), (116, 99)]:
    rect(x, y, 3, 3, palette["beam"])

# Lighthouse base and body.
rect(54, 88, 22, 6, palette["tower_dark"])
rect(50, 94, 30, 7, palette["tower_shadow"])
rect(45, 101, 40, 8, palette["tower_dark"])
for y in range(45, 88):
    width = 14 + (y - 45) // 7
    x = 64 - width // 2
    rect(x, y, width, 1, palette["tower"])
    rect(x + width - 4, y, 4, 1, palette["tower_shadow"])
for y in range(51, 84, 9):
    rect(57, y, 14, 3, palette["tower_dark"])
    rect(58, y + 1, 12, 1, palette["accent"])

# Lantern room.
rect(55, 35, 18, 7, palette["tower_dark"])
rect(57, 31, 14, 6, palette["light"])
rect(60, 29, 8, 3, palette["beam"])
rect(53, 42, 22, 4, palette["tower_shadow"])
rect(62, 32, 3, 3, palette["white"])

# Foreground highlights.
line(45, 101, 64, 109, palette["grid"])
line(85, 101, 64, 109, palette["grid"])
rect(60, 112, 8, 4, palette["beam"])
rect(62, 116, 4, 3, palette["light"])

write_png(OUT)
print(OUT)
