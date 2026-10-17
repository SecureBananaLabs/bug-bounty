from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PNG_PATH = ROOT / "assets" / "pixel-art" / "settlement-skyline-yzangeren.png"
GIF_PATH = ROOT / "demos" / "settlement-skyline-yzangeren.gif"
SIZE = 128


PALETTE = {
    "sky_top": (12, 18, 37),
    "sky_mid": (24, 38, 64),
    "sky_low": (50, 74, 92),
    "grid": (31, 46, 60),
    "ink": (8, 12, 20),
    "deep": (14, 22, 31),
    "tower": (36, 50, 62),
    "tower_dark": (22, 32, 42),
    "paper": (218, 228, 217),
    "paper_shadow": (151, 166, 153),
    "gold": (245, 190, 72),
    "gold_dark": (162, 112, 42),
    "green": (88, 219, 145),
    "green_dark": (28, 118, 88),
    "blue": (86, 170, 235),
    "red": (227, 85, 92),
    "rail": (116, 135, 153),
    "white": (241, 244, 238),
}


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def blend(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(lerp(a[i], b[i], t) for i in range(3))


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], color: str) -> None:
    draw.rectangle(xy, fill=PALETTE[color])


def draw_base_frame(light_phase: int = 0) -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), PALETTE["sky_top"])
    draw = ImageDraw.Draw(img)

    for y in range(SIZE):
        if y < 76:
            t = y / 76
            color = blend(PALETTE["sky_top"], PALETTE["sky_mid"], t)
        else:
            t = (y - 76) / 52
            color = blend(PALETTE["sky_mid"], PALETTE["sky_low"], t)
        draw.line((0, y, SIZE, y), fill=color)

    for y in range(8, 72, 12):
        for x in range((y // 4) % 8, SIZE, 16):
            rect(draw, (x, y, x + 1, y + 1), "grid")

    # Distant skyline.
    for x, top, width in [(4, 72, 11), (19, 62, 12), (35, 68, 9), (50, 56, 13), (69, 66, 9), (83, 58, 12), (100, 70, 9), (114, 62, 10)]:
        rect(draw, (x, top, x + width, 106), "tower_dark")
        for wy in range(top + 6, 99, 10):
            if (wy + x + light_phase) % 3:
                rect(draw, (x + 3, wy, x + 5, wy + 2), "blue")
        rect(draw, (x, top - 1, x + width, top), "rail")

    # Main proof board and receipt stack.
    rect(draw, (26, 34, 102, 87), "deep")
    rect(draw, (29, 37, 99, 84), "tower")
    rect(draw, (33, 42, 55, 71), "paper")
    rect(draw, (56, 42, 78, 71), "paper")
    rect(draw, (79, 42, 95, 71), "paper_shadow")

    for y in (48, 55, 62):
        rect(draw, (36, y, 51, y + 2), "tower_dark")
        rect(draw, (59, y, 74, y + 2), "tower_dark")
    for y in (49, 58, 67):
        rect(draw, (82, y, 92, y + 1), "tower_dark")

    # Approval light tower.
    pulse = ["green", "gold", "green", "green"][light_phase % 4]
    rect(draw, (105, 45, 119, 83), "deep")
    rect(draw, (108, 50, 116, 58), "red")
    rect(draw, (108, 61, 116, 69), pulse)
    rect(draw, (108, 72, 116, 80), "blue")
    for y in (50, 61, 72):
        rect(draw, (109, y + 1, 113, y + 2), "white")

    # Coins and settlement rail.
    for cx, cy in [(16, 93), (25, 98), (35, 93), (93, 96), (104, 91)]:
        rect(draw, (cx - 4, cy - 4, cx + 4, cy + 4), "gold_dark")
        rect(draw, (cx - 3, cy - 3, cx + 3, cy + 3), "gold")
        rect(draw, (cx - 1, cy - 3, cx + 1, cy + 3), "white")

    rect(draw, (0, 105, 127, 127), "ink")
    for y in (108, 119):
        rect(draw, (7, y, 121, y + 1), "rail")
    for x in range(8, 122, 9):
        rect(draw, (x, 106, x + 2, 123), "tower_dark")

    # Payout lane as small green blocks moving across the rail.
    offset = (light_phase * 7) % 27
    for x in range(-offset, 128, 27):
        rect(draw, (x, 111, x + 7, 116), "green_dark")
        rect(draw, (x + 1, 112, x + 6, 115), "green")

    # Tiny signature pixels in the lower right.
    for idx, color in enumerate(["blue", "green", "gold", "red"]):
        rect(draw, (112 + idx * 3, 124, 113 + idx * 3, 125), color)

    return img


def main() -> None:
    PNG_PATH.parent.mkdir(parents=True, exist_ok=True)
    GIF_PATH.parent.mkdir(parents=True, exist_ok=True)

    frames = [draw_base_frame(i) for i in range(8)]
    frames[0].save(PNG_PATH)
    frames[0].save(
        GIF_PATH,
        save_all=True,
        append_images=frames[1:] + frames[-2:0:-1],
        duration=120,
        loop=0,
    )

    print(f"wrote {PNG_PATH.relative_to(ROOT)}")
    print(f"wrote {GIF_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
