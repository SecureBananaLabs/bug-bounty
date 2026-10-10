from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "pixel-art"
PNG_PATH = OUT_DIR / "aurora_patch_forge.png"
GIF_PATH = OUT_DIR / "aurora_patch_forge_demo.gif"
MP4_PATH = OUT_DIR / "aurora_patch_forge_demo.mp4"


SCALE = 6
SIZE = 128


PALETTE = {
    "sky0": (12, 18, 38),
    "sky1": (18, 31, 66),
    "sky2": (28, 45, 86),
    "aurora_a": (66, 231, 181),
    "aurora_b": (82, 168, 255),
    "aurora_c": (180, 103, 255),
    "stone": (75, 83, 105),
    "stone_dark": (46, 52, 70),
    "steel": (128, 147, 167),
    "steel_light": (187, 204, 218),
    "ember": (255, 149, 69),
    "ember2": (255, 218, 101),
    "coin": (239, 199, 85),
    "coin_dark": (173, 119, 48),
    "branch": (107, 231, 255),
    "branch_core": (236, 255, 255),
    "screen": (23, 45, 64),
    "screen_light": (111, 255, 208),
    "ink": (7, 10, 20),
}


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], color: str) -> None:
    draw.rectangle(xy, fill=PALETTE[color])


def line(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[int, int]],
    color: str,
    width: int = 1,
) -> None:
    draw.line(points, fill=PALETTE[color], width=width)


def draw_background(draw: ImageDraw.ImageDraw, glow: int) -> None:
    for y in range(SIZE):
        if y < 44:
            color = PALETTE["sky0"]
        elif y < 86:
            color = PALETTE["sky1"]
        else:
            color = PALETTE["sky2"]
        draw.line([(0, y), (SIZE, y)], fill=color)

    # Blocky aurora ribbons.
    for i in range(0, SIZE, 4):
        y = 22 + int(math.sin((i + glow) / 10) * 5)
        rect(draw, (i, y, i + 3, y + 1), "aurora_a")
        if i % 8 == 0:
            rect(draw, (i, y + 3, i + 3, y + 4), "aurora_b")
        if i % 16 == 0:
            rect(draw, (i, y + 6, i + 3, y + 7), "aurora_c")

    stars = [
        (10, 12),
        (21, 29),
        (33, 9),
        (50, 20),
        (70, 12),
        (86, 31),
        (101, 16),
        (116, 27),
    ]
    for index, (x, y) in enumerate(stars):
        if (index + glow // 4) % 3:
            rect(draw, (x, y, x + 1, y + 1), "steel_light")
        else:
            rect(draw, (x - 1, y, x + 2, y), "steel_light")
            rect(draw, (x, y - 1, x + 1, y + 2), "steel_light")


def draw_forge(draw: ImageDraw.ImageDraw, glow: int) -> None:
    # Workbench and forge body.
    rect(draw, (18, 87, 111, 100), "stone_dark")
    rect(draw, (22, 82, 106, 91), "stone")
    rect(draw, (31, 75, 58, 86), "stone_dark")
    rect(draw, (34, 71, 55, 80), "stone")

    # Ember window.
    rect(draw, (37, 76, 52, 81), "ink")
    ember = "ember2" if glow % 8 < 4 else "ember"
    rect(draw, (39, 77, 43, 80), ember)
    rect(draw, (46, 77, 50, 80), "ember")

    # Anvil.
    rect(draw, (64, 72, 91, 78), "steel")
    rect(draw, (58, 75, 98, 81), "steel_light")
    rect(draw, (67, 82, 88, 88), "steel")
    rect(draw, (61, 88, 94, 92), "stone_dark")

    # Pull-request branch being forged.
    line(draw, [(44, 58), (58, 58), (70, 67), (83, 67)], "branch_core", 2)
    line(draw, [(44, 58), (58, 58), (70, 67), (83, 67)], "branch", 4)
    rect(draw, (39, 54, 47, 62), "branch_core")
    rect(draw, (78, 63, 86, 71), "branch_core")
    rect(draw, (55, 55, 62, 62), "aurora_a")

    # Sparks.
    sparks = [
        (61, 64),
        (72, 58),
        (84, 55),
        (91, 67),
        (51, 68),
        (96, 76),
        (67, 51),
    ]
    for index, (x, y) in enumerate(sparks):
        offset = (glow + index * 3) % 12
        if offset < 8:
            rect(draw, (x, y - offset // 2, x + 1, y - offset // 2 + 1), "ember2")


def draw_side_details(draw: ImageDraw.ImageDraw) -> None:
    # Review screen.
    rect(draw, (12, 58, 31, 78), "stone_dark")
    rect(draw, (14, 60, 29, 74), "screen")
    rect(draw, (17, 64, 26, 65), "screen_light")
    rect(draw, (17, 68, 23, 69), "screen_light")
    rect(draw, (17, 72, 28, 72), "aurora_b")

    # Coin stack.
    for y in [84, 80, 76]:
        rect(draw, (103, y, 116, y + 3), "coin_dark")
        rect(draw, (104, y, 115, y + 1), "coin")
    rect(draw, (106, 71, 113, 78), "coin")
    rect(draw, (108, 73, 111, 75), "coin_dark")

    # Stone floor.
    for x in range(0, SIZE, 8):
        color = "stone_dark" if x % 16 == 0 else "stone"
        rect(draw, (x, 101, x + 7, 104), color)
    rect(draw, (0, 105, SIZE, 127), "ink")
    for x in range(0, SIZE, 10):
        rect(draw, (x, 106, x + 6, 107), "stone_dark")


def make_frame(glow: int = 0) -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), PALETTE["sky0"])
    draw = ImageDraw.Draw(image)
    draw_background(draw, glow)
    draw_forge(draw, glow)
    draw_side_details(draw)
    return image


def nearest(image: Image.Image) -> Image.Image:
    return image.resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST)


def save_demo(frames: list[Image.Image]) -> None:
    scaled = [nearest(frame) for frame in frames]
    scaled[0].save(
        GIF_PATH,
        save_all=True,
        append_images=scaled[1:],
        duration=90,
        loop=0,
        optimize=False,
    )

    try:
        import imageio.v3 as iio

        iio.imwrite(MP4_PATH, [frame for frame in scaled], fps=12, codec="libx264")
    except Exception:
        # The GIF is still a reviewable motion proof when MP4 support is unavailable.
        pass


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    image = make_frame(0)
    image.save(PNG_PATH)

    frames = [make_frame(i) for i in range(36)]
    save_demo(frames)
    print(PNG_PATH.relative_to(ROOT))
    print(GIF_PATH.relative_to(ROOT))
    if MP4_PATH.exists():
        print(MP4_PATH.relative_to(ROOT))


if __name__ == "__main__":
    main()
