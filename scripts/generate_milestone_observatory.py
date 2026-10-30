from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pixel-art" / "milestone-observatory.png"

SCALE = 4
SIZE = 32

palette = {
    "space": (12, 17, 31),
    "deep": (18, 27, 48),
    "grid": (36, 58, 80),
    "glass": (70, 118, 142),
    "glass_hi": (116, 184, 190),
    "steel": (74, 84, 99),
    "steel_hi": (134, 148, 158),
    "gold": (239, 184, 71),
    "gold_hi": (255, 226, 112),
    "green": (80, 205, 137),
    "blue": (85, 153, 255),
    "rose": (238, 104, 121),
    "violet": (163, 132, 255),
    "white": (229, 238, 246),
}


def rect(draw, x, y, w, h, color):
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=color)


img = Image.new("RGB", (SIZE, SIZE), palette["space"])
draw = ImageDraw.Draw(img)

# A quiet chart-room background with plotted milestone stars.
for y in range(0, SIZE, 4):
    for x in range(0, SIZE, 4):
        if (x + y) % 8 == 0:
            img.putpixel((x, y), palette["deep"])

for x in (4, 10, 16, 22, 28):
    rect(draw, x, 5, 1, 18, palette["grid"])
for y in (6, 11, 16, 21):
    rect(draw, 3, y, 26, 1, palette["grid"])

# Observatory base and dome.
rect(draw, 9, 22, 14, 3, palette["steel"])
rect(draw, 8, 25, 16, 2, palette["steel_hi"])
rect(draw, 11, 27, 10, 2, palette["gold"])
for x in range(10, 23):
    top = 15 + abs(16 - x) // 2
    rect(draw, x, top, 1, 22 - top, palette["glass"])
rect(draw, 13, 17, 7, 1, palette["glass_hi"])
rect(draw, 15, 15, 3, 1, palette["white"])
rect(draw, 16, 14, 1, 1, palette["gold_hi"])

# Telescope and aligned milestone lights.
rect(draw, 17, 14, 8, 2, palette["steel_hi"])
rect(draw, 24, 13, 3, 1, palette["gold_hi"])
rect(draw, 18, 16, 2, 5, palette["steel"])

milestones = [
    (5, 19, palette["green"]),
    (8, 11, palette["blue"]),
    (15, 7, palette["gold_hi"]),
    (22, 10, palette["violet"]),
    (27, 18, palette["rose"]),
]
previous = None
for x, y, color in milestones:
    if previous:
        draw.line((previous[0], previous[1], x, y), fill=palette["gold"], width=1)
    rect(draw, x - 1, y - 1, 3, 3, color)
    img.putpixel((x, y), palette["white"])
    previous = (x, y)

# Small side panels read as scope/test/review/merge/payout indicators.
for i, color in enumerate([palette["green"], palette["blue"], palette["violet"], palette["gold"], palette["rose"]]):
    rect(draw, 3 + i * 5, 29, 3, 1, color)

OUT.parent.mkdir(parents=True, exist_ok=True)
img = img.resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST)
img.save(OUT)
print(f"wrote {OUT} ({img.size[0]}x{img.size[1]})")
