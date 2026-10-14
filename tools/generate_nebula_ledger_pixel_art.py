from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pixel-art" / "nebula-ledger-relay.png"
SCALE = 2
SIZE = 64

PALETTE = {
    "space": (12, 14, 34),
    "deep": (22, 25, 55),
    "violet": (73, 50, 119),
    "cyan": (62, 205, 212),
    "mint": (117, 255, 189),
    "gold": (255, 202, 87),
    "amber": (224, 132, 62),
    "rose": (222, 92, 130),
    "ink": (7, 9, 18),
    "panel": (38, 44, 78),
    "white": (234, 241, 255),
}


def rect(draw, xy, fill):
    draw.rectangle(xy, fill=PALETTE[fill])


def main():
    image = Image.new("RGB", (SIZE, SIZE), PALETTE["space"])
    draw = ImageDraw.Draw(image)

    # Dithered nebula background.
    for y in range(SIZE):
        for x in range(SIZE):
            if (x * 3 + y * 5) % 17 == 0:
                image.putpixel((x, y), PALETTE["deep"])
            if 18 < x < 50 and 10 < y < 47 and (x + y * 2) % 19 == 0:
                image.putpixel((x, y), PALETTE["violet"])

    # Star field.
    for x, y, color in [
        (6, 7, "white"), (13, 28, "cyan"), (20, 5, "gold"), (46, 8, "mint"),
        (57, 17, "white"), (52, 50, "cyan"), (8, 54, "gold"), (31, 58, "white"),
        (59, 59, "rose"), (4, 39, "mint"), (39, 3, "white"),
    ]:
        image.putpixel((x, y), PALETTE[color])
        if color in {"cyan", "gold", "mint"}:
            image.putpixel((x + 1, y), PALETTE[color])

    # Ledger core.
    rect(draw, (23, 19, 41, 45), "panel")
    rect(draw, (24, 20, 40, 44), "ink")
    rect(draw, (26, 22, 38, 42), "panel")
    rect(draw, (28, 24, 36, 27), "gold")
    rect(draw, (28, 30, 36, 31), "cyan")
    rect(draw, (28, 34, 36, 35), "mint")
    rect(draw, (28, 38, 36, 39), "rose")
    rect(draw, (31, 16, 33, 19), "gold")
    rect(draw, (31, 45, 33, 48), "gold")

    # Orbital rails and relay nodes.
    draw.arc((10, 13, 54, 53), 205, 337, fill=PALETTE["cyan"], width=1)
    draw.arc((8, 7, 56, 59), 28, 162, fill=PALETTE["violet"], width=1)
    draw.arc((14, 20, 50, 44), 350, 184, fill=PALETTE["gold"], width=1)

    for x, y, fill in [
        (14, 42, "cyan"), (18, 20, "gold"), (44, 18, "mint"),
        (49, 38, "rose"), (22, 50, "amber"), (42, 50, "cyan"),
    ]:
        rect(draw, (x, y, x + 3, y + 3), fill)
        image.putpixel((x + 1, y + 1), PALETTE["white"])

    # Work packets flowing toward the ledger.
    for x, y, fill in [
        (11, 34, "mint"), (16, 32, "cyan"), (20, 31, "gold"),
        (49, 28, "rose"), (45, 30, "amber"), (41, 31, "gold"),
    ]:
        rect(draw, (x, y, x + 1, y + 1), fill)

    # Payout glow.
    for x, y in [(32, 28), (31, 29), (33, 29), (30, 30), (34, 30), (32, 32)]:
        image.putpixel((x, y), PALETTE["gold"])
    image.putpixel((32, 30), PALETTE["white"])
    image.putpixel((32, 31), PALETTE["white"])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST).save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
