from pathlib import Path
import struct
import zlib


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/codex-night-workshop.png")

PALETTE = {
    "sky": (11, 16, 32),
    "sky2": (17, 25, 46),
    "wall": (45, 55, 75),
    "wall_dark": (27, 34, 52),
    "bench": (83, 57, 42),
    "bench_hi": (123, 86, 54),
    "lamp": (255, 205, 89),
    "lamp_hi": (255, 236, 166),
    "circuit": (73, 209, 177),
    "circuit_dim": (41, 120, 116),
    "coin": (245, 169, 66),
    "coin_dark": (159, 91, 48),
    "shadow": (5, 8, 18),
    "frame": (7, 10, 20),
}


def chunk(kind, data):
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def set_px(pixels, x, y, color):
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        pixels[y][x] = color


def rect(pixels, x0, y0, x1, y1, color):
    for y in range(y0, y1):
        for x in range(x0, x1):
            set_px(pixels, x, y, color)


def line(pixels, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        set_px(pixels, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def circle(pixels, cx, cy, radius, color):
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                set_px(pixels, x, y, color)


def build_pixels():
    pixels = [[PALETTE["sky"] for _ in range(WIDTH)] for _ in range(HEIGHT)]

    for y in range(HEIGHT):
        if y > 38:
            shade = PALETTE["sky2"] if y % 3 else PALETTE["sky"]
            rect(pixels, 0, y, WIDTH, y + 1, shade)

    rect(pixels, 0, 0, WIDTH, 4, PALETTE["frame"])
    rect(pixels, 0, 124, WIDTH, 128, PALETTE["frame"])
    rect(pixels, 0, 0, 4, HEIGHT, PALETTE["frame"])
    rect(pixels, 124, 0, 128, HEIGHT, PALETTE["frame"])

    rect(pixels, 18, 32, 110, 104, PALETTE["wall"])
    rect(pixels, 22, 36, 106, 100, PALETTE["wall_dark"])
    rect(pixels, 28, 42, 100, 94, PALETTE["sky2"])

    rect(pixels, 18, 95, 110, 110, PALETTE["bench"])
    rect(pixels, 22, 90, 106, 98, PALETTE["bench_hi"])
    rect(pixels, 26, 108, 34, 120, PALETTE["bench"])
    rect(pixels, 94, 108, 102, 120, PALETTE["bench"])

    circle(pixels, 64, 56, 14, PALETTE["lamp"])
    circle(pixels, 64, 56, 7, PALETTE["lamp_hi"])
    rect(pixels, 60, 36, 68, 44, PALETTE["coin"])
    line(pixels, 64, 44, 64, 68, PALETTE["coin_dark"])

    for offset in range(-2, 3):
        line(pixels, 36, 85 + offset, 92, 85 + offset, PALETTE["circuit_dim"])
    for x in (36, 48, 80, 92):
        line(pixels, x, 78, x, 92, PALETTE["circuit"])
        circle(pixels, x, 76, 3, PALETTE["circuit"])

    rect(pixels, 42, 66, 54, 76, PALETTE["wall"])
    rect(pixels, 74, 66, 86, 76, PALETTE["wall"])
    rect(pixels, 44, 68, 52, 74, PALETTE["circuit"])
    rect(pixels, 76, 68, 84, 74, PALETTE["circuit"])
    line(pixels, 54, 72, 74, 72, PALETTE["circuit"])

    circle(pixels, 98, 82, 9, PALETTE["coin"])
    circle(pixels, 98, 82, 5, PALETTE["lamp"])
    rect(pixels, 96, 76, 100, 88, PALETTE["coin_dark"])

    for x, y in ((18, 18), (34, 20), (99, 22), (112, 44), (14, 66), (116, 74)):
        rect(pixels, x, y, x + 2, y + 2, PALETTE["lamp_hi"])

    rect(pixels, 0, 118, WIDTH, 124, PALETTE["shadow"])
    return pixels


def write_png(pixels):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    OUT.write_bytes(png)


if __name__ == "__main__":
    write_png(build_pixels())
    print(f"Wrote {OUT} ({WIDTH}x{HEIGHT})")
