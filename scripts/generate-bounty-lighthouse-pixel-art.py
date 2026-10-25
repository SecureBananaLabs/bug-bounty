from pathlib import Path

from PIL import Image, ImageDraw


SIZE = 128
SCALE = 4
OUT = Path("assets/pixel-art/bounty-lighthouse.png")


def rect(draw, xy, fill):
    draw.rectangle(xy, fill=fill)


def poly(draw, points, fill):
    draw.polygon(points, fill=fill)


def main():
    img = Image.new("RGBA", (SIZE, SIZE), "#111827")
    draw = ImageDraw.Draw(img)

    palette = {
        "sky_top": "#13233f",
        "sky_mid": "#203a5f",
        "sky_low": "#31506f",
        "sea_dark": "#123044",
        "sea_mid": "#1f5b6c",
        "sea_light": "#3fa7a2",
        "beam": "#ffd166",
        "beam_soft": "#f5c542",
        "gold": "#f6b73c",
        "banana": "#ffd54a",
        "stone": "#d9e2ec",
        "stone_shadow": "#8fa4b8",
        "roof": "#ef476f",
        "ink": "#0b1320",
        "green": "#39d98a",
        "white": "#f8fafc",
    }

    for y in range(SIZE):
        if y < 38:
            color = palette["sky_top"]
        elif y < 72:
            color = palette["sky_mid"]
        else:
            color = palette["sky_low"]
        draw.line([(0, y), (SIZE, y)], fill=color)

    # Signal beams for scope, proof, review, merge, and payout.
    for offset, color in [(0, palette["beam_soft"]), (5, palette["beam"])]:
        poly(draw, [(62, 26), (127, 9 + offset), (127, 20 + offset), (62, 34)], color)
        poly(draw, [(66, 29), (0, 50 + offset), (0, 60 + offset), (66, 37)], color)

    # Stars and review checkpoints.
    for x, y in [(12, 12), (27, 28), (103, 35), (116, 55), (87, 10), (8, 75)]:
        rect(draw, (x, y, x + 1, y + 1), palette["white"])
    for x, y in [(18, 45), (33, 41), (96, 22), (111, 18)]:
        rect(draw, (x, y, x + 2, y + 2), palette["green"])

    # Ledger-grid sea.
    rect(draw, (0, 82, 127, 127), palette["sea_dark"])
    for y in range(86, 124, 8):
        draw.line([(0, y), (127, y + 6)], fill=palette["sea_mid"])
    for x in range(0, 128, 16):
        draw.line([(x, 84), (x + 18, 127)], fill="#16465b")
    for y in [96, 112]:
        draw.line([(0, y), (127, y)], fill=palette["sea_light"])

    # Island and lighthouse base.
    poly(draw, [(30, 101), (46, 88), (78, 87), (99, 101), (108, 120), (20, 120)], "#3d2f2a")
    rect(draw, (43, 66, 83, 106), palette["stone_shadow"])
    rect(draw, (47, 62, 79, 106), palette["stone"])
    for y in [70, 82, 94]:
        draw.line([(47, y), (79, y)], fill=palette["stone_shadow"])
    for x in [55, 67]:
        draw.line([(x, 62), (x - 2, 106)], fill="#b8c7d6")

    # Lantern room and roof.
    rect(draw, (50, 45, 76, 62), palette["ink"])
    rect(draw, (53, 48, 73, 59), palette["gold"])
    rect(draw, (57, 51, 69, 56), palette["banana"])
    poly(draw, [(47, 45), (63, 32), (79, 45)], palette["roof"])
    rect(draw, (60, 28, 66, 35), palette["roof"])

    # Bounty ticket door and proof lights.
    rect(draw, (57, 90, 69, 106), palette["ink"])
    rect(draw, (61, 94, 64, 98), palette["banana"])
    for i, color in enumerate([palette["green"], palette["beam"], palette["roof"], palette["white"], palette["gold"]]):
        rect(draw, (34 + i * 12, 112, 40 + i * 12, 116), color)

    # Pixel border and crisp scale-up.
    rect(draw, (0, 0, 127, 127), None)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = img.resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST)
    img.save(OUT)
    print(f"wrote {OUT} {img.width}x{img.height}")


if __name__ == "__main__":
    main()
