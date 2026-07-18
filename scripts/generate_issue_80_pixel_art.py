from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "pixel-art"
PNG_PATH = OUT_DIR / "automation-workbench.png"
MP4_PATH = OUT_DIR / "automation-workbench-preview.mp4"


PALETTE = {
    "ink": (13, 22, 31),
    "panel": (24, 38, 49),
    "panel2": (34, 53, 63),
    "teal": (41, 190, 176),
    "teal_dark": (19, 116, 111),
    "gold": (239, 176, 63),
    "gold_dark": (172, 112, 39),
    "paper": (224, 236, 221),
    "rose": (218, 94, 89),
    "violet": (127, 103, 190),
    "shadow": (7, 11, 17),
}


def rect(draw, xy, color):
    draw.rectangle(xy, fill=color)


def build_image():
    img = Image.new("RGB", (128, 128), PALETTE["ink"])
    draw = ImageDraw.Draw(img)

    for x in range(0, 128, 8):
        rect(draw, (x, 0, x + 1, 127), (17, 30, 40))
    for y in range(0, 128, 8):
        rect(draw, (0, y, 127, y + 1), (17, 30, 40))

    rect(draw, (0, 100, 127, 127), PALETTE["shadow"])
    rect(draw, (10, 84, 118, 106), PALETTE["panel"])
    rect(draw, (14, 88, 114, 96), PALETTE["panel2"])
    rect(draw, (18, 97, 110, 101), PALETTE["teal_dark"])

    rect(draw, (19, 34, 73, 82), PALETTE["panel2"])
    rect(draw, (23, 38, 69, 76), (10, 21, 27))
    rect(draw, (28, 44, 54, 47), PALETTE["teal"])
    rect(draw, (28, 52, 63, 55), PALETTE["teal_dark"])
    rect(draw, (28, 60, 47, 63), PALETTE["gold"])
    rect(draw, (23, 78, 69, 82), PALETTE["shadow"])

    rect(draw, (82, 35, 111, 64), PALETTE["panel2"])
    rect(draw, (87, 40, 106, 59), PALETTE["gold_dark"])
    rect(draw, (91, 44, 102, 55), PALETTE["gold"])
    rect(draw, (95, 48, 98, 51), PALETTE["paper"])

    nodes = [(30, 91), (50, 91), (70, 91), (90, 91)]
    for i, (x, y) in enumerate(nodes):
        color = PALETTE["teal"] if i % 2 == 0 else PALETTE["gold"]
        rect(draw, (x - 3, y - 3, x + 3, y + 3), color)
        if i:
            px, py = nodes[i - 1]
            rect(draw, (px + 4, py - 1, x - 4, y + 1), PALETTE["teal_dark"])

    rect(draw, (68, 58, 84, 61), PALETTE["teal"])
    rect(draw, (82, 58, 85, 75), PALETTE["teal"])
    rect(draw, (85, 72, 97, 75), PALETTE["teal"])
    rect(draw, (96, 64, 99, 75), PALETTE["teal"])

    for x, y, c in [
        (13, 20, PALETTE["teal"]),
        (42, 16, PALETTE["gold"]),
        (80, 18, PALETTE["violet"]),
        (109, 22, PALETTE["rose"]),
        (112, 74, PALETTE["teal"]),
    ]:
        rect(draw, (x, y, x + 3, y + 3), c)

    rect(draw, (36, 107, 42, 116), PALETTE["panel2"])
    rect(draw, (86, 107, 92, 116), PALETTE["panel2"])
    rect(draw, (14, 116, 114, 119), PALETTE["shadow"])

    return img


def write_preview(img):
    scale = 4
    base = np.array(img.resize((128 * scale, 128 * scale), Image.Resampling.NEAREST))
    height, width = base.shape[:2]
    writer = cv2.VideoWriter(
        str(MP4_PATH),
        cv2.VideoWriter_fourcc(*"mp4v"),
        12,
        (width, height),
    )
    if not writer.isOpened():
        raise RuntimeError("Could not open MP4 writer")

    for frame in range(36):
        canvas = base.copy()
        glow = 45 + int(30 * np.sin(frame / 4.0))
        overlay = np.zeros_like(canvas)
        overlay[:, :, 1] = glow
        mixed = cv2.addWeighted(canvas, 0.94, overlay, 0.06, 0)
        bgr = cv2.cvtColor(mixed, cv2.COLOR_RGB2BGR)
        writer.write(bgr)
    writer.release()


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = build_image()
    img.save(PNG_PATH)
    write_preview(img)

    check = Image.open(PNG_PATH)
    print(f"wrote {PNG_PATH}")
    print(f"wrote {MP4_PATH}")
    print(f"png_size={check.size[0]}x{check.size[1]} mode={check.mode}")


if __name__ == "__main__":
    main()
