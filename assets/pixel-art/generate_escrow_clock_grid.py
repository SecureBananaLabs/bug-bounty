from pathlib import Path
import struct
import zlib


SCALE = 4
GRID = 32
WIDTH = GRID * SCALE
HEIGHT = GRID * SCALE


def rgba(hex_color: str) -> tuple[int, int, int, int]:
    value = hex_color.lstrip("#")
    return (
        int(value[0:2], 16),
        int(value[2:4], 16),
        int(value[4:6], 16),
        255,
    )


canvas = [[rgba("#10141f") for _ in range(WIDTH)] for _ in range(HEIGHT)]


def cell(x: int, y: int, color: str) -> None:
    pixel = rgba(color)
    for py in range(y * SCALE, (y + 1) * SCALE):
        for px in range(x * SCALE, (x + 1) * SCALE):
            canvas[py][px] = pixel


for x in range(GRID):
    for y in range(GRID):
        if x % 4 == 0 or y % 4 == 0:
            cell(x, y, "#182236")

for x in range(3, 29):
    cell(x, 25, "#3b82f6")
    cell(x, 26, "#1e40af")

for x in range(6, 26):
    cell(x, 21, "#334155")
    cell(x, 22, "#475569")
    cell(x, 23, "#334155")

for y in range(8, 21):
    cell(7, y, "#64748b")
    cell(24, y, "#64748b")

for x in range(8, 24):
    cell(x, 8, "#64748b")
    cell(x, 20, "#64748b")

cx, cy = 16, 14
for x in range(8, 25):
    for y in range(6, 23):
        distance = (x - cx) ** 2 + (y - cy) ** 2
        if 48 <= distance <= 72:
            cell(x, y, "#facc15")
        elif distance <= 45:
            cell(x, y, "#0f172a")

for x, y in ((16, 6), (24, 14), (16, 22), (8, 14)):
    cell(x, y, "#fef08a")

for y in range(10, 15):
    cell(16, y, "#e2e8f0")

for x in range(16, 22):
    cell(x, 14, "#22c55e")

cell(16, 14, "#f8fafc")

for x in range(11, 22):
    cell(x, 17, "#22c55e")

for x, y in ((10, 16), (11, 17), (12, 18), (13, 19), (22, 16), (21, 17), (20, 18), (19, 19)):
    cell(x, y, "#22c55e")

for x in range(2, 6):
    cell(x, 29, "#06b6d4")

for x in range(26, 30):
    cell(x, 29, "#06b6d4")

for x, y in ((4, 4), (5, 4), (26, 5), (27, 5), (3, 12), (28, 12), (5, 27), (26, 27)):
    cell(x, y, "#38bdf8")

for x, y in ((13, 3), (14, 3), (17, 3), (18, 3), (13, 25), (18, 25)):
    cell(x, y, "#a78bfa")


def chunk(kind: bytes, data: bytes) -> bytes:
    checksum = zlib.crc32(kind + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", checksum)


raw = bytearray()
for row in canvas:
    raw.append(0)
    for red, green, blue, alpha in row:
        raw.extend((red, green, blue, alpha))

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += chunk(b"IEND", b"")

Path(__file__).with_name("escrow-clock-grid.png").write_bytes(png)
