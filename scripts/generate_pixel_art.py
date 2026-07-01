"""Generate original pixel art: a retro space scene with a rocket launch."""
from PIL import Image
import os

W, H = 128, 128
img = Image.new('RGB', (W, H))
px = img.load()

# Palette: deep space
BLACK = (10, 10, 20)
DARK_BLUE = (20, 30, 60)
MID_BLUE = (30, 50, 100)
STAR = (255, 255, 200)
STAR_DIM = (180, 180, 160)
ROCKET_BODY = (200, 80, 50)
ROCKET_NOSE = (220, 100, 60)
ROCKET_WINDOW = (100, 200, 255)
FLAME_YELLOW = (255, 200, 50)
FLAME_ORANGE = (255, 120, 30)
FLAME_RED = (200, 50, 20)
PLANET_A = (80, 160, 120)
PLANET_B = (160, 120, 80)
MOON = (180, 180, 170)

# Background gradient - dark space
for y in range(H):
    t = y / H
    r = int(BLACK[0] * (1 - t) + DARK_BLUE[0] * t)
    g = int(BLACK[1] * (1 - t) + DARK_BLUE[1] * t)
    b = int(BLACK[2] * (1 - t) + DARK_BLUE[2] * t)
    for x in range(W):
        px[x, y] = (r, g, b)

# Stars - random placement with fixed seed for reproducibility
import random
random.seed(42)
for _ in range(120):
    sx, sy = random.randint(0, W-1), random.randint(0, H-1)
    bright = random.choice([STAR, STAR_DIM])
    px[sx, sy] = bright
    # occasional twinkle
    if random.random() < 0.2:
        for dx, dy in [(1,0),(-1,0),(0,1),(0,-1)]:
            nx, ny = sx+dx, sy+dy
            if 0 <= nx < W and 0 <= ny < H:
                px[nx, ny] = STAR_DIM

# Planet A - greenish at top-left
cx, cy = 20, 25
for y in range(max(0,cy-18), min(H,cy+18)):
    for x in range(max(0,cx-18), min(W,cx+18)):
        dx, dy = x-cx, y-cy
        d = (dx*dx + dy*dy) ** 0.5
        if d < 16:
            shade = 1.0 - d/18
            r = int(PLANET_A[0] * shade)
            g = int(PLANET_A[1] * shade)
            b = int(PLANET_A[2] * shade)
            px[x, y] = (r, g, b)

# Planet B - reddish at bottom-right
cx, cy = 110, 105
for y in range(max(0,cy-12), min(H,cy+12)):
    for x in range(max(0,cx-12), min(W,cx+12)):
        dx, dy = x-cx, y-cy
        d = (dx*dx + dy*dy) ** 0.5
        if d < 10:
            shade = 1.0 - d/12
            r = int(PLANET_B[0] * shade)
            g = int(PLANET_B[1] * shade)
            b = int(PLANET_B[2] * shade)
            px[x, y] = (r, g, b)

# Moon - small, near planet B
cx, cy = 95, 90
for y in range(max(0,cy-6), min(H,cy+6)):
    for x in range(max(0,cx-6), min(W,cx+6)):
        dx, dy = x-cx, y-cy
        d = (dx*dx + dy*dy) ** 0.5
        if d < 5:
            shade = 1.0 - d/6
            r = int(MOON[0] * shade)
            g = int(MOON[1] * shade)
            b = int(MOON[2] * shade)
            px[x, y] = (r, g, b)

# Rocket - centered, launching upward
rx, ry = 64, 85  # bottom center of rocket

# Flame
for fy in range(ry, ry+20):
    flicker = 1.0 - (fy - ry) / 20
    for fx in range(rx-5, rx+5):
        fdx = abs(fx - rx)
        if fdx < 3 + (fy - ry) * 0.3:
            if flicker > 0.7:
                c = FLAME_YELLOW
            elif flicker > 0.4:
                c = FLAME_ORANGE
            else:
                c = FLAME_RED
            shade = flicker * (1.0 - fdx / 8)
            px[fx, fy] = (int(c[0]*shade), int(c[1]*shade), int(c[2]*shade))

# Rocket body
for y in range(ry-25, ry):
    # Tapered body
    half_w = 6 - (ry - y) * 0.12
    half_w = max(3, int(half_w))
    for x in range(rx - half_w, rx + half_w):
        if 0 <= x < W and 0 <= y < H:
            px[x, y] = ROCKET_BODY
    # Nose cone (top 8px)
    if y < ry - 18:
        for x in range(rx - half_w, rx + half_w):
            if 0 <= x < W and 0 <= y < H:
                px[x, y] = ROCKET_NOSE

# Window
for wy in range(ry-18, ry-10):
    for wx in range(rx-3, rx+3):
        wd = ((wx-rx)**2 + (wy-(ry-14))**2) ** 0.5
        if wd < 3:
            px[wx, wy] = ROCKET_WINDOW

# Fins
fin_color = (180, 60, 40)
for fy in range(ry-12, ry-2):
    # left fin
    for fx in range(rx-10, rx-6):
        if abs(fx - (rx-8)) < (fy - (ry-12)) * 0.4 + 2:
            px[fx, fy] = fin_color
    # right fin
    for fx in range(rx+6, rx+10):
        if abs(fx - (rx+8)) < (fy - (ry-12)) * 0.4 + 2:
            px[fx, fy] = fin_color

upscale = 4
img_resized = img.resize((W*upscale, H*upscale), Image.NEAREST)

out_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'pixel-art', 'space_rocket_launch.png')
os.makedirs(os.path.dirname(out_path), exist_ok=True)
img_resized.save(out_path)
print(f"Saved pixel art to {out_path}")
print(f"Original canvas: {W}x{H}")
print(f"Output size: {W*upscale}x{H*upscale} (nearest-neighbor upscale x{upscale})")
