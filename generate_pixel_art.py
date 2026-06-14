#!/usr/bin/env python3
"""Generate pixel art for bounty #80 - a retro freelance coder scene."""
from PIL import Image
import os

W, H = 128, 128
img = Image.new("RGB", (W, H), (20, 20, 35))
pixels = img.load()

# Palette
SKY = (28, 28, 50)
WALL = (45, 40, 55)
FLOOR = (55, 50, 65)
MONITOR_BG = (12, 20, 40)
MONITOR_FG = (0, 255, 100)  # green phosphor
MONITOR_ACCENT = (0, 200, 80)
DESK = (90, 70, 55)
CHAIR = (70, 65, 75)
SKIN = (255, 200, 150)
HAIR = (40, 35, 30)
SHIRT = (60, 120, 200)
COFFEE = (180, 130, 80)
STAR = (255, 255, 200)
CODE_LINES = [(0, 220, 80), (0, 200, 200), (200, 200, 50), (200, 100, 200)]

def rect(x1, y1, x2, y2, color):
    for y in range(y1, y2+1):
        for x in range(x1, x2+1):
            if 0 <= x < W and 0 <= y < H:
                pixels[x, y] = color

def rect_alpha(x1, y1, x2, y2, color, alpha=0.3):
    for y in range(y1, y2+1):
        for x in range(x1, x2+1):
            if 0 <= x < W and 0 <= y < H:
                old = pixels[x, y]
                pixels[x, y] = tuple(int(old[i] * (1-alpha) + color[i] * alpha) for i in range(3))

# Background - room
rect(0, 0, W-1, H-1, SKY)
rect(0, 70, W-1, H-1, WALL)
rect(10, 75, W-11, H-1, FLOOR)

# Window with stars
rect(20, 10, 60, 40, (10, 10, 30))
rect(22, 12, 58, 38, (15, 15, 40))
# Stars
star_positions = [(25,15), (35,18), (50,14), (42,25), (28,30), (55,28), (45,35)]
for sx, sy in star_positions:
    pixels[sx, sy] = STAR
    pixels[sx+1, sy] = STAR
    pixels[sx, sy+1] = STAR
# Moon
for dy in range(-6, 7):
    for dx in range(-6, 7):
        if dx*dx + dy*dy <= 36 and 52+dx < 65:
            pixels[52+dx, 15+dy] = (240, 240, 220)

# Desk
rect(15, 75, 113, 80, DESK)
rect(15, 80, 18, 95, DESK)  # left leg
rect(110, 80, 113, 95, DESK)  # right leg
rect(55, 80, 58, 90, DESK)  # middle leg

# Monitor
rect(35, 30, 93, 72, (15, 15, 20))  # monitor body
rect(38, 33, 90, 69, MONITOR_BG)  # screen
# Screen glow
rect_alpha(38, 33, 90, 69, (0, 255, 100), 0.05)
# Screen content - code lines
code_y = 38
for ci, color in enumerate(CODE_LINES):
    line_len = 10 + ci * 8
    rect(42, code_y, 42 + line_len, code_y + 2, color)
    code_y += 6
# Blinking cursor
rect(85, 60, 87, 62, (0, 255, 100))
# Monitor stand
rect(60, 72, 68, 75, (20, 20, 25))

# Keyboard
rect(30, 82, 98, 86, (35, 35, 45))
# Keys
for ky in range(83, 86):
    for kx in range(34, 96, 5):
        pixels[kx, ky] = (50, 50, 60)

# Person sitting
# Head
for dy in range(-6, 7):
    for dx in range(-6, 7):
        if dx*dx + dy*dy <= 30:
            cx, cy = 25, 55
            if 0 <= cx+dx < W and 0 <= cy+dy < H:
                pixels[cx+dx, cy+dy] = SKIN
# Hair
for dy in range(-7, -3):
    for dx in range(-7, 8):
        if dx*dx + dy*dy <= 35:
            cx, cy = 25, 55
            if 0 <= cx+dx < W and 0 <= cy+dy < H:
                pixels[cx+dx, cy+dy] = HAIR
# Eyes
pixels[22, 54] = (20, 20, 30)
pixels[28, 54] = (20, 20, 30)
# Mouth
rect(24, 59, 27, 59, (180, 120, 100))

# Body
rect(18, 62, 32, 75, SHIRT)  # torso
rect(16, 65, 18, 72, SKIN)  # left arm
rect(10, 72, 18, 74, SKIN)  # left hand on keyboard
rect(32, 65, 34, 70, SKIN)  # right arm
rect(34, 70, 38, 72, SKIN)  # right hand

# Coffee mug
rect(5, 70, 12, 78, COFFEE)
rect(5, 69, 12, 70, (200, 160, 100))  # coffee surface
rect(12, 72, 14, 76, COFFEE)  # handle
# Steam
steam_color = (200, 200, 220)
pixels[7, 67] = steam_color
pixels[8, 66] = steam_color
pixels[9, 67] = steam_color
pixels[7, 64] = steam_color
pixels[10, 65] = steam_color

# Bookshelf (right side)
rect(100, 20, 113, 65, (60, 50, 40))
book_y = 22
book_colors = [(200, 50, 50), (50, 150, 200), (50, 200, 80), (200, 180, 50), (180, 100, 200)]
for bc in book_colors:
    rect(102, book_y, 111, book_y + 7, bc)
    book_y += 9

# Subtle grid lines on floor (perspective)
for floor_y in range(80, 125, 10):
    rect(20, floor_y, 108, floor_y, (60, 55, 70))

# Signature pixel
pixels[W-8, H-8] = (0, 255, 100)
pixels[W-7, H-8] = (0, 255, 100)
pixels[W-6, H-8] = (0, 200, 200)
pixels[W-8, H-7] = (0, 200, 200)
pixels[W-8, H-6] = (200, 200, 50)

# Save
out_dir = os.path.join(os.path.dirname(__file__), "assets", "pixel-art")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "freelance-coder-night.png")
img.save(out_path)
print(f"Pixel art saved: {out_path}")
print(f"Size: {img.size[0]}x{img.size[1]}px")
print(f"Colors: {len(img.getcolors()) if img.getcolors() else 'many'}")
