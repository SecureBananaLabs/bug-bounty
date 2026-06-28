#!/usr/bin/env python3
"""
Generate a 64x64 pixel art image of a cosmic cat.
Run: python3 generate-cosmic-cat.py
"""
from PIL import Image

# Create 64x64 image with transparent background
img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
pixels = img.load()

# Color palette
BLACK = (20, 20, 40, 255)
PURPLE = (138, 43, 226, 255)
DARK_PURPLE = (75, 0, 130, 255)
PINK = (255, 105, 180, 255)
CYAN = (0, 255, 255, 255)
WHITE = (255, 255, 255, 255)
YELLOW = (255, 223, 0, 255)
ORANGE = (255, 140, 0, 255)

# Simple pixel art cat pattern (1 = body, 2 = outline, 3 = eye, 4 = star, 5 = ear,  stroking)
for y in range(64):
    for x in range(64):
        # Background stars
        if (x + y) % 17 == 0 and (x * y) % 23 == 0:
            pixels[x, y] = WHITE if (x + y) % 2 == 0 else CYAN
        # Cat body (centered ellipse-ish shape)
        dx, dy = x - 32, y - 35
        if 12 <= x <= 50 and 20 <= y <= 52:
            # Head
            if 22 <= x <= 42 and 20 <= y <= 38:
                pixels[x, y] = PURPLE
                # Eyes
                if y == 30 and (x == 28 or x == 36):
                    pixels[x, y] = CYAN
                # Nose
                if x == 32 and y == 33:
                    pixels[x, y] = PINK
            # Body
            if 24 <= x <= 40 and 38 <= y <= 50:
                pixels[x, y] = DARK_PURPLE
            # Ears
            if (22 <= x <= 26 and 20 <= y <= 24) or (38 <= x <= 42 and 20 <= y <= 24):
                pixels[x, y] = PINK
            # Tail
            if 40 <= x <= 50 and 42 <= y <= 52:
                pixels[x, y] = PURPLE

img.save('cosmic-cat.png')
print("Generated cosmic-cat.png - a cosmic cat floating among stars")