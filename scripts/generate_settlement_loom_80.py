from pathlib import Path

import imageio.v3 as iio
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PNG_PATH = ROOT / "assets" / "pixel-art" / "settlement_loom.png"
DEMO_PATH = ROOT / "assets" / "demos" / "settlement-loom-80-demo.mp4"

SCALE = 6
FPS = 12
FRAME_COUNT = 72

PALETTE = {
    "ink": (15, 18, 31),
    "deep": (24, 30, 47),
    "shadow": (35, 41, 58),
    "rail": (70, 56, 59),
    "bronze": (171, 118, 57),
    "gold": (243, 180, 68),
    "amber": (255, 214, 112),
    "teal": (44, 197, 192),
    "cyan": (122, 231, 219),
    "blue": (66, 123, 211),
    "violet": (139, 98, 211),
    "rose": (236, 82, 128),
    "green": (102, 221, 122),
    "paper": (222, 211, 178),
    "white": (244, 241, 220),
    "black": (7, 9, 16),
}


def rect(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, color: str) -> None:
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=PALETTE[color])


def line(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], color: str, width: int = 1) -> None:
    draw.line(points, fill=PALETTE[color], width=width)


def make_base() -> Image.Image:
    image = Image.new("RGB", (128, 128), PALETTE["ink"])
    draw = ImageDraw.Draw(image)

    for y in range(0, 128, 8):
        for x in range(0, 128, 8):
            color = "deep" if (x // 8 + y // 8) % 2 == 0 else "ink"
            rect(draw, x, y, 8, 8, color)

    for x, y, color in [
        (12, 10, "cyan"),
        (111, 14, "gold"),
        (18, 109, "violet"),
        (103, 102, "teal"),
        (116, 70, "rose"),
        (8, 62, "green"),
    ]:
        rect(draw, x, y, 2, 2, color)

    # Settlement floor and payout rails.
    rect(draw, 14, 104, 100, 5, "rail")
    rect(draw, 18, 111, 92, 3, "bronze")
    for x in range(22, 108, 12):
        rect(draw, x, 108, 6, 2, "gold")

    # Loom frame.
    rect(draw, 27, 24, 7, 78, "bronze")
    rect(draw, 94, 24, 7, 78, "bronze")
    rect(draw, 27, 24, 74, 7, "gold")
    rect(draw, 27, 95, 74, 7, "gold")
    rect(draw, 31, 29, 66, 4, "amber")
    rect(draw, 31, 94, 66, 4, "amber")

    # Contract threads woven through the center.
    warp_colors = ["teal", "cyan", "blue", "violet", "rose", "gold"]
    for idx, x in enumerate(range(38, 91, 8)):
        line(draw, [(x, 31), (x - 4, 49), (x + 5, 69), (x, 96)], warp_colors[idx % len(warp_colors)], 2)
    for idx, y in enumerate(range(40, 89, 8)):
        offset = 3 if idx % 2 else -3
        line(draw, [(31, y), (50, y + offset), (72, y - offset), (97, y)], warp_colors[(idx + 2) % len(warp_colors)], 2)

    # Ledger shuttle and client review lights.
    rect(draw, 53, 56, 23, 13, "paper")
    rect(draw, 56, 59, 17, 2, "black")
    rect(draw, 56, 64, 11, 2, "black")
    rect(draw, 77, 54, 7, 17, "teal")
    rect(draw, 82, 58, 4, 9, "cyan")

    for x, y, color in [(42, 37, "green"), (85, 38, "green"), (40, 87, "rose"), (88, 86, "gold")]:
        rect(draw, x, y, 5, 5, color)
        rect(draw, x + 1, y + 1, 3, 3, "white")

    # Tiny settlement houses tied into the loom.
    for x, h, color in [(20, 10, "blue"), (36, 14, "violet"), (82, 12, "teal"), (101, 15, "rose")]:
        rect(draw, x, 94 - h, 10, h, color)
        rect(draw, x + 2, 90 - h, 6, 4, "gold")
        rect(draw, x + 4, 100 - h, 2, 3, "white")

    # Verified center knot.
    rect(draw, 61, 75, 6, 6, "green")
    rect(draw, 62, 77, 2, 2, "white")
    rect(draw, 64, 76, 2, 2, "white")

    # Small dark pixels sharpen the woven texture.
    for x, y in [(48, 48), (70, 45), (58, 83), (78, 80), (91, 61), (34, 67)]:
        rect(draw, x, y, 2, 2, "shadow")

    return image


def make_demo_frames(base: Image.Image) -> list[np.ndarray]:
    frames: list[np.ndarray] = []
    for frame in range(FRAME_COUNT):
        image = base.copy()
        draw = ImageDraw.Draw(image)
        phase = frame % 24
        pulse = phase if phase < 12 else 24 - phase

        line(draw, [(34 + pulse, 34), (47 + pulse, 53), (52 + pulse, 73), (43 + pulse, 95)], "white", 1)
        line(draw, [(94 - pulse, 41), (76 - pulse, 56), (81 - pulse, 78), (88 - pulse, 96)], "amber", 1)

        for idx, (x, y, color) in enumerate([(42, 37, "green"), (85, 38, "green"), (40, 87, "rose"), (88, 86, "gold")]):
            if (frame // 6 + idx) % 2 == 0:
                rect(draw, x - 1, y - 1, 7, 7, color)
                rect(draw, x + 1, y + 1, 3, 3, "white")

        rail_x = 20 + ((frame * 2) % 84)
        rect(draw, rail_x, 111, 7, 3, "cyan")
        rect(draw, rail_x + 2, 112, 3, 1, "white")

        scaled = image.resize((128 * SCALE, 128 * SCALE), Image.Resampling.NEAREST)
        frames.append(np.asarray(scaled))
    return frames


def main() -> None:
    PNG_PATH.parent.mkdir(parents=True, exist_ok=True)
    DEMO_PATH.parent.mkdir(parents=True, exist_ok=True)

    base = make_base()
    base.save(PNG_PATH, optimize=False)
    iio.imwrite(DEMO_PATH, make_demo_frames(base), fps=FPS, codec="libx264", macro_block_size=1)

    print(f"Wrote {PNG_PATH.relative_to(ROOT)}")
    print(f"Wrote {DEMO_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
