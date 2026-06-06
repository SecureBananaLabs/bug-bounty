#!/usr/bin/env python3
"""
Generate a 64x64 pixel art cosmic cat PNG.
Run: python3 generate-cosmic-cat.py
Requires: pip install pillow
"""
from PIL import Image

# 64x64 pixel art - Cosmic Cat
# Simple color palette
BLACK = (0, 0, 0)
DARK_PURPLE = (48, 25, 52)
PURPLE = (106, 49, 138)
LIGHT_PURPLE = (180, 120, 220)
PINK = (255, 105, 180)
CYAN = (0, 255, 255)
WHITE = (255, 255, 255)
GOLD = (255, 215, 0)
ORANGE = (255, 165, 0)

# Create image
img = Image.new('RGBA', (64, 64), DARK_PURPLE)
pixels = img.load()

# Simple cosmic cat design - filled programmatically
for y in range(64):
    for x in range(64):
        # Stars in background
        if (x + y * 7) % 43 == 0 or (x * 3 + y * 2) % 61 == 0:
            pixels[x, y] = WHITE if (x + y) % 2 == 0 else CYAN
        
        # Cat silhouette (centered)
        cx, cy = 32, 34
        # Body
        if 20 <= x <= 44 and 28 <= y <= 52:
            # Round the body
            if ((x - cx) ** 2) / 144 + ((y - 40) ** 2) / 144 <= 1:
                pixels[x, y] = PURPLE
        # Head
        if 24 <= x <= 40 and 16 <= y <= 32:
            if (x - 32) ** 2 + (y - 24) ** 2 <= 64:
                pixels[x, y] = LIGHT_PURPLE
        # Ears
        if (22 <= x <= 26 and 12 <= y <= 20) or (38 <= x <= 42 and 12 <= y <= 20):
            if y >= 12 + abs(x - (24 if x < 32 else 40)) * 2:
                pixels[x, y] = PINK

img.save('cosmic-cat.png')
print("Generated cosmic-cat.png")