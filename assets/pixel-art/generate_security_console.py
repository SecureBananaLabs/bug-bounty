from PIL import Image, ImageDraw


SCALE = 4
SIZE = 64

palette = {
    "bg": (12, 18, 24),
    "panel": (25, 34, 44),
    "panel_dark": (17, 24, 31),
    "edge": (65, 86, 105),
    "green": (78, 222, 128),
    "green_dark": (35, 132, 82),
    "amber": (240, 190, 78),
    "red": (236, 88, 88),
    "blue": (88, 166, 255),
    "white": (220, 238, 232),
}


def rect(draw, xy, color):
    draw.rectangle([v * SCALE for point in xy for v in point], fill=color)


def line(draw, xy, color, width=1):
    draw.line([v * SCALE for point in xy for v in point], fill=color, width=width * SCALE)


img = Image.new("RGB", (SIZE * SCALE, SIZE * SCALE), palette["bg"])
draw = ImageDraw.Draw(img)

# Console frame
rect(draw, ((5, 7), (58, 54)), palette["panel"])
rect(draw, ((7, 10), (56, 52)), palette["panel_dark"])
line(draw, ((5, 7), (58, 7)), palette["edge"], 1)
line(draw, ((5, 54), (58, 54)), palette["edge"], 1)
line(draw, ((5, 7), (5, 54)), palette["edge"], 1)
line(draw, ((58, 7), (58, 54)), palette["edge"], 1)

# Header status lights
rect(draw, ((10, 13), (12, 15)), palette["red"])
rect(draw, ((15, 13), (17, 15)), palette["amber"])
rect(draw, ((20, 13), (22, 15)), palette["green"])
line(draw, ((27, 14), (50, 14)), palette["blue"], 1)

# Shield body
shield = [(32, 20), (44, 24), (42, 38), (32, 47), (22, 38), (20, 24)]
draw.polygon([(x * SCALE, y * SCALE) for x, y in shield], fill=palette["green_dark"])
line(draw, ((32, 21), (42, 25)), palette["green"], 1)
line(draw, ((42, 25), (40, 37)), palette["green"], 1)
line(draw, ((40, 37), (32, 44)), palette["green"], 1)
line(draw, ((32, 44), (24, 37)), palette["green"], 1)
line(draw, ((24, 37), (22, 25)), palette["green"], 1)
line(draw, ((22, 25), (32, 21)), palette["green"], 1)
line(draw, ((32, 25), (32, 41)), palette["green"], 1)
line(draw, ((27, 32), (31, 36)), palette["white"], 1)
line(draw, ((31, 36), (38, 28)), palette["white"], 1)

# Scan traces and terminal blocks
for y in (23, 29, 35, 41):
    line(draw, ((10, y), (18, y)), palette["blue"], 1)
    rect(draw, ((11, y + 2), (15, y + 3)), palette["green"])

for y in (25, 31, 37, 43):
    line(draw, ((47, y), (53, y)), palette["amber"], 1)
    rect(draw, ((49, y + 2), (54, y + 3)), palette["blue"])

# Footer command prompt
line(draw, ((10, 49), (17, 49)), palette["green"], 1)
rect(draw, ((19, 48), (43, 50)), palette["edge"])
rect(draw, ((45, 48), (50, 50)), palette["green"])

img.save("assets/pixel-art/security-console-shield.png")
