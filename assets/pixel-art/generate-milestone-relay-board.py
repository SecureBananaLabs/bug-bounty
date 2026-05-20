import struct
import zlib
from pathlib import Path

SIZE = 128
OUT = Path(__file__).with_name("milestone-relay-board.png")

palette = {
    "bg": (10, 14, 28, 255),
    "panel": (20, 30, 55, 255),
    "panel_hi": (35, 49, 86, 255),
    "grid": (31, 44, 74, 255),
    "wire": (92, 116, 174, 255),
    "cyan": (78, 219, 211, 255),
    "green": (105, 230, 143, 255),
    "gold": (242, 193, 82, 255),
    "red": (238, 95, 112, 255),
    "violet": (169, 134, 255, 255),
    "white": (238, 244, 255, 255),
    "shadow": (6, 8, 18, 255)
}

pixels = [[palette["bg"] for _ in range(SIZE)] for _ in range(SIZE)]

def rect(x, y, w, h, color):
    for yy in range(max(0, y), min(SIZE, y + h)):
        for xx in range(max(0, x), min(SIZE, x + w)):
            pixels[yy][xx] = color

def line(x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        rect(x0, y0, 2, 2, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy

def ring(cx, cy, color):
    rect(cx - 7, cy - 7, 14, 14, palette["shadow"])
    rect(cx - 8, cy - 6, 16, 12, color)
    rect(cx - 6, cy - 8, 12, 16, color)
    rect(cx - 4, cy - 4, 8, 8, palette["panel"])
    rect(cx - 2, cy - 2, 4, 4, palette["white"])

def check(cx, cy, color):
    rect(cx - 7, cy + 1, 3, 3, color)
    rect(cx - 4, cy + 4, 3, 3, color)
    rect(cx - 1, cy + 1, 3, 3, color)
    rect(cx + 2, cy - 2, 3, 3, color)
    rect(cx + 5, cy - 5, 3, 3, color)

rect(12, 12, 104, 104, palette["panel"])
rect(16, 16, 96, 96, palette["panel_hi"])
rect(20, 20, 88, 88, palette["panel"])

for x in range(24, 105, 8):
    rect(x, 22, 1, 84, palette["grid"])
for y in range(24, 105, 8):
    rect(22, y, 84, 1, palette["grid"])

nodes = [
    (30, 70, palette["cyan"]),
    (48, 48, palette["green"]),
    (66, 64, palette["gold"]),
    (84, 42, palette["violet"]),
    (100, 72, palette["red"])
]

for (x0, y0, _), (x1, y1, _) in zip(nodes, nodes[1:]):
    line(x0, y0, x1, y1, palette["wire"])

for cx, cy, color in nodes:
    ring(cx, cy, color)

check(66, 64, palette["green"])

rect(28, 94, 72, 6, palette["shadow"])
for i, color in enumerate([palette["cyan"], palette["green"], palette["gold"], palette["violet"], palette["red"]]):
    rect(31 + i * 14, 92, 10, 10, color)
    rect(34 + i * 14, 95, 4, 4, palette["white"])

rect(24, 28, 38, 5, palette["cyan"])
rect(24, 36, 24, 4, palette["green"])
rect(78, 92, 24, 4, palette["gold"])
rect(88, 84, 14, 4, palette["violet"])

for y in range(0, SIZE, 4):
    for x in range(0, SIZE, 4):
        if (x + y) % 16 == 0 and pixels[y][x] == palette["bg"]:
            rect(x, y, 1, 1, palette["grid"])

def chunk(kind, data):
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

raw = bytearray()
for row in pixels:
    raw.append(0)
    for rgba in row:
        raw.extend(rgba)

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += chunk(b"IEND", b"")
OUT.write_bytes(png)
print(OUT)
