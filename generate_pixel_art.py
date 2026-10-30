#!/usr/bin/env python3
"""Generate original pixel art - Cosmic Voyager scene (64x64 minimum)"""
from PIL import Image
import os

# Create a 128x128 pixel art canvas (pixelated, so each "pixel" is rendered at 1px)
W, H = 128, 128
img = Image.new('RGB', (W, H), (10, 8, 30))  # Deep space
pix = img.load()

# Color palette
BLACK = (5, 3, 20)
DARK_BLUE = (15, 10, 50)
PURPLE = (80, 40, 120)
PINK = (255, 100, 180)
CYAN = (0, 200, 255)
YELLOW = (255, 220, 50)
ORANGE = (255, 150, 30)
WHITE = (240, 240, 255)
GREEN = (50, 220, 100)
DARK_GREEN = (20, 120, 50)
RED = (220, 40, 40)
GRAY = (140, 140, 160)
BROWN = (120, 70, 30)

# ---- STARS (background) ----
stars_positions = [
    (5,10),(12,3),(20,18),(35,5),(42,15),(50,8),(65,12),(78,3),(85,20),
    (8,40),(18,50),(25,65),(30,80),(45,45),(55,60),(60,85),(75,70),(88,55),
    (92,30),(3,70),(15,88),(40,90),(70,92),(82,85),(95,50),(48,30),
    (22,35),(68,42),(38,28),(72,58),(55,82),(10,60),(90,8),(95,70)
]
for x, y in stars_positions:
    brightness = 180 + (hash((x,y)) % 75)
    pix[x, y] = (brightness, brightness, min(255, brightness+15))
    # Some tiny 2-pixel stars
    if hash((x,y)) % 3 == 0:
        pix[x+1, y] = (brightness-40, brightness-40, brightness-20)
        pix[x, y+1] = (brightness-40, brightness-40, brightness-20)

# ---- NEBULA glow (bottom-right) ----
for y in range(70, 128):
    for x in range(60, 128):
        dx, dy = x-60, y-70
        dist = ((dx/51)**2 + (dy/46)**2)
        if dist < 1.0:
            intensity = int((1-dist) * 40)
            r = min(255, pix[x,y][0] + int(intensity * 1.5))
            g = min(255, pix[x,y][1] + intensity)
            b = min(255, pix[x,y][2] + int(intensity * 2))
            pix[x,y] = (r, g, b)

# ---- PLANET (bottom center) ----
cx, cy, r = 80, 102, 20
for y in range(cy-r, cy+r+1):
    for x in range(cx-r, cx+r+1):
        dx2 = (x-cx)**2 + (y-cy)**2
        if dx2 <= r**2 and dx2 > (r-3)**2:
            # Atmosphere glow
            pix[x,y] = CYAN
        elif dx2 <= (r-3)**2 and dx2 > (r-6)**2:
            # Planet crust
            pix[x,y] = (60, 160, 200)
        elif dx2 <= (r-6)**2:
            # Planet surface with continents
            base = (30, 100, 170) if ((x//4 + y//3) % 5 != 0) else GREEN
            pix[x,y] = base

# ---- ROCKET (center-left) ----
# Rocket body
rocket_x, rocket_y = 38, 40
# Main body (8x16)
for y in range(4):
    w = 2 + y
    off = (rocket_x - w//2, rocket_y + y)
    for dx in range(w):
        if 0 <= off[0]+dx < W and 0 <= off[1] < H:
            pix[off[0]+dx, off[1]] = GRAY

# Body cylinder
for y in range(4, 14):
    for dx in range(6):
        xx, yy = rocket_x - 3 + dx, rocket_y + y
        if 0 <= xx < W and 0 <= yy < H:
            if dx == 0 or dx == 5:
                pix[xx, yy] = GRAY
            elif y >= 6 and y <= 10:
                pix[xx, yy] = (180, 180, 200)
            else:
                pix[xx, yy] = GRAY

# Nose cone
for y in range(0, 4):
    w = 2 + y
    for dx in range(w):
        xx = rocket_x - w//2 + dx
        yy = rocket_y - 4 + y
        if 0 <= xx < W and 0 <= yy < H:
            pix[xx, yy] = RED if y < 2 else GRAY

# Window
for dy in range(-1, 2):
    for dx in range(-1, 2):
        xx, yy = rocket_x + dx, rocket_y + 3 + dy
        if 0 <= xx < W and 0 <= yy < H:
            pix[xx, yy] = CYAN if abs(dx*dy) < 2 else GRAY

# Fins (left and right)
for dy in range(3):
    xx_l, xx_r = rocket_x - 5, rocket_x + 5
    yy = rocket_y + 10 + dy
    if 0 <= xx_l < W and 0 <= yy < H:
        pix[xx_l, yy] = ORANGE
    if 0 <= xx_r < W and 0 <= yy < H:
        pix[xx_r, yy] = ORANGE
    if dy == 2:
        for dx in range(2):
            if 0 <= xx_l-1+dx < W and 0 <= yy < H:
                pix[xx_l-1+dx, yy] = ORANGE
            if 0 <= xx_r-1+dx < W and 0 <= yy < H:
                pix[xx_r-1+dx, yy] = ORANGE

# Flame
for dy in range(5):
    w = max(1, 4 - dy)
    for dx in range(w):
        xx = rocket_x - w//2 + dx
        yy = rocket_y + 14 + dy + 1
        if 0 <= xx < W and 0 <= yy < H:
            if dy < 2:
                pix[xx, yy] = (255, 200, 50) if dx % 2 == 0 else (255, 100, 20)
            else:
                pix[xx, yy] = (255, 80, 10) if dx % 2 == 0 else YELLOW

# ---- MOON (top-right) ----
mx, my, mr = 112, 22, 8
for y in range(my-mr, my+mr+1):
    for x in range(mx-mr, mx+mr+1):
        d = (x-mx)**2 + (y-my)**2
        if d <= mr**2:
            shade = 200 - int((d/mr**2) * 60) + (hash((x,y)) % 20)
            pix[x,y] = (shade, shade, shade)

# --- Add a second smaller duck-like spaceship (top-left) ---
sx, sy = 12, 12
for dy in range(3):
    for dx in range(5):
        if 0 <= sx+dx < W and 0 <= sy+dy < H:
            pix[sx+dx, sy+dy] = PINK

# ---- SCALE UP 4x for crisp pixel look ----
img = img.resize((W*4, H*4), Image.NEAREST)

# Save
os.makedirs('assets/pixel-art', exist_ok=True)
img.save('assets/pixel-art/cosmic-voyager.png')
print(f"Created assets/pixel-art/cosmic-voyager.png ({W*4}x{H*4})")

# Also save a thumbnail version
thumb = img.resize((256, 256), Image.NEAREST)
thumb.save('assets/pixel-art/cosmic-voyager-thumb.png')
print(f"Created assets/pixel-art/cosmic-voyager-thumb.png (256x256)")
