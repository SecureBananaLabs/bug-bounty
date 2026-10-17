from __future__ import annotations

import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "pixel-art" / "golden-workbench-window.png"
WIDTH = 128
HEIGHT = 128


Color = tuple[int, int, int]


palette: dict[str, Color] = {
    "midnight": (18, 22, 44),
    "deep_blue": (26, 35, 67),
    "violet": (47, 42, 83),
    "rose": (99, 58, 93),
    "dawn": (205, 109, 92),
    "sun": (255, 204, 93),
    "sun_dark": (218, 144, 55),
    "wall": (58, 42, 56),
    "wall_shadow": (37, 31, 48),
    "frame": (92, 55, 45),
    "frame_hi": (151, 87, 57),
    "glass": (39, 68, 92),
    "glass_hi": (103, 153, 156),
    "desk": (105, 64, 49),
    "desk_hi": (173, 101, 59),
    "paper": (235, 217, 166),
    "ink": (42, 39, 54),
    "plant": (81, 162, 119),
    "plant_hi": (140, 215, 141),
    "pot": (179, 91, 66),
    "lamp": (255, 187, 76),
    "lamp_glow": (245, 151, 80),
    "floor": (49, 38, 57),
    "floor_hi": (75, 51, 67),
    "outline": (20, 18, 31),
}


canvas = [[palette["midnight"] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def px(x: int, y: int, color: str | Color) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas[y][x] = palette[color] if isinstance(color, str) else color


def rect(x0: int, y0: int, x1: int, y1: int, color: str | Color) -> None:
    for y in range(y0, y1):
        for x in range(x0, x1):
            px(x, y, color)


def border(x0: int, y0: int, x1: int, y1: int, color: str | Color, thickness: int = 2) -> None:
    rect(x0, y0, x1, y0 + thickness, color)
    rect(x0, y1 - thickness, x1, y1, color)
    rect(x0, y0, x0 + thickness, y1, color)
    rect(x1 - thickness, y0, x1, y1, color)


def circle(cx: int, cy: int, radius: int, color: str | Color) -> None:
    r2 = radius * radius
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                px(x, y, color)


def line(x0: int, y0: int, x1: int, y1: int, color: str | Color) -> None:
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        px(x0, y0, color)
        px(x0 + 1, y0, color)
        px(x0, y0 + 1, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def draw_background() -> None:
    bands = [
        (0, 18, "midnight"),
        (18, 36, "deep_blue"),
        (36, 55, "violet"),
        (55, 72, "rose"),
        (72, 128, "wall_shadow"),
    ]
    for y0, y1, color in bands:
        rect(0, y0, WIDTH, y1, color)

    for x, y in [(10, 10), (28, 24), (55, 11), (116, 17), (75, 30), (7, 43), (123, 51)]:
        rect(x, y, x + 2, y + 2, "paper")
    for x, y in [(18, 31), (103, 8), (95, 55), (45, 44)]:
        px(x, y, "sun")
        px(x + 1, y + 1, "sun")


def draw_window() -> None:
    rect(12, 18, 116, 111, "wall")
    rect(18, 15, 110, 108, "frame")
    border(18, 15, 110, 108, "outline", 3)
    rect(24, 21, 104, 82, "glass")
    border(24, 21, 104, 82, "frame_hi", 3)
    rect(62, 21, 66, 82, "frame")
    rect(24, 50, 104, 54, "frame")

    circle(91, 36, 10, "sun")
    circle(91, 36, 6, "lamp")
    rect(84, 42, 98, 46, "sun_dark")
    rect(32, 64, 54, 68, "glass_hi")
    rect(72, 60, 96, 64, "glass_hi")
    line(29, 28, 46, 44, "glass_hi")
    line(68, 28, 82, 43, "glass_hi")


def draw_workbench() -> None:
    rect(20, 83, 108, 104, "desk")
    rect(20, 83, 108, 88, "desk_hi")
    rect(24, 104, 32, 118, "desk")
    rect(96, 104, 104, 118, "desk")
    rect(18, 80, 110, 84, "outline")

    rect(42, 70, 62, 83, "ink")
    rect(46, 66, 58, 70, "glass_hi")
    rect(45, 72, 59, 80, "deep_blue")
    rect(48, 74, 56, 78, "plant_hi")

    rect(68, 72, 86, 84, "paper")
    rect(72, 76, 83, 78, "ink")
    rect(70, 80, 80, 82, "sun_dark")

    rect(30, 76, 38, 84, "pot")
    rect(28, 72, 40, 76, "plant")
    rect(31, 68, 35, 72, "plant_hi")
    rect(36, 69, 42, 73, "plant")

    rect(90, 69, 98, 84, "lamp_glow")
    rect(88, 65, 100, 71, "lamp")
    rect(94, 71, 96, 84, "outline")
    rect(86, 84, 102, 87, "outline")

    for x in range(24, 104, 8):
        rect(x, 90, x + 4, 94, "floor_hi")
    rect(55, 92, 76, 96, "paper")
    rect(58, 96, 79, 100, "paper")
    rect(60, 94, 73, 96, "ink")


def draw_floor() -> None:
    rect(0, 111, 128, 128, "floor")
    for y in range(112, 128, 8):
        line(0, y, 127, y + 7, "floor_hi")
    for x in range(0, 128, 16):
        rect(x, 121, x + 8, 125, "wall_shadow")


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path: Path) -> None:
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(png_chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)))
    png.extend(png_chunk(b"IDAT", zlib.compress(bytes(raw), level=9)))
    png.extend(png_chunk(b"IEND", b""))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(bytes(png))


def main() -> None:
    draw_background()
    draw_window()
    draw_floor()
    draw_workbench()
    write_png(OUTPUT)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
