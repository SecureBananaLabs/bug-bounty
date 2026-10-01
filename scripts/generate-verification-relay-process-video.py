from __future__ import annotations

import os
import shutil
import struct
import subprocess
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
FRAMES_DIR = Path("demos/verification-relay-process-frames")
OUTPUT = Path("demos/verification-relay-tower-process.mp4")


def write_png(path: Path, pixels: list[list[tuple[int, int, int]]]) -> None:
    raw = b"".join(b"\x00" + bytes(channel for pixel in row for channel in pixel) for row in pixels)

    def chunk(name: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + name
            + data
            + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def rect(pixels, x0, y0, x1, y1, color):
    for y in range(max(0, y0), min(HEIGHT, y1)):
        for x in range(max(0, x0), min(WIDTH, x1)):
            pixels[y][x] = color


def line(pixels, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    error = dx + dy
    while True:
        if 0 <= x0 < WIDTH and 0 <= y0 < HEIGHT:
            pixels[y0][x0] = color
        if x0 == x1 and y0 == y1:
            break
        twice_error = 2 * error
        if twice_error >= dy:
            error += dy
            x0 += sx
        if twice_error <= dx:
            error += dx
            y0 += sy


def add_glow(pixels, cx, cy, radius, color):
    for y in range(max(0, cy - radius), min(HEIGHT, cy + radius + 1)):
        for x in range(max(0, cx - radius), min(WIDTH, cx + radius + 1)):
            distance = abs(x - cx) + abs(y - cy)
            if distance <= radius:
                strength = (radius - distance + 1) / (radius + 1)
                base = pixels[y][x]
                pixels[y][x] = tuple(
                    min(255, int(base[index] * (1 - strength * 0.45) + color[index] * strength * 0.45))
                    for index in range(3)
                )


def save_stage(stage: int, pixels) -> int:
    for _ in range(18):
        write_png(FRAMES_DIR / f"frame_{save_stage.counter:04d}.png", pixels)
        save_stage.counter += 1
    return stage + 1


save_stage.counter = 0


def main() -> None:
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    pixels = [[(11, 15, 28) for _ in range(WIDTH)] for _ in range(HEIGHT)]
    stage = save_stage(0, pixels)

    for y in range(HEIGHT):
        for x in range(WIDTH):
            if (x + y) % 13 == 0:
                pixels[y][x] = (16, 25, 43)
            if (x * 3 + y * 5) % 97 == 0:
                pixels[y][x] = (38, 54, 82)
    stage = save_stage(stage, pixels)

    for x in range(0, WIDTH, 8):
        line(pixels, x, 94, 64, 32, (31, 50, 74))
    for y in range(24, 101, 10):
        line(pixels, 24, y, 104, y, (26, 42, 64))
    stage = save_stage(stage, pixels)

    add_glow(pixels, 64, 28, 20, (62, 196, 255))
    add_glow(pixels, 64, 28, 11, (255, 212, 91))
    rect(pixels, 60, 34, 68, 99, (77, 91, 115))
    rect(pixels, 63, 28, 65, 105, (158, 176, 196))
    rect(pixels, 52, 96, 76, 105, (54, 64, 83))
    rect(pixels, 44, 105, 84, 112, (32, 43, 63))
    stage = save_stage(stage, pixels)

    for y in range(42, 92, 12):
        line(pixels, 54, y, 74, y, (122, 139, 161))
        line(pixels, 54, y, 64, y - 8, (122, 139, 161))
        line(pixels, 74, y, 64, y - 8, (122, 139, 161))
    line(pixels, 18, 28, 64, 18, (47, 156, 217))
    line(pixels, 110, 28, 64, 18, (47, 156, 217))
    line(pixels, 29, 43, 64, 28, (47, 156, 217))
    line(pixels, 99, 43, 64, 28, (47, 156, 217))
    stage = save_stage(stage, pixels)

    lights = [
        (22, 28, (96, 220, 135)),
        (38, 43, (255, 211, 91)),
        (64, 18, (62, 196, 255)),
        (90, 43, (255, 127, 101)),
        (106, 28, (183, 141, 255)),
    ]
    for cx, cy, color in lights:
        add_glow(pixels, cx, cy, 9, color)
        rect(pixels, cx - 3, cy - 3, cx + 4, cy + 4, color)
        rect(pixels, cx - 1, cy - 1, cx + 2, cy + 2, (255, 250, 218))
    stage = save_stage(stage, pixels)

    rect(pixels, 28, 76, 100, 94, (24, 34, 53))
    rect(pixels, 31, 79, 97, 91, (39, 54, 77))
    for index, color in enumerate([(96, 220, 135), (255, 211, 91), (62, 196, 255), (255, 127, 101), (183, 141, 255)]):
        x = 36 + index * 12
        rect(pixels, x, 82, x + 7, 88, color)
    rect(pixels, 52, 56, 76, 68, (255, 188, 66))
    rect(pixels, 55, 59, 73, 65, (255, 224, 120))
    rect(pixels, 76, 59, 82, 65, (92, 220, 164))
    rect(pixels, 46, 59, 52, 65, (92, 220, 164))
    for x in range(20, 109, 6):
        rect(pixels, x, 114, x + 3, 117, (38, 58, 84))
    rect(pixels, 0, 118, WIDTH, HEIGHT, (15, 24, 38))
    rect(pixels, 18, 116, 110, 120, (26, 39, 57))
    save_stage(stage, pixels)

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-framerate",
            "12",
            "-i",
            str(FRAMES_DIR / "frame_%04d.png"),
            "-vf",
            "scale=512:512:flags=neighbor,format=yuv420p",
            "-movflags",
            "+faststart",
            str(OUTPUT),
        ],
        check=True,
    )

    shutil.rmtree(FRAMES_DIR)


if __name__ == "__main__":
    main()
