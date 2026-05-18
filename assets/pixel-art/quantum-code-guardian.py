#!/usr/bin/env python3
"""Generate original pixel art: Quantum Code Guardian - 128x128"""
from PIL import Image
import math

W, H = 128, 128
img = Image.new("RGB", (W, H))
px = img.load()

# Color palette
BG = (10, 8, 20)
CYAN = (0, 200, 255)
DARK_CYAN = (0, 80, 120)
PURPLE = (180, 80, 255)
DARK_PURPLE = (80, 20, 140)
GOLD = (255, 200, 50)
WHITE = (220, 230, 255)
GREEN = (0, 220, 120)
DARK_GREEN = (0, 60, 30)
RED = (255, 60, 60)
ORANGE = (255, 140, 20)

def rect(x1, y1, x2, y2, color):
    for y in range(y1, y2+1):
        for x in range(x1, x2+1):
            if 0 <= x < W and 0 <= y < H:
                px[x, y] = color

def circle(cx, cy, r, color, fill=False):
    for y in range(max(0, cy-r), min(H-1, cy+r+1)):
        for x in range(max(0, cx-r), min(W-1, cx+r+1)):
            d = math.sqrt((x-cx)**2 + (y-cy)**2)
            if fill and d <= r:
                px[x, y] = color
            elif not fill and abs(d - r) < 1.0:
                px[x, y] = color

# Background - dark space with grid
for y in range(H):
    for x in range(W):
        nx = x // 4
        ny = y // 4
        if (nx + ny) % 2 == 0:
            px[x, y] = BG
        else:
            px[x, y] = (6, 5, 15)

# ===== GUARDIAN BODY =====
# Main torso
rect(40, 40, 87, 100, DARK_PURPLE)
rect(42, 42, 85, 98, (30, 10, 60))

# Shoulder plates
rect(32, 40, 39, 55, DARK_CYAN)
rect(88, 40, 95, 55, DARK_CYAN)
rect(34, 42, 39, 53, CYAN)
rect(88, 42, 93, 53, CYAN)

# Chest core - hexagonal energy pattern
circle(64, 65, 14, PURPLE, fill=True)
circle(64, 65, 10, (100, 40, 180), fill=True)
circle(64, 65, 6, CYAN, fill=True)
circle(64, 65, 3, WHITE, fill=True)

# Chest lines
for x in range(48, 80):
    y = 55 + int(5 * math.sin(x * 0.3))
    px[x, y] = CYAN
for x in range(48, 80):
    y = 85 - int(5 * math.sin(x * 0.3))
    px[x, y] = CYAN

# Side energy conduits
for y in range(55, 85):
    px[40, y] = CYAN if y % 3 == 0 else DARK_CYAN
    px[87, y] = CYAN if y % 3 == 0 else DARK_CYAN

# ===== HEAD =====
# Helmet
rect(46, 16, 81, 40, DARK_PURPLE)
rect(48, 18, 79, 38, (20, 8, 45))
# Visor
rect(48, 22, 79, 30, DARK_CYAN)
rect(50, 24, 77, 28, CYAN)
# Glowing eye slot
rect(56, 24, 71, 28, WHITE)
# Scanning eye
px[64, 26] = WHITE
px[63, 26] = (200, 220, 255)
px[65, 26] = (200, 220, 255)
px[64, 25] = (200, 220, 255)
px[64, 27] = (200, 220, 255)

# Visor scan line (animated-looking)
for x in range(52, 76):
    px[x, 24] = CYAN if x % 4 == 0 else DARK_CYAN
for x in range(52, 76):
    px[x, 28] = CYAN if (x + 2) % 4 == 0 else DARK_CYAN

# Helmet crest
rect(58, 14, 69, 17, GOLD)
rect(60, 12, 67, 15, GOLD)
rect(62, 10, 65, 13, GOLD)
# Helmet side fins
rect(42, 20, 47, 30, CYAN)
rect(80, 20, 85, 30, CYAN)
rect(44, 22, 47, 28, DARK_CYAN)
rect(80, 22, 83, 28, DARK_CYAN)

# ===== ARMS =====
# Left arm
rect(24, 50, 31, 80, DARK_CYAN)
rect(26, 52, 31, 78, (0, 60, 100))
# Gauntlet
rect(24, 78, 33, 90, GOLD)
rect(26, 80, 33, 88, (200, 160, 40))
# Right arm
rect(96, 50, 103, 80, DARK_CYAN)
rect(96, 52, 101, 78, (0, 60, 100))
# Gauntlet
rect(94, 78, 103, 90, GOLD)
rect(94, 80, 101, 88, (200, 160, 40))

# ===== LEGS =====
# Left leg
rect(46, 100, 60, 118, DARK_PURPLE)
rect(48, 102, 58, 116, (25, 8, 50))
# Right leg
rect(67, 100, 81, 118, DARK_PURPLE)
rect(69, 102, 79, 116, (25, 8, 50))
# Boots
rect(44, 116, 62, 122, DARK_CYAN)
rect(65, 116, 83, 122, DARK_CYAN)
rect(46, 118, 60, 122, CYAN)
rect(67, 118, 81, 122, CYAN)

# ===== SHIELD (left hand) =====
# Energy shield
for y in range(0, H):
    for x in range(14, 38):
        dist = math.sqrt((x-26)**2 + (y-60)**2)
        if 14 <= dist <= 18:
            bright = max(0, min(255, int(100 - 5 * abs(dist - 16))))
            px[x, y] = (bright, bright // 2, bright)

# Shield inner glow
for y in range(0, H):
    for x in range(14, 38):
        dist = math.sqrt((x-26)**2 + (y-60)**2)
        if 10 <= dist <= 14:
            alpha = int(60 - 15 * abs(dist - 12))
            px[x, y] = (alpha // 2, alpha, alpha)

# Shield edge
circle(26, 60, 16, CYAN, fill=False)
circle(26, 60, 15, WHITE, fill=False)

# ===== CODE ORB (right hand) =====
# Glowing orb
circle(102, 60, 12, PURPLE, fill=True)
circle(102, 60, 8, (120, 50, 200), fill=True)
circle(102, 60, 4, CYAN, fill=True)
# Orb code rings
for r in [6, 9, 11]:
    circle(102, 60, r, WHITE, fill=False)

# ===== SCANNING BEAMS =====
# Scan beam from eye
for i in range(0, 12):
    bx = 64 + int(10 * math.cos(i * 0.5))
    by = 30 + int(20 * math.sin(i * 0.5))
    if 0 <= bx < W and 0 <= by < H:
        px[bx, by] = CYAN
    # Secondary scan
    bx2 = 64 + int(10 * math.cos(i * 0.5 + 3.14))
    by2 = 30 + int(20 * math.sin(i * 0.5 + 3.14))
    if 0 <= bx2 < W and 0 <= by2 < H:
        px[bx2, by2] = GREEN

# ===== FLOATING DATA RUNES =====
runes_positions = [
    (20, 15), (18, 30), (22, 45),  # left side
    (108, 15), (110, 30), (106, 45),  # right side
    (35, 8), (55, 6), (73, 6), (92, 8),  # top
    (30, 120), (50, 124), (78, 124), (98, 120),  # bottom
]
for rx, ry in runes_positions:
    if rx < 64:
        color = CYAN
    else:
        color = GREEN
    # Binary/hex runes
    bits = [
        (0,0,1,1),
        (1,0,1,0),
        (1,1,0,0),
        (0,1,0,1),
    ]
    for bi, row in enumerate(bits):
        for bj, bit in enumerate(row):
            if bit:
                nx, ny = rx + bj*2, ry + bi*2
                if 0 <= nx < W and 0 <= ny < H:
                    px[nx, ny] = color

# ===== FLOATING PARTICLES =====
import random
random.seed(42)
particles = []
for _ in range(30):
    x = random.randint(2, 126)
    y = random.randint(2, 126)
    c = random.choice([CYAN, PURPLE, GOLD, GREEN, WHITE])
    particles.append((x, y, c))

for x, y, c in particles:
    # Check not overlapping guardian
    if not (32 <= x <= 96 and 10 <= y <= 122):
        px[x, y] = c
        if x+1 < W: px[x+1, y] = c
        if y+1 < H: px[x, y+1] = c
        if x+1 < W and y+1 < H: px[x+1, y+1] = c

# ===== GROUND GLOW =====
circle(64, 124, 30, DARK_CYAN, fill=True)
for y in range(115, 128):
    for x in range(34, 94):
        dist = abs(x - 64)
        alpha = max(0, int(40 - 2 * dist))
        r, g, b = px[x, y]
        px[x, y] = (min(r + alpha, 255), min(g + alpha + 20, 255), min(b + alpha, 255))

# ===== ENERGY WISPS =====
for i in range(8):
    angle = i * 0.785 + 0.2
    for d in range(3, 14):
        wx = 64 + int(d * math.cos(angle))
        wy = 65 + int(d * math.sin(angle))
        if 0 <= wx < W and 0 <= wy < H:
            bright = max(0, int(60 - 5*d))
            r, g, b = px[wx, wy]
            px[wx, wy] = (min(r + bright, 255), min(g + bright + 10, 255), min(b + bright + 30, 255))

# ===== BADGE on chest =====
rect(58, 52, 69, 53, GOLD)
rect(58, 60, 69, 61, GOLD)
rect(56, 54, 57, 59, GOLD)
rect(70, 54, 71, 59, GOLD)

# ===== BELT =====
rect(44, 98, 83, 101, GOLD)
rect(46, 99, 81, 100, (200, 160, 40))
# Belt buckle
rect(60, 97, 67, 102, CYAN)
rect(62, 99, 65, 100, WHITE)

# Save
img.save("/tmp/bug-bounty/assets/pixel-art/quantum-code-guardian.png")
print("Pixel art saved!")
