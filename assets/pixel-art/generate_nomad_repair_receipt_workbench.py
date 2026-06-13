from __future__ import annotations

from pathlib import Path

import imageio.v2 as imageio
from PIL import Image, ImageDraw


OUT_DIR = Path(__file__).resolve().parent
PNG_PATH = OUT_DIR / "nomad_repair_receipt_workbench.png"
MP4_PATH = OUT_DIR / "nomad_repair_receipt_workbench_demo.mp4"

SCALE = 4
SIZE = 128

PALETTE = {
    "bg": (12, 16, 24),
    "back": (25, 31, 45),
    "shadow": (7, 10, 15),
    "bench": (82, 69, 57),
    "bench_hi": (135, 102, 74),
    "metal": (100, 120, 126),
    "metal_hi": (178, 205, 206),
    "screen": (25, 60, 67),
    "screen_hi": (94, 226, 190),
    "paper": (229, 222, 190),
    "ink": (43, 51, 62),
    "red": (220, 72, 70),
    "amber": (240, 177, 67),
    "green": (78, 218, 126),
    "blue": (85, 147, 232),
    "wire": (174, 91, 210),
}


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], key: str) -> None:
    draw.rectangle(xy, fill=PALETTE[key])


def line(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], key: str, width: int = 1) -> None:
    draw.line(xy, fill=PALETTE[key], width=width)


def draw_base(frame: int = 0) -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), PALETTE["bg"])
    draw = ImageDraw.Draw(img)

    # Workbench wall grid.
    rect(draw, (8, 10, 119, 105), "back")
    for x in range(12, 120, 12):
        line(draw, (x, 12, x, 103), "bg")
    for y in range(16, 104, 11):
        line(draw, (10, y, 118, y), "bg")
    rect(draw, (8, 105, 119, 112), "shadow")

    # Bench.
    rect(draw, (13, 87, 115, 103), "bench")
    rect(draw, (13, 85, 115, 89), "bench_hi")
    rect(draw, (18, 103, 25, 116), "bench")
    rect(draw, (103, 103, 110, 116), "bench")

    # Patched circuit board.
    rect(draw, (17, 44, 56, 78), "screen")
    rect(draw, (19, 46, 54, 50), "screen_hi")
    for x in (22, 32, 43, 51):
        line(draw, (x, 53, x, 73), "green")
    for y in (56, 66, 74):
        line(draw, (20, y, 52, y), "blue")
    rect(draw, (27, 59, 36, 68), "metal")
    rect(draw, (40, 54, 48, 62), "amber")
    rect(draw, (48, 69, 52, 73), "red")
    line(draw, (17, 78, 56, 78), "metal_hi")

    # Receipt printer.
    rect(draw, (68, 38, 101, 76), "metal")
    rect(draw, (71, 41, 98, 53), "screen")
    rect(draw, (75, 45, 94, 48), "screen_hi")
    rect(draw, (72, 56, 97, 61), "shadow")
    rect(draw, (76, 61, 93, 84), "paper")
    line(draw, (79, 66, 89, 66), "ink")
    line(draw, (79, 70, 91, 70), "ink")
    line(draw, (79, 74, 86, 74), "ink")
    rect(draw, (86, 77, 90, 81), "green")
    line(draw, (76, 84, 93, 84), "ink")

    # Payment check light and repair toolkit.
    glow = "green" if frame % 18 < 10 else "amber"
    rect(draw, (104, 32, 114, 42), glow)
    rect(draw, (106, 34, 112, 40), "screen_hi")
    rect(draw, (61, 80, 109, 84), "metal")
    line(draw, (24, 91, 40, 91), "metal_hi", 2)
    line(draw, (36, 87, 46, 97), "metal_hi", 2)
    rect(draw, (44, 94, 48, 98), "red")
    rect(draw, (54, 91, 64, 96), "blue")
    rect(draw, (66, 90, 77, 95), "amber")

    # Nomad signal path: repaired board -> printer -> paid light.
    line(draw, (56, 61, 66, 61), "wire", 2)
    line(draw, (66, 61, 66, 44), "wire", 2)
    line(draw, (101, 47, 107, 37), "wire", 2)
    rect(draw, (62, 57, 66, 61), "screen_hi")
    rect(draw, (99, 44, 103, 48), "screen_hi")

    # Tiny monogram in pixel blocks, not text-dependent.
    rect(draw, (20, 20, 24, 35), "blue")
    rect(draw, (25, 24, 29, 31), "blue")
    rect(draw, (30, 20, 34, 35), "blue")
    rect(draw, (38, 20, 51, 24), "green")
    rect(draw, (38, 25, 42, 35), "green")
    rect(draw, (46, 25, 51, 35), "green")

    # Animated scan sparkle for the demo frames.
    scan_y = 16 + (frame * 3) % 84
    for x in range(14, 116, 8):
        if (x + scan_y + frame) % 17 < 7:
            rect(draw, (x, scan_y, x + 2, scan_y + 1), "screen_hi")

    # Pixel border.
    line(draw, (8, 10, 119, 10), "metal")
    line(draw, (8, 10, 8, 112), "metal")
    line(draw, (119, 10, 119, 112), "shadow")
    line(draw, (8, 112, 119, 112), "shadow")
    return img


def upscale(img: Image.Image) -> Image.Image:
    return img.resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    draw_base(0).save(PNG_PATH)
    frames = [upscale(draw_base(frame)) for frame in range(36)]
    imageio.mimsave(MP4_PATH, frames, fps=12, macro_block_size=1)
    print(PNG_PATH)
    print(MP4_PATH)


if __name__ == "__main__":
    main()
