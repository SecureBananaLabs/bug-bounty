"""Generate mycoform_lumen.png — 128x128 pixel-art.

Bioluminescent subterranean mushroom creature
with mycelium network and floating spores.

Run:  python scripts/generate_mycoform_pixel_art.py
Output: assets/pixel-art/mycoform_lumen.png
"""

from PIL import Image
import random
import os

SIZE = 128
OUT = os.path.join("assets", "pixel-art", "mycoform_lumen.png")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# ---------- palette ----------
P = {
    "deep_bg": (12, 10, 20),
    "cave_wall": (18, 15, 28),
    "shroom_cap": (45, 25, 90),
    "cap_glow": (60, 180, 240),
    "cap_glow_2": (100, 200, 255),
    "cap_glow_3": (160, 100, 240),
    "stem": (30, 25, 60),
    "stem_glow": (40, 160, 200),
    "gills": (35, 20, 70),
    "gills_glow": (50, 170, 220),
    "spore": (180, 230, 255),
    "spore_center": (255, 255, 255),
    "mycelium": (20, 100, 80),
    "mycelium_bright": (30, 220, 100),
    "rock": (40, 35, 50),
    "rock_detail": (55, 48, 65),
}

random.seed(42)
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
px = img.load()


def _blend(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _set(x, y, r, g, b, a=255):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        px[x, y] = (int(r), int(g), int(b), int(a))


# --- background ---
for y in range(SIZE):
    for x in range(SIZE):
        c = P["cave_wall"] if random.randint(0, 2) else P["deep_bg"]
        _set(x, y, *c)

# cave floor
for y in range(90, SIZE):
    for x in range(SIZE):
        t = (y - 90) / 38.0
        _set(x, y, *_blend(P["deep_bg"], P["rock"], t))

for _ in range(200):
    rx, ry = random.randint(0, 127), random.randint(95, 125)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            c = P["rock_detail"] if random.random() < 0.5 else P["rock"]
            _set(rx + dx, ry + dy, *c)

# --- main mushroom ---
C = (64, 55)  # center (x, y)

# stem
for dy in range(-30, 20):
    wy = C[1] + dy
    if not (0 <= wy < SIZE):
        continue
    w = int(6 + abs(dy + 30) * 0.25)
    for dx in range(-w, w + 1):
        wx = C[0] + dx
        if 0 <= wx < SIZE:
            ef = 1 - abs(dx) / (w + 1)
            if abs(dx) <= w // 2:
                _set(wx, wy, *_blend(P["stem"], P["stem_glow"], (1 - abs(dx) / (w // 2 + 1)) * 0.5))
            else:
                _set(wx, wy, *P["stem"])

# cap
for dy in range(C[1] - 45, C[1] - 19):
    t = (dy - C[1] + 45) / 26.0
    rx = int(28 * (1 - t * t * 0.3))
    for dx in range(-rx, rx + 1):
        wx, wy = C[0] + dx, dy
        if not (0 <= wx < SIZE and 0 <= wy < SIZE):
            continue
        ef = abs(dx) / (rx or 1)
        if ef > 0.7:
            if random.random() < 0.3:
                gl = P["cap_glow"]
                _set(wx, wy, int(gl[0] * 0.6), int(gl[1] * 0.6), int(gl[2] * 0.6))
            else:
                _set(wx, wy, *P["shroom_cap"])
        elif ef > 0.4:
            _set(wx, wy, *_blend(P["shroom_cap"], P["cap_glow"], (0.7 - ef) / 0.3 * 0.5))
        else:
            bg = P["cap_glow_2"] if (dx + dy) % 3 == 0 else P["cap_glow"]
            if dy % 10 < 3:
                bg = P["cap_glow_3"]
            _set(wx, wy, *_blend(P["shroom_cap"], bg, (0.4 - ef) / 0.4 * 0.7))

# cap highlight
for dy in range(C[1] - 45, C[1] - 35):
    t = (dy - C[1] + 45) / 10.0
    rx = int(28 * (1 - t * t * 0.3) * 0.4)
    for dx in range(-rx, rx + 1):
        wx, wy = C[0] + dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE:
            a = px[wx, wy]
            _set(wx, wy, min(255, a[0] + 30), min(255, a[1] + 40), min(255, a[2] + 40), a[3])

# gills
for dy in range(C[1] - 22, C[1] - 14):
    ry = int(28 * 0.6)
    for dx in range(-ry, ry + 1):
        wx, wy = C[0] + dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE and random.random() < 0.6:
            _set(wx, wy, *P["gills_glow"] if (dx + dy) % 2 == 0 else P["gills"])

# bioluminescent spots
spots = [
    (C[0] - 15, C[1] - 40), (C[0] + 8, C[1] - 38), (C[0] - 5, C[1] - 35),
    (C[0] + 18, C[1] - 32), (C[0] - 20, C[1] - 30), (C[0] + 12, C[1] - 28),
    (C[0] - 8, C[1] - 28), (C[0] + 3, C[1] - 25),
]
for sx, sy in spots:
    for r in (1, 2):
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                if abs(dx) + abs(dy) > r + 1:
                    continue
                wx, wy = sx + dx, sy + dy
                if 0 <= wx < SIZE and 0 <= wy < SIZE:
                    fade = 1 - (abs(dx) + abs(dy)) / (r + 2)
                    colors = [P["cap_glow"], P["cap_glow_2"], P["cap_glow_3"]]
                    c = colors[(sx + sy + r) % 3]
                    _set(wx, wy, int(c[0] * fade), int(c[1] * fade), int(c[2] * fade))

# --- companion left ---
LC = (35, 82)
for dy in range(-8, 3):
    for dx in range(-2, 3):
        _set(LC[0] + dx, LC[1] + dy, *P["stem"])
for dy in range(LC[1] - 14, LC[1] - 5):
    t = (dy - LC[1] + 14) / 9.0
    rx = int(9 * (1 - t * t * 0.3))
    for dx in range(-rx, rx + 1):
        wx, wy = LC[0] + dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE:
            ef = abs(dx) / (rx or 1)
            if ef > 0.5:
                _set(wx, wy, *P["shroom_cap"])
            else:
                _set(wx, wy, *_blend(P["shroom_cap"], P["cap_glow_3"], (1 - ef) * 0.5))

# --- companion right ---
RC = (95, 75)
for dy in range(-12, 5):
    wy = RC[1] + dy
    if 0 <= wy < SIZE:
        for dx in range(-3, 4):
            ef = 1 - abs(dx) / 4
            _set(RC[0] + dx, wy, *_blend(P["stem"], P["stem_glow"], ef * 0.3))
for dy in range(RC[1] - 20, RC[1] - 8):
    t = (dy - RC[1] + 20) / 12.0
    rx = int(12 * (1 - t * t * 0.3))
    for dx in range(-rx, rx + 1):
        wx, wy = RC[0] + dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE:
            ef = abs(dx) / (rx or 1)
            if ef > 0.6:
                _set(wx, wy, *P["shroom_cap"])
            else:
                _set(wx, wy, *_blend(P["shroom_cap"], P["cap_glow"], (1 - ef) * 0.5))

# --- mycelium ---
for _ in range(300):
    x, y = random.randint(0, 127), random.randint(95, 115)
    length = random.randint(3, 15)
    bright = random.random() < 0.3
    for _ in range(length):
        nx = min(127, max(0, x + random.randint(-2, 2)))
        ny = min(127, max(0, y + random.randint(-1, 2)))
        c = P["mycelium_bright"] if bright else P["mycelium"]
        a = random.randint(100, 200)
        for mdx in (-1, 0, 1):
            for mdy in (-1, 0, 1):
                if mdx * mdx + mdy * mdy <= 1:
                    _set(nx + mdx, ny + mdy, c[0], c[1], c[2], a)
        x, y = nx, ny

# --- spores ---
for _ in range(60):
    sx, sy = random.randint(10, 115), random.randint(10, 80)
    r = random.randint(1, 3)
    for dx in range(-r, r + 1):
        for dy in range(-r, r + 1):
            dist = dx * dx + dy * dy
            if dist > r * r:
                continue
            wx, wy = sx + dx, sy + dy
            if not (0 <= wx < SIZE and 0 <= wy < SIZE):
                continue
            ex = px[wx, wy]
            if dist <= 1:
                sc = P["spore_center"]
                _set(wx, wy, int((ex[0] + sc[0] * 0.7) / 1.7), int((ex[1] + sc[1] * 0.7) / 1.7), int((ex[2] + sc[2] * 0.7) / 1.7))
            else:
                sp = P["spore"]
                _set(wx, wy, int((ex[0] + sp[0] * 0.5) / 1.5), int((ex[1] + sp[1] * 0.5) / 1.5), int((ex[2] + sp[2] * 0.5) / 1.5))

# --- ambient glow ---
for dy in range(C[1] - 50, C[1] + 10):
    for dx in range(-25, 26):
        wx, wy = C[0] + dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE:
            dist = (dx * dx) / 625.0 + ((dy - C[1] + 25) ** 2) / 900.0
            if dist < 1:
                fade = 1 - dist
                a = px[wx, wy]
                _set(wx, wy, int(a[0] + 15 * fade), int(a[1] + 25 * fade), int(a[2] + 35 * fade), a[3])

img.save(OUT)
print(f"OK {OUT}  {SIZE}x{SIZE}  {os.path.getsize(OUT)} bytes")
