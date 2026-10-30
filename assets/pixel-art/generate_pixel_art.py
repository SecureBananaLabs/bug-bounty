#!/usr/bin/env python3
"""
Generates an original 64x64 pixel art image: "Cosmic Banana" — a banana
floating in a starry night sky, celebrating the SecureBananaLabs theme.

Run: python3 generate_pixel_art.py
Output: cosmic_banana.png (64x64)
"""

from PIL import Image

W, H = 64, 64
img = Image.new("RGB", (W, H), (10, 10, 30))
px = img.load()

# --- Background: gradient night sky ---
for y in range(H):
    t = y / (H - 1)
    r = int(10 + 20 * t)
    g = int(10 + 15 * t)
    b = int(30 + 40 * t)
    for x in range(W):
        px[x, y] = (r, g, b)

# --- Stars (deterministic pseudo-random) ---
stars = [
    (5, 6), (12, 3), (20, 9), (28, 4), (35, 7), (42, 2), (50, 8),
    (57, 5), (61, 12), (8, 15), (16, 20), (24, 14), (33, 18), (45, 16),
    (53, 22), (59, 19), (3, 28), (11, 33), (19, 27), (27, 31), (38, 25),
    (47, 30), (55, 34), (62, 29), (6, 42), (14, 47), (22, 41), (30, 45),
    (40, 39), (48, 44), (56, 48), (60, 41), (9, 55), (17, 60), (25, 54),
    (34, 58), (43, 52), (51, 57), (58, 61), (2, 50), (37, 12), (44, 35),
]
for (sx, sy) in stars:
    if 0 <= sx < W and 0 <= sy < H:
        px[sx, sy] = (255, 255, 255)
        # subtle glow
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = sx + dx, sy + dy
            if 0 <= nx < W and 0 <= ny < H and px[nx, ny] == (10, 10, 30):
                px[nx, ny] = (120, 120, 160)

# --- Moon (top-right) ---
moon_cx, moon_cy, moon_r = 52, 12, 6
for y in range(H):
    for x in range(W):
        d2 = (x - moon_cx) ** 2 + (y - moon_cy) ** 2
        if d2 <= moon_r ** 2:
            px[x, y] = (240, 235, 200)
        elif d2 <= (moon_r + 1) ** 2:
            px[x, y] = (180, 175, 150)

# --- Banana (curved crescent shape) ---
# Banana body: yellow crescent
banana_pixels = set()
# Outer arc
import math
cx, cy = 32, 40
outer_r = 22
inner_r = 14
for y in range(H):
    for x in range(W):
        dx, dy = x - cx, y - cy
        dist = math.hypot(dx, dy)
        angle = math.atan2(dy, dx)
        # crescent facing up-right
        if inner_r <= dist <= outer_r and -2.4 <= angle <= 0.6:
            banana_pixels.add((x, y))

for (x, y) in banana_pixels:
    px[x, y] = (255, 220, 40)

# Banana shading (darker edge)
for (x, y) in banana_pixels:
    if (x + 1, y) not in banana_pixels or (x, y + 1) not in banana_pixels:
        px[x, y] = (220, 170, 20)

# Banana highlight
for (x, y) in banana_pixels:
    if (x - 1, y - 1) in banana_pixels and (x - 2, y - 2) in banana_pixels:
        px[x, y] = (255, 245, 120)

# Banana tips (brown)
tips = [(cx + int(outer_r * math.cos(-2.4)), cy + int(outer_r * math.sin(-2.4))),
        (cx + int(outer_r * math.cos(0.6)), cy + int(outer_r * math.sin(0.6)))]
for (tx, ty) in tips:
    for dx in range(-1, 2):
        for dy in range(-1, 2):
            nx, ny = tx + dx, ty + dy
            if 0 <= nx < W and 0 <= ny < H:
                px[nx, ny] = (110, 70, 30)

# --- Save ---
img.save("cosmic_banana.png")
print("Saved cosmic_banana.png (64x64)")
