from PIL import Image, ImageDraw


SCALE = 2
SIZE = 64
OUT = "codex-ledger-lantern.png"

palette = {
    "ink": "#121826",
    "night": "#1f2a3d",
    "floor": "#27364f",
    "floor_line": "#35476a",
    "wood_dark": "#5a3a25",
    "wood": "#875633",
    "wood_light": "#b87945",
    "paper": "#e7dcc1",
    "paper_shadow": "#bcae90",
    "green": "#4cc38a",
    "green_dark": "#26845d",
    "gold": "#f6c453",
    "gold_dark": "#b7782d",
    "orange": "#f08a3c",
    "blue": "#72b7f7",
    "blue_dark": "#2d6f9f",
    "white": "#fff7d6",
}


def rect(draw, xy, color):
    draw.rectangle(xy, fill=palette[color])


def main():
    image = Image.new("RGB", (SIZE, SIZE), palette["ink"])
    draw = ImageDraw.Draw(image)

    # Back wall and pixel floor.
    rect(draw, (0, 0, 63, 39), "night")
    rect(draw, (0, 40, 63, 63), "floor")
    for y in (44, 50, 56, 62):
        rect(draw, (0, y, 63, y), "floor_line")
    for x in range(-24, 65, 12):
        draw.line((x, 63, x + 30, 40), fill=palette["floor_line"])

    # Table.
    rect(draw, (8, 35, 55, 39), "wood_light")
    rect(draw, (9, 40, 54, 48), "wood")
    rect(draw, (11, 49, 15, 60), "wood_dark")
    rect(draw, (48, 49, 52, 60), "wood_dark")
    rect(draw, (7, 38, 56, 40), "wood_dark")

    # Open ledger.
    rect(draw, (18, 25, 45, 36), "paper_shadow")
    rect(draw, (17, 24, 31, 35), "paper")
    rect(draw, (33, 24, 47, 35), "paper")
    rect(draw, (31, 24, 33, 36), "wood_dark")
    for y in (27, 30, 33):
        rect(draw, (20, y, 29, y), "green_dark")
        rect(draw, (35, y, 44, y), "blue_dark")
    rect(draw, (21, 25, 27, 25), "gold")
    rect(draw, (36, 25, 42, 25), "gold")

    # Lantern with warm glow.
    rect(draw, (7, 18, 18, 31), "orange")
    rect(draw, (9, 20, 16, 29), "gold")
    rect(draw, (11, 22, 14, 27), "white")
    rect(draw, (9, 17, 16, 18), "wood_dark")
    rect(draw, (10, 15, 15, 16), "wood_dark")
    rect(draw, (6, 31, 19, 32), "wood_dark")
    for xy in ((4, 22, 5, 27), (20, 22, 21, 27), (8, 14, 9, 14), (17, 14, 18, 14)):
        rect(draw, xy, "gold_dark")

    # Secure payout path.
    for i, xy in enumerate(((22, 44, 26, 47), (29, 47, 33, 50), (36, 50, 40, 53), (43, 53, 47, 56))):
        rect(draw, xy, "gold" if i % 2 == 0 else "gold_dark")
    rect(draw, (50, 54, 57, 58), "gold")
    rect(draw, (52, 52, 55, 52), "white")

    # Shield and check mark.
    rect(draw, (48, 18, 56, 23), "blue")
    rect(draw, (49, 24, 55, 28), "blue")
    rect(draw, (51, 29, 53, 31), "blue_dark")
    rect(draw, (50, 23, 51, 24), "white")
    rect(draw, (52, 25, 53, 26), "white")
    rect(draw, (54, 22, 55, 23), "white")

    # Small stars.
    for x, y, color in ((24, 8, "gold"), (38, 12, "blue"), (55, 7, "white"), (4, 8, "green")):
        rect(draw, (x, y, x, y), color)
        rect(draw, (x - 1, y, x + 1, y), color)
        rect(draw, (x, y - 1, x, y + 1), color)

    image = image.resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST)
    image.save(OUT, optimize=True)


if __name__ == "__main__":
    main()
