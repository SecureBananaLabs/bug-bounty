from pathlib import Path

from PIL import Image, ImageDraw


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent if SCRIPT_DIR.name == "scripts" else SCRIPT_DIR
ASSET = (
    ROOT / "assets" / "pixel-art" / "review-gate-garden.png"
    if SCRIPT_DIR.name == "scripts"
    else ROOT / "review-gate-garden.png"
)
DEMO = (
    ROOT / "demos" / "review-gate-garden-demo.gif"
    if SCRIPT_DIR.name == "scripts"
    else ROOT / "review-gate-garden-demo.gif"
)

SCALE = 2
SIZE = 128

PALETTE = {
    "midnight": (16, 18, 34),
    "deep": (24, 31, 50),
    "tile": (32, 43, 68),
    "line": (65, 84, 120),
    "mint": (80, 220, 170),
    "green": (42, 170, 120),
    "gold": (245, 190, 72),
    "amber": (214, 132, 51),
    "cream": (248, 231, 166),
    "coral": (225, 92, 92),
    "blue": (76, 154, 225),
    "violet": (137, 105, 210),
    "shadow": (8, 10, 18),
}


def rect(draw, xy, colour):
    draw.rectangle(xy, fill=PALETTE[colour])


def draw_scene(beacon_frame=0):
    img = Image.new("RGB", (SIZE, SIZE), PALETTE["midnight"])
    draw = ImageDraw.Draw(img)

    # Background code-grid wall.
    for y in range(0, SIZE, 8):
        colour = PALETTE["deep"] if (y // 8) % 2 == 0 else PALETTE["tile"]
        draw.line((0, y, SIZE, y), fill=colour)
    for x in range(0, SIZE, 8):
        draw.line((x, 0, x, SIZE), fill=PALETTE["deep"])

    # Distant review skyline.
    for x, h in [(8, 20), (20, 13), (32, 24), (94, 19), (106, 27), (118, 15)]:
        rect(draw, (x, 42 - h, x + 7, 42), "tile")
        rect(draw, (x + 2, 25, x + 3, 26), "blue")
        rect(draw, (x + 5, 33, x + 6, 34), "mint")

    # Ground and rails.
    rect(draw, (0, 88, 127, 127), "shadow")
    rect(draw, (0, 90, 127, 94), "line")
    rect(draw, (0, 100, 127, 104), "tile")
    for x in range(0, 128, 16):
        rect(draw, (x, 96, x + 7, 99), "deep")
        rect(draw, (x + 5, 106, x + 11, 109), "line")

    # Central gate frame.
    rect(draw, (40, 38, 88, 92), "line")
    rect(draw, (44, 42, 84, 88), "midnight")
    rect(draw, (48, 46, 80, 86), "deep")
    rect(draw, (52, 50, 76, 84), "shadow")
    rect(draw, (39, 34, 89, 39), "gold")
    rect(draw, (44, 29, 84, 33), "amber")
    rect(draw, (57, 23, 71, 28), "cream")

    # Bounty beacon above the gate.
    glow = ["gold", "cream", "mint"][beacon_frame % 3]
    rect(draw, (60, 12, 68, 20), glow)
    rect(draw, (58, 14, 70, 18), glow)
    rect(draw, (62, 8, 66, 10), "cream")
    for dx, dy in [(-10, 6), (16, 6), (-6, -4), (12, -4)]:
        rect(draw, (62 + dx, 15 + dy, 64 + dx, 17 + dy), "gold")

    # Audit garden beds with packet sprouts.
    for x in [18, 28, 92, 102]:
        rect(draw, (x, 80, x + 10, 84), "green")
        rect(draw, (x + 3, 73, x + 7, 79), "mint")
        rect(draw, (x + 1, 70, x + 4, 73), "cream")
        rect(draw, (x + 6, 69, x + 9, 72), "gold")

    # Review cards moving towards the gate.
    cards = [(16, 58, "blue"), (30, 64, "mint"), (88, 59, "violet"), (102, 65, "coral")]
    for x, y, colour in cards:
        rect(draw, (x, y, x + 13, y + 10), "cream")
        rect(draw, (x + 2, y + 2, x + 11, y + 3), colour)
        rect(draw, (x + 2, y + 6, x + 8, y + 7), "line")

    # Payout stones inside the gate.
    for x, y in [(57, 69), (65, 64), (70, 73), (60, 78)]:
        rect(draw, (x, y, x + 5, y + 5), "gold")
        rect(draw, (x + 1, y + 1, x + 4, y + 2), "cream")

    # Checker shadows and final pixel polish.
    for x in range(4, 124, 12):
        rect(draw, (x, 116, x + 4, 119), "deep")
    for y in range(52, 84, 8):
        rect(draw, (50, y, 53, y + 3), "line")
        rect(draw, (75, y + 2, 78, y + 5), "line")

    return img


def write_png():
    ASSET.parent.mkdir(parents=True, exist_ok=True)
    img = draw_scene()
    img.save(ASSET, "PNG")


def write_demo():
    DEMO.parent.mkdir(parents=True, exist_ok=True)
    frames = []
    for i in range(3):
        frame = draw_scene(i).resize((SIZE * SCALE, SIZE * SCALE), Image.Resampling.NEAREST)
        frames.append(frame)
    frames[0].save(
        DEMO,
        save_all=True,
        append_images=frames[1:],
        duration=170,
        loop=0,
        optimize=False,
    )


def validate():
    img = Image.open(ASSET)
    if img.format != "PNG" or img.size != (128, 128):
        raise SystemExit(f"Invalid PNG output: {img.format} {img.size}")
    gif = Image.open(DEMO)
    if gif.format != "GIF" or gif.size != (256, 256):
        raise SystemExit(f"Invalid GIF output: {gif.format} {gif.size}")


if __name__ == "__main__":
    write_png()
    write_demo()
    validate()
    print(f"wrote {ASSET.name} 128x128 PNG")
    print(f"wrote {DEMO.name} 256x256 GIF")
