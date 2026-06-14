"""Generate the milestone_signal_bay pixel-art asset for issue #80."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PIXEL_ART = ROOT / "assets" / "pixel-art" / "milestone_signal_bay.png"
DEMO = ROOT / "assets" / "demos" / "milestone_signal_bay_80.gif"
SIZE = 128
SCALE = 4

PALETTE = {
    "bg": (13, 18, 30),
    "floor": (23, 32, 48),
    "grid": (37, 54, 76),
    "shadow": (7, 10, 18),
    "panel": (32, 44, 64),
    "panel_hi": (55, 79, 106),
    "ink": (123, 151, 174),
    "cyan": (72, 207, 225),
    "blue": (82, 126, 255),
    "mint": (81, 225, 151),
    "gold": (255, 196, 87),
    "orange": (237, 109, 79),
    "pink": (231, 92, 165),
    "white": (221, 239, 241),
}


FONT = {
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "B": ["110", "101", "110", "101", "110"],
    "M": ["101", "111", "111", "101", "101"],
    "O": ["111", "101", "101", "101", "111"],
    "P": ["110", "101", "110", "100", "100"],
    "R": ["110", "101", "110", "101", "101"],
    "V": ["101", "101", "101", "101", "010"],
    "Y": ["101", "101", "010", "010", "010"],
}


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: str) -> None:
    draw.rectangle(xy, fill=PALETTE[fill])


def line(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    fill: str,
    width: int = 1,
) -> None:
    draw.line(xy, fill=PALETTE[fill], width=width)


def glyph(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, fill: str) -> None:
    cursor = x
    for char in text:
        pattern = FONT.get(char)
        if not pattern:
            cursor += 4
            continue
        for row, bits in enumerate(pattern):
            for col, bit in enumerate(bits):
                if bit == "1":
                    rect(draw, (cursor + col, y + row, cursor + col, y + row), fill)
        cursor += 4


def glow_rect(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    core: str,
    halo: str,
) -> None:
    x0, y0, x1, y1 = xy
    rect(draw, (x0 - 1, y0 - 1, x1 + 1, y1 + 1), halo)
    rect(draw, xy, core)


def draw_scene(frame: int = 0) -> Image.Image:
    im = Image.new("RGB", (SIZE, SIZE), PALETTE["bg"])
    draw = ImageDraw.Draw(im)

    # Distant bay wall.
    for y in range(0, 74, 8):
        line(draw, (0, y, 127, y), "shadow")
    for x in range(4, 128, 12):
        line(draw, (x, 0, x, 72), "grid")
    rect(draw, (0, 74, 127, 127), "floor")
    for y in range(78, 128, 8):
        line(draw, (0, y, 127, y), "grid")
    for x in range(-18, 128, 16):
        line(draw, (x, 127, x + 36, 76), "grid")

    # Main signal bay body.
    rect(draw, (26, 32, 101, 99), "shadow")
    rect(draw, (28, 29, 99, 96), "panel")
    rect(draw, (31, 32, 96, 93), "panel_hi")
    rect(draw, (34, 35, 93, 90), "panel")
    line(draw, (34, 35, 93, 35), "cyan", 1)
    line(draw, (34, 90, 93, 90), "blue", 1)

    # Upper proof monitor.
    rect(draw, (42, 11, 85, 27), "shadow")
    rect(draw, (44, 9, 83, 25), "panel_hi")
    rect(draw, (47, 12, 80, 22), "bg")
    glyph(draw, 51, 15, "PROV", "mint")
    glow_rect(draw, (75, 15, 77, 17), "gold", "orange")

    # Central milestone signal column.
    rect(draw, (57, 39, 70, 81), "shadow")
    rect(draw, (59, 37, 68, 79), "panel_hi")
    rect(draw, (62, 32, 65, 84), "cyan" if frame % 8 < 4 else "blue")
    for offset, color in [(42, "mint"), (51, "gold"), (60, "pink"), (69, "cyan")]:
        lit = ((frame // 4) % 4) == ((offset - 42) // 9)
        glow_rect(draw, (55, offset, 59, offset + 3), color if lit else "ink", "panel")
        glow_rect(draw, (69, offset, 73, offset + 3), color if lit else "ink", "panel")

    # Four milestone stations.
    stations = [
        (18, 54, "M1", "mint"),
        (18, 76, "M2", "gold"),
        (91, 54, "M3", "pink"),
        (91, 76, "M4", "cyan"),
    ]
    for i, (x, y, label, color) in enumerate(stations):
        lit = ((frame + i * 2) // 5) % 3 != 0
        rect(draw, (x - 2, y - 2, x + 20, y + 14), "shadow")
        rect(draw, (x, y, x + 18, y + 12), "panel_hi")
        rect(draw, (x + 2, y + 2, x + 16, y + 10), "bg")
        glyph(draw, x + 4, y + 5, label, color if lit else "ink")
        glow_rect(draw, (x + 14, y + 3, x + 15, y + 4), color if lit else "ink", "panel")

    # Circuit rails from stations to signal core.
    for start, bend, end, color in [
        ((37, 60), (49, 60), (55, 48), "mint"),
        ((37, 82), (48, 82), (55, 72), "gold"),
        ((91, 60), (80, 60), (73, 48), "pink"),
        ((91, 82), (80, 82), (73, 72), "cyan"),
    ]:
        line(draw, (*start, *bend), color, 1)
        line(draw, (*bend, *end), color, 1)

    # Review gates and status chips.
    rect(draw, (37, 99, 90, 114), "shadow")
    rect(draw, (39, 97, 88, 112), "panel_hi")
    rect(draw, (42, 100, 85, 109), "bg")
    glyph(draw, 46, 102, "OK", "mint")
    glyph(draw, 64, 102, "BY", "gold")
    for x, color in [(80, "mint"), (84, "gold")]:
        glow_rect(draw, (x, 102, x + 1, 103), color, "panel")

    # Animated signal packets.
    path_points = [(13, 28), (27, 28), (34, 35), (62, 32), (94, 35), (111, 25)]
    for a, b in zip(path_points, path_points[1:]):
        line(draw, (*a, *b), "ink", 1)
    packet_index = frame % len(path_points)
    px, py = path_points[packet_index]
    glow_rect(draw, (px - 1, py - 1, px + 1, py + 1), "white", "cyan")

    # Small side tools and signature pixels.
    rect(draw, (8, 103, 22, 116), "shadow")
    rect(draw, (10, 101, 20, 114), "panel_hi")
    line(draw, (12, 106, 18, 106), "orange")
    line(draw, (15, 103, 15, 112), "orange")
    rect(draw, (106, 101, 119, 114), "shadow")
    rect(draw, (108, 99, 117, 112), "panel_hi")
    line(draw, (110, 104, 115, 109), "mint")
    line(draw, (115, 104, 110, 109), "mint")

    return im


def main() -> None:
    PIXEL_ART.parent.mkdir(parents=True, exist_ok=True)
    DEMO.parent.mkdir(parents=True, exist_ok=True)

    image = draw_scene(0)
    image.save(PIXEL_ART)

    frames = [
        draw_scene(i).resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST)
        for i in range(24)
    ]
    frames[0].save(
        DEMO,
        save_all=True,
        append_images=frames[1:],
        duration=90,
        loop=0,
        optimize=False,
    )
    print(f"wrote {PIXEL_ART.relative_to(ROOT)}")
    print(f"wrote {DEMO.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
