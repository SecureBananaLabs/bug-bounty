#!/usr/bin/env python3
"""Generate original pixel art for issue #80 with stdlib only."""

from __future__ import annotations

import binascii
import copy
import os
import struct
import zlib
from pathlib import Path


WIDTH = 128
HEIGHT = 128
OUT_DIR = Path("assets/pixel-art")
PNG_PATH = OUT_DIR / "escrow-terminal.png"
GIF_PATH = OUT_DIR / "escrow-terminal-demo.gif"

PALETTE: list[tuple[int, int, int]] = [
    (7, 8, 18),
    (14, 18, 32),
    (26, 35, 54),
    (48, 60, 78),
    (94, 112, 134),
    (30, 209, 196),
    (111, 246, 255),
    (96, 237, 135),
    (247, 199, 91),
    (245, 96, 116),
    (123, 92, 255),
    (45, 139, 255),
    (244, 248, 255),
    (17, 24, 36),
    (220, 94, 235),
    (10, 83, 95),
]


def blank() -> list[list[int]]:
    return [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]


def rect(pixels: list[list[int]], x: int, y: int, w: int, h: int, color: int) -> None:
    for yy in range(max(0, y), min(HEIGHT, y + h)):
        row = pixels[yy]
        for xx in range(max(0, x), min(WIDTH, x + w)):
            row[xx] = color


def hline(pixels: list[list[int]], x1: int, x2: int, y: int, color: int) -> None:
    if 0 <= y < HEIGHT:
        for xx in range(max(0, x1), min(WIDTH, x2 + 1)):
            pixels[y][xx] = color


def vline(pixels: list[list[int]], x: int, y1: int, y2: int, color: int) -> None:
    if 0 <= x < WIDTH:
        for yy in range(max(0, y1), min(HEIGHT, y2 + 1)):
            pixels[yy][x] = color


def diagonal(pixels: list[list[int]], x: int, y: int, dx: int, dy: int, length: int, color: int) -> None:
    for i in range(length):
        xx = x + dx * i
        yy = y + dy * i
        if 0 <= xx < WIDTH and 0 <= yy < HEIGHT:
            pixels[yy][xx] = color


FONT_3X5 = {
    "0": ("111", "101", "101", "101", "111"),
    "1": ("010", "110", "010", "010", "111"),
    "8": ("111", "101", "111", "101", "111"),
    "E": ("111", "100", "110", "100", "111"),
    "K": ("101", "110", "100", "110", "101"),
    "O": ("111", "101", "101", "101", "111"),
}


def draw_text(pixels: list[list[int]], text: str, x: int, y: int, color: int) -> None:
    cursor = x
    for char in text:
        glyph = FONT_3X5.get(char)
        if glyph is None:
            cursor += 4
            continue
        for gy, line in enumerate(glyph):
            for gx, bit in enumerate(line):
                if bit == "1":
                    rect(pixels, cursor + gx, y + gy, 1, 1, color)
        cursor += 4


def draw_scene(frame: int = 0) -> list[list[int]]:
    pixels = blank()

    for y in range(HEIGHT):
        fill = 0 if y < 76 else 1
        rect(pixels, 0, y, WIDTH, 1, fill)

    stars = [(12, 13), (31, 9), (43, 26), (84, 15), (102, 24), (116, 10), (58, 8)]
    for i, (x, y) in enumerate(stars):
        pixels[y][x] = 6 if (frame + i) % 6 < 3 else 4

    for y in range(88, HEIGHT, 8):
        hline(pixels, 0, WIDTH - 1, y, 2)
    for x in range(-20, 160, 18):
        diagonal(pixels, x, HEIGHT - 1, 1, -1, 40, 2)
        diagonal(pixels, x + 1, HEIGHT - 1, 1, -1, 40, 13)

    rect(pixels, 19, 96, 91, 17, 13)
    rect(pixels, 22, 91, 86, 18, 3)
    hline(pixels, 24, 105, 91, 4)
    hline(pixels, 24, 105, 108, 1)
    rect(pixels, 29, 101, 12, 4, 8)
    rect(pixels, 45, 101, 12, 4, 5)
    rect(pixels, 61, 101, 12, 4, 11)

    rect(pixels, 32, 43, 64, 45, 13)
    rect(pixels, 34, 41, 60, 44, 4)
    rect(pixels, 37, 45, 54, 36, 15)
    rect(pixels, 40, 48, 48, 30, 1)
    hline(pixels, 40, 88, 48, 6)
    vline(pixels, 40, 48, 78, 6)
    hline(pixels, 40, 88, 78, 5)
    vline(pixels, 88, 48, 78, 5)

    glow = 7 if frame % 8 < 4 else 5
    draw_text(pixels, "OK", 49, 55, glow)
    draw_text(pixels, "100", 48, 66, 8)
    hline(pixels, 69, 72, 59, glow)
    diagonal(pixels, 70, 61, 1, -1, 5, glow)
    diagonal(pixels, 68, 60, 1, 1, 3, glow)
    scan_y = 50 + (frame % 20)
    hline(pixels, 42, 86, scan_y, 6)

    rect(pixels, 12, 72, 15, 17, 3)
    rect(pixels, 14, 68, 11, 8, 10)
    hline(pixels, 15, 23, 70, 14)
    rect(pixels, 15, 82, 9, 3, 7 if frame % 10 < 5 else 5)

    rect(pixels, 100, 67, 14, 31, 3)
    rect(pixels, 102, 63, 10, 18, 12)
    for y in (67, 72, 77):
        hline(pixels, 104, 110, y, 2)
    rect(pixels, 103, 84, 8, 8, 8)
    hline(pixels, 104, 109, 88, 7)

    for x in range(23, 102, 6):
        color = (x // 6 + frame // 2) % 4
        hline(pixels, x, x + 2, 94, [5, 7, 8, 11][color])

    rect(pixels, 72, 84, 18, 8, 11)
    rect(pixels, 74, 86, 14, 4, 6)
    rect(pixels, 76, 87, 10, 2, 12)

    return pixels


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", binascii.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, pixels: list[list[int]]) -> None:
    rows = bytearray()
    for row in pixels:
        rows.append(0)
        for index in row:
            rows.extend(PALETTE[index])

    ihdr = struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0)
    data = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", zlib.compress(bytes(rows), 9))
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(data)


def emit_code(out: bytearray, state: dict[str, int], code: int) -> None:
    state["buffer"] |= code << state["bits"]
    state["bits"] += state["code_size"]
    while state["bits"] >= 8:
        out.append(state["buffer"] & 0xFF)
        state["buffer"] >>= 8
        state["bits"] -= 8


def lzw_compress(indices: bytes, min_code_size: int = 8) -> bytes:
    clear_code = 1 << min_code_size
    end_code = clear_code + 1
    next_code = end_code + 1
    table = {bytes([i]): i for i in range(clear_code)}
    out = bytearray()
    state = {"buffer": 0, "bits": 0, "code_size": min_code_size + 1}

    emit_code(out, state, clear_code)
    word = bytes([indices[0]])
    for value in indices[1:]:
        char = bytes([value])
        joined = word + char
        if joined in table:
            word = joined
            continue

        emit_code(out, state, table[word])
        if next_code < 4096:
            table[joined] = next_code
            next_code += 1
            if next_code == (1 << state["code_size"]) and state["code_size"] < 12:
                state["code_size"] += 1
        else:
            emit_code(out, state, clear_code)
            table = {bytes([i]): i for i in range(clear_code)}
            next_code = end_code + 1
            state["code_size"] = min_code_size + 1
        word = char

    emit_code(out, state, table[word])
    emit_code(out, state, end_code)
    if state["bits"]:
        out.append(state["buffer"] & 0xFF)
    return bytes(out)


def gif_subblocks(data: bytes) -> bytes:
    chunks = bytearray()
    for i in range(0, len(data), 255):
        block = data[i : i + 255]
        chunks.append(len(block))
        chunks.extend(block)
    chunks.append(0)
    return bytes(chunks)


def write_gif(path: Path, frames: list[list[list[int]]]) -> None:
    palette = PALETTE + [(0, 0, 0)] * (256 - len(PALETTE))
    data = bytearray()
    data.extend(b"GIF89a")
    data.extend(struct.pack("<HHBBB", WIDTH, HEIGHT, 0xF7, 0, 0))
    for color in palette:
        data.extend(bytes(color))
    data.extend(b"\x21\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00")

    for frame in frames:
        delay = 6
        data.extend(b"\x21\xf9\x04\x04")
        data.extend(struct.pack("<H", delay))
        data.extend(b"\x00\x00")
        data.extend(b"\x2c")
        data.extend(struct.pack("<HHHHB", 0, 0, WIDTH, HEIGHT, 0))
        flat = bytes(index for row in frame for index in row)
        data.append(8)
        data.extend(gif_subblocks(lzw_compress(flat, 8)))
    data.append(0x3B)
    path.write_bytes(bytes(data))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    base = draw_scene(0)
    frames = [draw_scene(i) for i in range(24)]
    write_png(PNG_PATH, base)
    write_gif(GIF_PATH, frames)

    print(f"Wrote {PNG_PATH} ({WIDTH}x{HEIGHT})")
    print(f"Wrote {GIF_PATH} ({len(frames)} frames)")


if __name__ == "__main__":
    os.chdir(Path(__file__).resolve().parents[1])
    main()
