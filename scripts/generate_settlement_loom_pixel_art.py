from __future__ import annotations

import struct
import zlib
from pathlib import Path


SIZE = 128
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pixel-art" / "settlement-loom.png"


PALETTE = {
    "bg": (15, 18, 32),
    "bg2": (21, 27, 48),
    "grid": (38, 48, 76),
    "steel": (91, 107, 139),
    "steel_hi": (147, 169, 203),
    "gold": (241, 184, 67),
    "gold_hi": (255, 222, 104),
    "green": (70, 211, 143),
    "green_hi": (151, 242, 194),
    "blue": (74, 163, 255),
    "blue_hi": (151, 215, 255),
    "red": (232, 91, 101),
    "ink": (7, 10, 20),
    "paper": (235, 230, 199),
    "paper_shadow": (174, 160, 126),
}


def set_px(buf: list[list[tuple[int, int, int]]], x: int, y: int, color: str) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        buf[y][x] = PALETTE[color]


def rect(buf: list[list[tuple[int, int, int]]], x: int, y: int, w: int, h: int, color: str) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            set_px(buf, xx, yy, color)


def line_h(buf: list[list[tuple[int, int, int]]], x: int, y: int, w: int, color: str) -> None:
    rect(buf, x, y, w, 1, color)


def line_v(buf: list[list[tuple[int, int, int]]], x: int, y: int, h: int, color: str) -> None:
    rect(buf, x, y, 1, h, color)


def framed_rect(
    buf: list[list[tuple[int, int, int]]],
    x: int,
    y: int,
    w: int,
    h: int,
    fill: str,
    frame: str,
    hi: str | None = None,
) -> None:
    rect(buf, x, y, w, h, frame)
    rect(buf, x + 2, y + 2, w - 4, h - 4, fill)
    if hi:
        line_h(buf, x + 2, y + 2, w - 4, hi)
        line_v(buf, x + 2, y + 2, h - 4, hi)


def stamp(buf: list[list[tuple[int, int, int]]], cx: int, cy: int) -> None:
    pattern = [
        "00111100",
        "01111110",
        "11100111",
        "11011011",
        "11100111",
        "01111110",
        "00111100",
    ]
    for y, row in enumerate(pattern):
        for x, bit in enumerate(row):
            if bit == "1":
                set_px(buf, cx - 4 + x, cy - 3 + y, "gold")
    for d in range(5):
        set_px(buf, cx - 2 + d, cy + d - 1, "green_hi")
        set_px(buf, cx + 3 + d, cy - d + 4, "green_hi")


def write_png(path: Path, buf: list[list[tuple[int, int, int]]]) -> None:
    raw = bytearray()
    for row in buf:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0)))
    png.extend(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
    png.extend(chunk(b"IEND", b""))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(bytes(png))


def build() -> list[list[tuple[int, int, int]]]:
    buf = [[PALETTE["bg"] for _ in range(SIZE)] for _ in range(SIZE)]

    for y in range(SIZE):
        for x in range(SIZE):
            if (x + y) % 17 == 0:
                set_px(buf, x, y, "bg2")
    for p in range(0, SIZE, 16):
        line_h(buf, 0, p, SIZE, "grid")
        line_v(buf, p, 0, SIZE, "grid")

    framed_rect(buf, 15, 22, 98, 74, "bg2", "steel", "steel_hi")
    framed_rect(buf, 24, 31, 80, 56, "ink", "steel", "blue_hi")

    for x in range(32, 97, 8):
        line_v(buf, x, 35, 48, "gold" if x % 16 == 0 else "blue")
        set_px(buf, x, 42, "gold_hi")
        set_px(buf, x, 69, "blue_hi")

    for y in (40, 52, 64, 76):
        line_h(buf, 28, y, 72, "green")
        for x in range(30, 100, 14):
            set_px(buf, x, y - 1, "green_hi")

    for i, x in enumerate((31, 51, 71)):
        framed_rect(buf, x, 47 + i * 6, 20, 15, "paper", "paper_shadow", "paper")
        line_h(buf, x + 5, 52 + i * 6, 10, "blue")
        line_h(buf, x + 5, 56 + i * 6, 8, "green")

    framed_rect(buf, 77, 49, 22, 22, "bg", "blue", "blue_hi")
    rect(buf, 84, 56, 8, 8, "gold")
    rect(buf, 86, 58, 4, 4, "gold_hi")
    stamp(buf, 88, 80)

    for y in range(98, 112):
        line_h(buf, 23, y, 82, "steel" if y % 2 else "steel_hi")
    framed_rect(buf, 37, 101, 54, 12, "ink", "gold", "gold_hi")
    line_h(buf, 43, 106, 12, "green_hi")
    line_h(buf, 60, 106, 9, "blue_hi")
    line_h(buf, 74, 106, 10, "red")

    for x, y, c in ((18, 18, "gold_hi"), (109, 19, "green_hi"), (14, 103, "blue_hi"), (112, 105, "gold")):
        rect(buf, x, y, 2, 2, c)

    return buf


if __name__ == "__main__":
    image = build()
    write_png(OUT, image)
    print(f"wrote {OUT.relative_to(ROOT)} ({SIZE}x{SIZE})")
