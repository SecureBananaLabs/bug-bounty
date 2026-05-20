#!/usr/bin/env python3
"""Generate original 128x128 pixel art for issue #80.

Theme: anonymous agent payout arcade.
This script is deterministic and uses only Pillow drawing primitives.
"""
from PIL import Image, ImageDraw

SCALE = 4
W = H = 128
OUT = "assets/pixel-art/agent-payout-arcade.png"

PALETTE = {
    "bg0": (9, 12, 24, 255),
    "bg1": (15, 21, 43, 255),
    "grid": (31, 47, 85, 255),
    "cabinet": (36, 31, 65, 255),
    "cabinet_hi": (70, 57, 120, 255),
    "screen": (13, 38, 49, 255),
    "cyan": (40, 221, 232, 255),
    "green": (83, 250, 156, 255),
    "gold": (255, 198, 76, 255),
    "orange": (245, 124, 65, 255),
    "pink": (237, 80, 163, 255),
    "white": (226, 238, 255, 255),
    "shadow": (4, 6, 12, 255),
}

def rect(d, xy, c):
    d.rectangle(xy, fill=PALETTE[c])

def line(d, xy, c, width=1):
    d.line(xy, fill=PALETTE[c], width=width)

def main():
    img = Image.new("RGBA", (W, H), PALETTE["bg0"])
    d = ImageDraw.Draw(img)

    # Subtle circuit grid background.
    for x in range(0, W, 16):
        line(d, [(x, 0), (x, H)], "bg1")
    for y in range(0, H, 16):
        line(d, [(0, y), (W, y)], "bg1")
    for x in range(8, W, 24):
        for y in range(8, H, 24):
            rect(d, [x, y, x+2, y+2], "grid")

    # Arcade cabinet silhouette.
    rect(d, [27, 21, 100, 113], "shadow")
    rect(d, [30, 16, 97, 108], "cabinet")
    rect(d, [35, 22, 92, 66], "cabinet_hi")
    rect(d, [39, 26, 88, 62], "screen")
    rect(d, [42, 29, 85, 59], "bg0")

    # Screen: tiny anonymous agent with mask.
    rect(d, [57, 35, 70, 50], "white")
    rect(d, [54, 39, 73, 51], "white")
    rect(d, [55, 41, 72, 46], "shadow")
    rect(d, [58, 42, 61, 44], "cyan")
    rect(d, [66, 42, 69, 44], "cyan")
    rect(d, [61, 50, 67, 56], "cabinet_hi")
    line(d, [(49, 55), (55, 49)], "green", 2)
    line(d, [(79, 55), (73, 49)], "green", 2)

    # Cabinet controls and approval lights.
    rect(d, [37, 72, 90, 85], "bg0")
    for i, c in enumerate(["green", "gold", "pink"]):
        x = 45 + i*14
        d.ellipse([x, 74, x+7, 81], fill=PALETTE[c])
    line(d, [(75, 77), (86, 77)], "cyan", 2)

    # Payout coin tray.
    rect(d, [43, 91, 84, 101], "shadow")
    rect(d, [46, 88, 81, 98], "cabinet_hi")
    d.ellipse([55, 80, 74, 99], fill=PALETTE["gold"], outline=PALETTE["orange"])
    rect(d, [63, 84, 66, 95], "orange")
    rect(d, [60, 87, 69, 90], "orange")

    # Neon side rails.
    line(d, [(25, 24), (25, 103)], "pink", 2)
    line(d, [(102, 24), (102, 103)], "cyan", 2)
    line(d, [(30, 111), (97, 111)], "green", 2)

    # Four corner spark pixels.
    for x, y, c in [(15,18,"cyan"),(111,14,"gold"),(16,111,"pink"),(111,110,"green")]:
        rect(d, [x, y, x+3, y+3], c)
        line(d, [(x-3,y+1),(x-1,y+1)], c)
        line(d, [(x+5,y+1),(x+7,y+1)], c)

    img.save(OUT)
    print(f"wrote {OUT} {img.size}")

if __name__ == "__main__":
    main()
