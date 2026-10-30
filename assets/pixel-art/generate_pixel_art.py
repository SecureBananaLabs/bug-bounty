#!/usr/bin/env python3
"""
Generates an original 64x64 pixel art image: a cozy night-time campsite
under a starry sky with a glowing campfire and a small tent.

Run: python3 generate_pixel_art.py
Output: campsite_night.png (64x64)
"""

from PIL import Image

W, H = 64, 64
img = Image.new("RGB", (W, H), (0, 0, 0))
px = img.load()

# Palette
SKY_TOP = (12, 16, 48)
SKY_BOTTOM = (40, 30, 80)
STAR = (255, 255, 220)
MOON = (240, 240, 200)
MOON_SHADE = (200, 200, 160)
GROUND = (30, 60, 30)
GROUND_DARK = (20, 40, 20)
TENT = (180, 60, 60)
TENT_DARK = (120, 40, 40)
TENT_DOOR = (40, 20, 20)
FIRE_OUTER = (255, 120, 20)
FIRE_MID = (255, 180, 40)
FIRE_CORE = (255, 240, 120)
LOG = (90, 50, 20)
TREE = (20, 80, 40)
TREE_DARK = (10, 50, 25)
TRUNK = (70, 40, 20)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


# Sky gradient
for y in range(0, 44):
    t = y / 43
    c = lerp(SKY_TOP, SKY_BOTTOM, t)
    for x in range(W):
        px[x, y] = c

# Stars (deterministic pseudo-random)
stars = [
    (5, 4), (12, 8), (20, 3), (28, 10), (35, 5), (42, 12), (50, 6),
    (58, 9), (8, 15), (16, 20), (24, 16), (33, 22), (45, 18), (55, 20),
    (3, 25), (60, 15), (38, 2), (48, 25), (22, 28), (10, 30),
]
for (sx, sy) in stars:
    px[sx, sy] = STAR
    if sx + 1 < W:
        px[sx + 1, sy] = STAR

# Moon (crescent)
moon_cx, moon_cy, moon_r = 50, 12, 6
for y in range(moon_cy - moon_r, moon_cy + moon_r + 1):
    for x in range(moon_cx - moon_r, moon_cx + moon_r + 1):
        if 0 <= x < W and 0 <= y < H:
            dx, dy = x - moon_cx, y - moon_cy
            if dx * dx + dy * dy <= moon_r * moon_r:
                # carve crescent
                dx2, dy2 = x - (moon_cx + 3), y - (moon_cy - 1)
                if dx2 * dx2 + dy2 * dy2 > (moon_r - 1) * (moon_r - 1):
                    px[x, y] = MOON
                else:
                    px[x, y] = MOON_SHADE

# Ground
for y in range(44, H):
    for x in range(W):
        px[x, y] = GROUND if (x + y) % 7 else GROUND_DARK

# Distant trees (silhouettes)
for tx in (4, 10, 56, 60):
    for y in range(30, 44):
        half = (y - 30) // 2 + 1
        for x in range(tx - half, tx + half + 1):
            if 0 <= x < W:
                px[x, y] = TREE_DARK
    for y in range(44, 48):
        px[tx, y] = TRUNK

# Tent (triangle) around x=18..30, base y=44
tent_left, tent_right, tent_base = 16, 32, 44
tent_top = 30
for y in range(tent_top, tent_base):
    t = (y - tent_top) / (tent_base - tent_top)
    half = int(t * (tent_right - tent_left) / 2)
    cx = (tent_left + tent_right) // 2
    for x in range(cx - half, cx + half + 1):
        if 0 <= x < W:
            px[x, y] = TENT if (x + y) % 5 else TENT_DARK
# Tent door
for y in range(38, tent_base):
    for x in range(22, 27):
        px[x, y] = TENT_DOOR

# Campfire around x=44, y=46
fire_cx, fire_cy = 44, 46
# logs
for i in range(-4, 5):
    if 0 <= fire_cx + i < W:
        px[fire_cx + i, fire_cy + 2] = LOG
for i in range(-3, 4):
    if 0 <= fire_cx + i < W:
        px[fire_cx + i, fire_cy + 3] = LOG
# flames
flame = [
    (0, -4), (0, -3), (-1, -2), (0, -2), (1, -2),
    (-1, -1), (0, -1), (1, -1), (-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0),
    (-1, 1), (0, 1), (1, 1),
]
for (dx, dy) in flame:
    x, y = fire_cx + dx, fire_cy + dy
    if 0 <= x < W and 0 <= y < H:
        if abs(dx) <= 1 and dy <= 0:
            px[x, y] = FIRE_CORE
        elif abs(dx) <= 1:
            px[x, y] = FIRE_MID
        else:
            px[x, y] = FIRE_OUTER

# Fire glow on ground
for y in range(fire_cy + 4, fire_cy + 8):
    for x in range(fire_cx - 6, fire_cx + 7):
        if 0 <= x < W and 0 <= y < H:
            if (x + y) % 3 == 0:
                px[x, y] = (120, 70, 30)

img.save("campsite_night.png")
print("Saved campsite_night.png (64x64)")
