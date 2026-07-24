from __future__ import annotations

import struct
import zlib
from pathlib import Path


GRID = 32
SCALE = 4
WIDTH = GRID * SCALE
HEIGHT = GRID * SCALE
SCANLINE_BYTES = WIDTH * 4 + 1


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


COLORS = {
    "void": rgba("#0B1020"),
    "night": rgba("#131C34"),
    "slate": rgba("#22324D"),
    "steel": rgba("#5A6A8C"),
    "belt": rgba("#35415C"),
    "tile": rgba("#66F2D5"),
    "tile_dark": rgba("#1FAE97"),
    "glow": rgba("#7DE6FF", 170),
    "glow_warm": rgba("#FFB65E", 180),
    "lantern": rgba("#FFC85A"),
    "amber": rgba("#F38C3A"),
    "rope": rgba("#A6B8D8"),
    "highlight": rgba("#FFF4C0"),
    "spark": rgba("#C6F7FF"),
    "check": rgba("#9CFF79"),
    "shadow": rgba("#111827", 200),
}


def blank_grid(fill: tuple[int, int, int, int]) -> list[list[tuple[int, int, int, int]]]:
    return [[fill for _ in range(GRID)] for _ in range(GRID)]


def set_px(grid: list[list[tuple[int, int, int, int]]], x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if 0 <= x < GRID and 0 <= y < GRID:
        grid[y][x] = color


def fill_rect(grid: list[list[tuple[int, int, int, int]]], x0: int, y0: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            set_px(grid, x, y, color)


def outline_rect(
    grid: list[list[tuple[int, int, int, int]]],
    x0: int,
    y0: int,
    w: int,
    h: int,
    color: tuple[int, int, int, int],
) -> None:
    for x in range(x0, x0 + w):
        set_px(grid, x, y0, color)
        set_px(grid, x, y0 + h - 1, color)
    for y in range(y0, y0 + h):
        set_px(grid, x0, y, color)
        set_px(grid, x0 + w - 1, y, color)


def draw_background(grid: list[list[tuple[int, int, int, int]]]) -> None:
    fill_rect(grid, 0, 0, GRID, GRID, COLORS["void"])
    fill_rect(grid, 0, 6, GRID, 9, COLORS["night"])
    fill_rect(grid, 0, 15, GRID, 7, COLORS["slate"])
    stars = [
        (3, 3),
        (7, 5),
        (11, 2),
        (17, 4),
        (23, 5),
        (28, 3),
        (26, 8),
        (5, 10),
    ]
    for x, y in stars:
        set_px(grid, x, y, COLORS["spark"])
    for x, y in [(6, 4), (18, 5), (24, 6)]:
        set_px(grid, x, y, COLORS["glow"])


def draw_lantern(grid: list[list[tuple[int, int, int, int]]]) -> None:
    for y in range(0, 8):
        set_px(grid, 15, y, COLORS["rope"])
        set_px(grid, 16, y, COLORS["rope"])

    for x in range(12, 20):
        set_px(grid, x, 8, COLORS["rope"])

    fill_rect(grid, 11, 9, 10, 1, COLORS["steel"])
    fill_rect(grid, 12, 10, 8, 6, COLORS["amber"])
    fill_rect(grid, 13, 11, 6, 4, COLORS["lantern"])
    fill_rect(grid, 14, 12, 4, 2, COLORS["highlight"])
    outline_rect(grid, 12, 10, 8, 6, COLORS["steel"])
    fill_rect(grid, 14, 9, 4, 1, COLORS["steel"])

    glow_points = [
        (10, 10), (21, 10),
        (10, 12), (21, 12),
        (11, 16), (20, 16),
        (13, 17), (18, 17),
        (15, 18), (16, 18),
    ]
    for x, y in glow_points:
        set_px(grid, x, y, COLORS["glow_warm"])
    for x, y in [(9, 12), (22, 12), (11, 18), (20, 18)]:
        set_px(grid, x, y, COLORS["glow"])


def draw_conveyor(grid: list[list[tuple[int, int, int, int]]]) -> None:
    fill_rect(grid, 3, 22, 26, 3, COLORS["belt"])
    fill_rect(grid, 2, 25, 28, 3, COLORS["steel"])
    fill_rect(grid, 4, 28, 2, 2, COLORS["belt"])
    fill_rect(grid, 26, 28, 2, 2, COLORS["belt"])

    for x in range(4, 28, 4):
        set_px(grid, x, 23, COLORS["steel"])
        set_px(grid, x + 1, 24, COLORS["steel"])

    fill_rect(grid, 7, 19, 6, 3, COLORS["tile"])
    outline_rect(grid, 7, 19, 6, 3, COLORS["tile_dark"])
    fill_rect(grid, 19, 20, 6, 3, COLORS["tile"])
    outline_rect(grid, 19, 20, 6, 3, COLORS["tile_dark"])
    fill_rect(grid, 21, 26, 4, 1, COLORS["shadow"])

    for x, y in [(9, 20), (11, 20), (21, 21), (23, 21)]:
        set_px(grid, x, y, COLORS["highlight"])

    arrow = [(14, 21), (15, 20), (16, 19), (16, 20), (17, 21)]
    for x, y in arrow:
        set_px(grid, x, y, COLORS["glow"])

    check = [(21, 16), (22, 17), (23, 18), (24, 17), (25, 16), (26, 15)]
    for x, y in check:
        set_px(grid, x, y, COLORS["check"])
    set_px(grid, 23, 17, COLORS["highlight"])


def draw_frame_accents(grid: list[list[tuple[int, int, int, int]]], frame_index: int) -> None:
    pulse_sets = [
        [(8, 23), (9, 23), (10, 23)],
        [(12, 23), (13, 23), (14, 23)],
        [(16, 23), (17, 23), (18, 23)],
        [(20, 23), (21, 23), (22, 23)],
        [(24, 23), (25, 23), (26, 23)],
        [(20, 16), (21, 15), (22, 14)],
    ]
    glow_ring = [
        [(10, 11), (21, 11), (12, 17), (19, 17)],
        [(9, 12), (22, 12), (11, 18), (20, 18)],
        [(10, 13), (21, 13), (13, 18), (18, 18)],
        [(9, 12), (22, 12), (11, 18), (20, 18)],
        [(10, 11), (21, 11), (12, 17), (19, 17)],
        [(11, 10), (20, 10), (14, 18), (17, 18)],
    ]
    sparkle_path = [(6, 9), (10, 7), (14, 6), (18, 7), (22, 9), (25, 10)]

    for x, y in pulse_sets[frame_index % len(pulse_sets)]:
        set_px(grid, x, y, COLORS["highlight"])
    for x, y in glow_ring[frame_index % len(glow_ring)]:
        set_px(grid, x, y, COLORS["glow"])
    sparkle_x, sparkle_y = sparkle_path[frame_index % len(sparkle_path)]
    set_px(grid, sparkle_x, sparkle_y, COLORS["spark"])
    if frame_index % 2 == 0:
        set_px(grid, 15, 12, COLORS["highlight"])
        set_px(grid, 16, 12, COLORS["highlight"])
    else:
        set_px(grid, 15, 13, COLORS["highlight"])
        set_px(grid, 16, 13, COLORS["highlight"])


def build_frame(frame_index: int) -> list[list[tuple[int, int, int, int]]]:
    grid = blank_grid(COLORS["void"])
    draw_background(grid)
    draw_lantern(grid)
    draw_conveyor(grid)
    draw_frame_accents(grid, frame_index)
    return grid


def scaled_scanlines(grid: list[list[tuple[int, int, int, int]]]) -> bytes:
    rows: list[bytes] = []
    for source_y in range(GRID):
        expanded = bytearray()
        for source_x in range(GRID):
            expanded.extend(bytes(grid[source_y][source_x]) * SCALE)
        line = bytes(expanded)
        for _ in range(SCALE):
            rows.append(b"\x00" + line)
    return b"".join(rows)


def png_chunk(name: bytes, payload: bytes) -> bytes:
    crc = zlib.crc32(name)
    crc = zlib.crc32(payload, crc) & 0xFFFFFFFF
    return struct.pack(">I", len(payload)) + name + payload + struct.pack(">I", crc)


def write_png(path: Path, compressed_pixels: bytes) -> None:
    ihdr = struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(png_chunk(b"IHDR", ihdr))
    png.extend(png_chunk(b"IDAT", compressed_pixels))
    png.extend(png_chunk(b"IEND", b""))
    path.write_bytes(bytes(png))


def frame_control_chunk(sequence_number: int, delay_num: int = 10, delay_den: int = 100) -> bytes:
    return struct.pack(
        ">IIIIIHHBB",
        sequence_number,
        WIDTH,
        HEIGHT,
        0,
        0,
        delay_num,
        delay_den,
        0,
        0,
    )


def write_apng(path: Path, frame_scanlines: list[bytes]) -> None:
    ihdr = struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(png_chunk(b"IHDR", ihdr))
    png.extend(png_chunk(b"acTL", struct.pack(">II", len(frame_scanlines), 0)))

    sequence_number = 0
    png.extend(png_chunk(b"fcTL", frame_control_chunk(sequence_number)))
    sequence_number += 1
    png.extend(png_chunk(b"IDAT", zlib.compress(frame_scanlines[0], level=9)))

    for scanlines in frame_scanlines[1:]:
        png.extend(png_chunk(b"fcTL", frame_control_chunk(sequence_number)))
        sequence_number += 1
        frame_payload = struct.pack(">I", sequence_number) + zlib.compress(scanlines, level=9)
        png.extend(png_chunk(b"fdAT", frame_payload))
        sequence_number += 1

    png.extend(png_chunk(b"IEND", b""))
    path.write_bytes(bytes(png))


def main() -> None:
    still_path = Path(__file__).with_name("payout-lantern-merge-conveyor.png")
    demo_path = Path(__file__).with_name("payout-lantern-merge-conveyor-demo.png")

    frames = [build_frame(frame_index) for frame_index in range(6)]
    scaled_frames = [scaled_scanlines(frame) for frame in frames]

    write_png(still_path, zlib.compress(scaled_frames[0], level=9))
    write_apng(demo_path, scaled_frames)
    print(f"Wrote {still_path.name} ({WIDTH}x{HEIGHT})")
    print(f"Wrote {demo_path.name} ({WIDTH}x{HEIGHT}, {len(frames)} frames)")


if __name__ == "__main__":
    main()
