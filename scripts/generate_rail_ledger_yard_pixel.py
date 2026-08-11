from pathlib import Path
import struct
import zlib


WIDTH = 128
HEIGHT = 128
OUT = Path("assets/pixel-art/rail-ledger-yard.png")

PALETTE = {
    "void": (12, 14, 28),
    "night": (18, 24, 44),
    "rail": (92, 105, 130),
    "rail_hi": (180, 194, 211),
    "gold": (241, 184, 57),
    "amber": (218, 122, 46),
    "cyan": (60, 204, 220),
    "mint": (96, 220, 156),
    "green": (40, 155, 93),
    "red": (216, 75, 67),
    "blue": (47, 83, 155),
    "purple": (96, 72, 145),
    "white": (236, 238, 230),
}


def png_chunk(kind, data):
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path, pixels):
    raw_rows = []
    for row in pixels:
        raw_rows.append(b"\x00" + bytes(channel for pixel in row for channel in pixel))

    payload = zlib.compress(b"".join(raw_rows), level=9)
    png = b"\x89PNG\r\n\x1a\n"
    png += png_chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += png_chunk(b"IDAT", payload)
    png += png_chunk(b"IEND", b"")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def rect(px, x0, y0, x1, y1, color):
    for y in range(max(0, y0), min(HEIGHT, y1)):
        for x in range(max(0, x0), min(WIDTH, x1)):
            px[y][x] = color


def line(px, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x = x0
    y = y0
    while True:
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            px[y][x] = color
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def glow_rect(px, x0, y0, x1, y1, core, halo):
    rect(px, x0 - 1, y0 - 1, x1 + 1, y1 + 1, halo)
    rect(px, x0, y0, x1, y1, core)


def main():
    px = [[PALETTE["void"] for _ in range(WIDTH)] for _ in range(HEIGHT)]

    for y in range(HEIGHT):
        shade = min(34, y // 5)
        for x in range(WIDTH):
            if (x + y * 3) % 17 == 0:
                px[y][x] = (18 + shade // 3, 23 + shade // 4, 44 + shade // 2)
            elif y > 66:
                px[y][x] = (14 + shade // 5, 18 + shade // 4, 32 + shade // 3)

    # Distant skyline and signal mast.
    for x, h, c in [(6, 18, "blue"), (18, 28, "purple"), (32, 14, "blue"), (96, 22, "purple"), (112, 16, "blue")]:
        rect(px, x, 64 - h, x + 9, 64, PALETTE[c])
        rect(px, x + 2, 64 - h + 4, x + 4, 64 - h + 6, PALETTE["cyan"])
    rect(px, 66, 27, 72, 76, PALETTE["rail"])
    rect(px, 64, 24, 74, 30, PALETTE["rail_hi"])
    glow_rect(px, 67, 18, 71, 22, PALETTE["gold"], PALETTE["amber"])

    # Ledger yard floor.
    rect(px, 0, 74, WIDTH, HEIGHT, PALETTE["night"])
    for y in range(76, 128, 8):
        rect(px, 0, y, WIDTH, y + 1, (26, 35, 56))

    # Rail perspective.
    for offset in (-30, -14, 14, 30):
        line(px, 64 + offset // 3, 69, 64 + offset, 127, PALETTE["rail"])
        line(px, 65 + offset // 3, 69, 65 + offset, 127, PALETTE["rail_hi"])
    for y in range(78, 126, 10):
        spread = (y - 68) // 2
        rect(px, 64 - spread, y, 64 + spread, y + 2, PALETTE["rail"])

    # Ledger cargo cars.
    cars = [
        (20, 84, 42, 101, "blue", "cyan"),
        (48, 79, 75, 99, "purple", "mint"),
        (82, 87, 111, 106, "green", "gold"),
    ]
    for x0, y0, x1, y1, body, light in cars:
        rect(px, x0, y0, x1, y1, PALETTE[body])
        rect(px, x0 + 2, y0 + 2, x1 - 2, y0 + 5, PALETTE["rail_hi"])
        for x in range(x0 + 4, x1 - 4, 7):
            rect(px, x, y0 + 8, x + 4, y0 + 11, PALETTE[light])
        rect(px, x0 + 3, y1, x0 + 8, y1 + 4, PALETTE["rail"])
        rect(px, x1 - 8, y1, x1 - 3, y1 + 4, PALETTE["rail"])

    # Checkpoint lights: scope, test, review, payout.
    checkpoints = [(14, 65, "cyan"), (42, 61, "mint"), (88, 62, "gold"), (113, 67, "red")]
    for x, y, color in checkpoints:
        rect(px, x, y, x + 2, y + 15, PALETTE["rail"])
        glow_rect(px, x - 2, y - 4, x + 4, y + 2, PALETTE[color], PALETTE["night"])

    # Central ledger console.
    rect(px, 50, 46, 80, 67, PALETTE["night"])
    rect(px, 52, 48, 78, 65, PALETTE["rail"])
    for y in (51, 56, 61):
        rect(px, 55, y, 72, y + 2, PALETTE["mint"])
        rect(px, 74, y, 76, y + 2, PALETTE["gold"])

    # Pixel stars and payout sparks.
    for i in range(40):
        x = (i * 23 + 11) % WIDTH
        y = (i * 29 + 7) % 54
        px[y][x] = PALETTE["white"] if i % 5 == 0 else PALETTE["cyan"]
    for x, y in [(68, 15), (70, 13), (72, 16), (66, 20), (76, 21), (63, 18)]:
        px[y][x] = PALETTE["gold"]

    write_png(OUT, px)
    print(f"Wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
