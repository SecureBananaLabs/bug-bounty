#!/usr/bin/env python3
"""Generate the verification circuit garden pixel art asset.

The script intentionally uses only the Python standard library so the PNG can
be reproduced without installing art or imaging dependencies.
"""

from __future__ import annotations

import argparse
import hashlib
import shutil
import subprocess
import tempfile
import zlib
from pathlib import Path


SIZE = 128
SCALE = 4

ROOT = Path(__file__).resolve().parents[2]
ASSET_PATH = ROOT / "assets" / "pixel-art" / "verification-circuit-garden.png"
DEMO_PATH = ROOT / "demos" / "verification-circuit-garden-demo.mp4"

COLORS = {
    "bg": (8, 15, 24, 255),
    "bg2": (12, 24, 34, 255),
    "grid": (18, 38, 54, 255),
    "trace": (46, 188, 150, 255),
    "trace_dim": (27, 91, 88, 255),
    "leaf": (54, 210, 118, 255),
    "leaf_shadow": (27, 128, 88, 255),
    "gold": (250, 193, 68, 255),
    "gold_shadow": (166, 103, 34, 255),
    "tile": (24, 58, 68, 255),
    "tile_light": (63, 128, 119, 255),
    "tile_dark": (9, 32, 42, 255),
    "white": (219, 255, 236, 255),
    "mint": (112, 249, 200, 255),
    "rose": (255, 100, 128, 255),
    "blue": (75, 147, 255, 255),
}


Pixel = tuple[int, int, int, int]
Image = list[list[Pixel]]


def blank(color: Pixel = COLORS["bg"]) -> Image:
    return [[color for _ in range(SIZE)] for _ in range(SIZE)]


def put(img: Image, x: int, y: int, color: Pixel) -> None:
    if 0 <= x < SIZE and 0 <= y < SIZE:
        img[y][x] = color


def rect(img: Image, x: int, y: int, w: int, h: int, color: Pixel) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(img, xx, yy, color)


def line_h(img: Image, x1: int, x2: int, y: int, color: Pixel, thickness: int = 1) -> None:
    for yy in range(y, y + thickness):
        for x in range(min(x1, x2), max(x1, x2) + 1):
            put(img, x, yy, color)


def line_v(img: Image, x: int, y1: int, y2: int, color: Pixel, thickness: int = 1) -> None:
    for xx in range(x, x + thickness):
        for y in range(min(y1, y2), max(y1, y2) + 1):
            put(img, xx, y, color)


def block_line(img: Image, points: list[tuple[int, int]], color: Pixel, block: int = 3) -> None:
    for x, y in points:
        rect(img, x, y, block, block, color)


def diamond(img: Image, cx: int, cy: int, radius: int, color: Pixel) -> None:
    for y in range(cy - radius, cy + radius + 1):
        width = radius - abs(y - cy)
        for x in range(cx - width, cx + width + 1):
            put(img, x, y, color)


def coin(img: Image, x: int, y: int) -> None:
    rect(img, x + 2, y, 8, 2, COLORS["gold"])
    rect(img, x, y + 2, 12, 8, COLORS["gold"])
    rect(img, x + 2, y + 10, 8, 2, COLORS["gold_shadow"])
    rect(img, x + 9, y + 3, 2, 6, COLORS["gold_shadow"])
    rect(img, x + 4, y + 3, 2, 6, COLORS["white"])


def sprout(img: Image, x: int, y: int) -> None:
    line_v(img, x + 3, y + 4, y + 13, COLORS["leaf_shadow"], 2)
    rect(img, x, y + 5, 5, 4, COLORS["leaf"])
    rect(img, x + 5, y + 2, 6, 4, COLORS["leaf"])
    rect(img, x + 5, y + 8, 7, 4, COLORS["leaf_shadow"])
    rect(img, x + 1, y + 13, 10, 3, COLORS["trace_dim"])


def draw_background(img: Image) -> None:
    for y in range(SIZE):
        for x in range(SIZE):
            if (x + y) % 19 == 0:
                put(img, x, y, COLORS["bg2"])
    for value in range(8, SIZE, 16):
        line_h(img, 4, SIZE - 5, value, COLORS["grid"])
        line_v(img, value, 4, SIZE - 5, COLORS["grid"])
    for x in (20, 44, 84, 108):
        for y in (20, 44, 84, 108):
            diamond(img, x, y, 2, COLORS["trace_dim"])


def draw_circuit_garden(img: Image, frame: int = 0, total_frames: int = 1) -> None:
    pulse = frame % 24
    glow = COLORS["mint"] if pulse < 12 else COLORS["trace"]

    draw_background(img)

    # Circuit traces leading into the central approval tile.
    line_h(img, 8, 48, 64, COLORS["trace_dim"], 2)
    line_h(img, 80, 119, 64, COLORS["trace_dim"], 2)
    line_v(img, 64, 8, 48, COLORS["trace_dim"], 2)
    line_v(img, 64, 80, 119, COLORS["trace_dim"], 2)
    for x, y in ((18, 64), (40, 64), (88, 64), (110, 64), (64, 18), (64, 40), (64, 88), (64, 110)):
        diamond(img, x, y, 3, COLORS["trace"])
    line_h(img, 20, 46, 35, COLORS["trace_dim"], 1)
    line_v(img, 46, 35, 54, COLORS["trace_dim"], 1)
    line_h(img, 82, 108, 93, COLORS["trace_dim"], 1)
    line_v(img, 82, 74, 93, COLORS["trace_dim"], 1)

    # Central raised tile.
    rect(img, 43, 43, 42, 42, COLORS["tile_dark"])
    rect(img, 47, 39, 34, 4, COLORS["tile_light"])
    rect(img, 39, 47, 4, 34, COLORS["tile_light"])
    rect(img, 47, 47, 34, 34, COLORS["tile"])
    rect(img, 81, 47, 4, 34, COLORS["tile_dark"])
    rect(img, 47, 81, 38, 4, COLORS["tile_dark"])
    rect(img, 52, 52, 24, 24, (18, 49, 54, 255))

    # Blocky approval check.
    block_line(
        img,
        [(55, 65), (58, 68), (61, 71), (64, 68), (67, 65), (70, 62), (73, 59)],
        glow,
        4,
    )
    block_line(img, [(55, 64), (58, 67), (61, 70)], COLORS["white"], 2)

    # Garden markers and payout coins around the circuit.
    sprout(img, 18, 78)
    sprout(img, 97, 30)
    sprout(img, 20, 23)
    coin(img, 96, 86)
    coin(img, 18, 92)
    coin(img, 98, 18)

    # Small status lights.
    for i, color_name in enumerate(("blue", "gold", "leaf", "rose")):
        rect(img, 50 + i * 7, 89, 4, 4, COLORS[color_name])

    # Demo-only scan pulse, harmless for the final frame.
    if total_frames > 1:
        scan_x = 6 + (frame * 3) % 116
        line_v(img, scan_x, 9, 118, (112, 249, 200, 135), 1)


def scaled(img: Image, factor: int) -> Image:
    out: Image = []
    for row in img:
        scaled_row: list[Pixel] = []
        for pixel in row:
            scaled_row.extend([pixel] * factor)
        for _ in range(factor):
            out.append(list(scaled_row))
    return out


def write_png(path: Path, img: Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    height = len(img)
    width = len(img[0])
    raw = bytearray()
    for row in img:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(name: bytes, data: bytes) -> bytes:
        return (
            len(data).to_bytes(4, "big")
            + name
            + data
            + zlib.crc32(name + data).to_bytes(4, "big")
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk("IHDR".encode(), width.to_bytes(4, "big") + height.to_bytes(4, "big") + bytes([8, 6, 0, 0, 0]))
    png += chunk("IDAT".encode(), zlib.compress(bytes(raw), 9))
    png += chunk("IEND".encode(), b"")
    path.write_bytes(png)


def make_asset() -> None:
    img = blank()
    draw_circuit_garden(img)
    write_png(ASSET_PATH, img)


def make_demo() -> bool:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        return False

    DEMO_PATH.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        frame_dir = Path(tmp)
        total = 48
        for frame in range(total):
            img = blank()
            draw_circuit_garden(img, frame=frame, total_frames=total)
            write_png(frame_dir / f"frame-{frame:03d}.png", scaled(img, SCALE))
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-framerate",
                "12",
                "-i",
                str(frame_dir / "frame-%03d.png"),
                "-pix_fmt",
                "yuv420p",
                "-vf",
                "format=yuv420p",
                str(DEMO_PATH),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    return True


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--demo", action="store_true", help="also render a short MP4 preview with ffmpeg")
    args = parser.parse_args()

    make_asset()
    print(f"wrote {ASSET_PATH.relative_to(ROOT)} ({sha256(ASSET_PATH)})")
    if args.demo:
        if make_demo():
            print(f"wrote {DEMO_PATH.relative_to(ROOT)} ({sha256(DEMO_PATH)})")
        else:
            print("skipped demo: ffmpeg not available")


if __name__ == "__main__":
    main()
