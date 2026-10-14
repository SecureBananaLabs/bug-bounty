from pathlib import Path
import struct
import zlib

SIZE = 128
SCALE = 4

OUT = Path(__file__).with_name("settlement-grid.png")

PALETTE = {
    "bg": (11, 18, 32, 255),
    "grid": (24, 40, 62, 255),
    "grid_hi": (37, 63, 88, 255),
    "panel": (28, 47, 68, 255),
    "panel_hi": (50, 82, 103, 255),
    "gold": (246, 188, 70, 255),
    "gold_dark": (162, 105, 43, 255),
    "green": (64, 203, 130, 255),
    "green_dark": (26, 118, 86, 255),
    "red": (227, 86, 82, 255),
    "blue": (83, 155, 235, 255),
    "ink": (6, 10, 18, 255),
    "white": (230, 238, 245, 255),
}


def put(img, x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        img[y][x] = PALETTE[color]


def rect(img, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(img, xx, yy, color)


def line(img, x1, y1, x2, y2, color):
    dx = abs(x2 - x1)
    dy = -abs(y2 - y1)
    sx = 1 if x1 < x2 else -1
    sy = 1 if y1 < y2 else -1
    err = dx + dy
    x, y = x1, y1
    while True:
        put(img, x, y, color)
        if x == x2 and y == y2:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def write_png(path, img):
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in img)

    def chunk(kind, data):
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def draw():
    img = [[PALETTE["bg"] for _ in range(SIZE)] for _ in range(SIZE)]

    for x in range(0, SIZE, 8):
        line(img, x, 0, x, SIZE - 1, "grid")
    for y in range(0, SIZE, 8):
        line(img, 0, y, SIZE - 1, y, "grid")

    rect(img, 18, 18, 92, 72, "panel")
    rect(img, 18, 18, 92, 4, "panel_hi")
    rect(img, 18, 86, 92, 4, "ink")
    rect(img, 22, 26, 84, 56, "ink")
    rect(img, 25, 29, 78, 50, "panel")

    points = [(35, 62), (49, 45), (64, 55), (79, 39), (94, 50)]
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        line(img, x1, y1, x2, y2, "blue")
        line(img, x1, y1 + 1, x2, y2 + 1, "blue")

    labels = [(30, 68), (45, 68), (60, 68), (75, 68), (90, 68)]
    for idx, (x, y) in enumerate(labels):
        rect(img, x - 4, y - 4, 9, 9, "green_dark")
        rect(img, x - 2, y - 2, 5, 5, "green")
        if idx in (1, 3):
            rect(img, x - 1, y - 1, 3, 3, "gold")

    rect(img, 48, 93, 32, 22, "gold_dark")
    rect(img, 51, 91, 26, 22, "gold")
    rect(img, 55, 96, 18, 3, "white")
    rect(img, 55, 103, 14, 3, "ink")
    rect(img, 75, 96, 12, 12, "green_dark")
    rect(img, 78, 99, 6, 6, "green")

    for x, y, color in [(12, 14, "red"), (116, 20, "green"), (10, 110, "blue"), (115, 109, "gold")]:
        rect(img, x, y, 4, 4, color)
        rect(img, x + 1, y + 1, 2, 2, "white")

    return img


if __name__ == "__main__":
    write_png(OUT, draw())
    print(OUT)
