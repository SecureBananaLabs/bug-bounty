"""Generate mario_oneup variant: remove ? block, add floating spores."""
from PIL import Image
import random, os

SIZE = 128
OUT = ".openclaw/tmp/mushroom_variants/mario_oneup_final.png"
os.makedirs(os.path.dirname(OUT), exist_ok=True)

random.seed(42)

def _set(px, x, y, r, g, b, a=255):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        px[x, y] = (int(r), int(g), int(b), int(a))

def blend(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

P = {
    "bg_sky": (120, 200, 255), "bg_sky_dark": (80, 170, 230),
    "ground_brown": (180, 130, 70), "ground_dark": (140, 90, 40),
    "grass_green": (60, 160, 40), "grass_dark": (30, 120, 20),
    "cap_green": (30, 180, 40), "cap_green_light": (50, 210, 55),
    "cap_green_dark": (20, 140, 25), "cap_green_outline": (10, 80, 15),
    "spot_white": (255, 252, 245), "spot_shadow": (230, 220, 210), "spot_outline": (190, 180, 170),
    "stem_cream": (255, 248, 235), "stem_light": (255, 252, 245),
    "stem_shadow": (220, 210, 195), "stem_dark": (180, 170, 150), "stem_outline": (140, 130, 110),
    "eye_black": (18, 18, 22), "eye_white": (255, 255, 255),
    "spore_core": (255, 240, 180), "spore_glow": (240, 220, 140),
    "spore_edge": (200, 180, 100), "spore_trail": (160, 200, 120),
}

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
px = img.load()

# sky
for y in range(85):
    for x in range(SIZE):
        t = y / 85.0
        _set(px, x, y, *blend(P["bg_sky_dark"], P["bg_sky"], t))

# clouds
for cx in [25, 95, 55]:
    ch = 20 + (cx % 3) * 5
    for dx in range(-18, 19):
        for dy in range(-7, 9):
            dist = (dx*dx)/324.0 + (dy*dy)/64.0
            if dist < 1:
                fade = max(0, 1 - dist)
                _set(px, cx+dx, ch+dy, int(230+25*fade), int(230+25*fade), int(240+15*fade))

# ground
for y in range(85, SIZE):
    for x in range(SIZE):
        t = (y - 85) / 43.0
        c = blend(P["ground_brown"], P["ground_dark"], t)
        _set(px, x, y, c[0]+random.randint(-3,3), c[1]+random.randint(-3,3), c[2])

# grass
for y in range(84, 90):
    for x in range(SIZE):
        _set(px, x, y, *P["grass_green"])

# distant hills
for hill in [(16, 88, 25, 10), (100, 88, 30, 11)]:
    x0, y0, hw, hh = hill
    for y in range(y0-hh, y0+1):
        for x in range(x0-hw, x0+hw+1):
            if 0 <= x < SIZE and 0 <= y < SIZE:
                dx = x - x0
                ht = y0 - hh + (dx*dx)/(hw*hw)*hh
                if y >= ht:
                    t2 = max(0, min(1, (y - ht)/(y0 - ht + 1)))
                    _set(px, x, y, *blend(P["grass_dark"], P["grass_green"], t2))

# === mushroom ===
cx = 64
# stem
for dy in range(52, 85):
    t = (dy - 52) / 33.0
    sw = int(14 - t * 2)
    for dx in range(-sw, sw+1):
        wx, wy = cx+dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE:
            edge = abs(dx) / (sw or 1)
            if edge < 0.3:     _set(px, wx, wy, *P["stem_cream"])
            elif edge < 0.65:  _set(px, wx, wy, *P["stem_light"])
            elif edge < 0.85:  _set(px, wx, wy, *P["stem_shadow"])
            else:              _set(px, wx, wy, *P["stem_outline"])
for dx in range(-17, 18):
    wx, wy = cx+dx, 84
    if 0 <= wx < SIZE: _set(px, wx, wy, *P["stem_outline"])
for dy in range(82, 86):
    for dx in range(-17, 18):
        wx, wy = cx+dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE:
            edge = abs(dx) / 17.0
            if edge < 0.6:       _set(px, wx, wy, *P["stem_cream"])
            elif edge < 0.85:    _set(px, wx, wy, *P["stem_shadow"])
            else:                _set(px, wx, wy, *P["stem_outline"])

# cap
cp = 18; cb = 54; cw = 30
for dy in range(cp, cb):
    t = (dy - cp) / (cb - cp)
    lw = int(cw * (1 - t*t*0.45))
    if dy >= cb - 4: lw = int(cw * 1.05)
    for dx in range(-lw, lw+1):
        wx, wy = cx+dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE:
            edge = abs(dx) / (lw or 1)
            hl = (dx < -4 and dy < cp + 12)
            if hl:                    _set(px, wx, wy, *P["cap_green_light"])
            elif edge < 0.35:        _set(px, wx, wy, *P["cap_green"])
            elif edge < 0.6:         _set(px, wx, wy, *blend(P["cap_green"], P["cap_green_dark"], (edge-0.35)/0.25))
            elif edge < 0.9:         _set(px, wx, wy, *P["cap_green_dark"])
            elif edge < 0.98:        _set(px, wx, wy, *P["cap_green_outline"])
            else:                    _set(px, wx, wy, *P["cap_green_outline"])
for dx in range(-cw-2, cw+3):
    _set(px, cx+dx, cb-1, *P["cap_green_outline"])
# white rim
for dy in range(cb-2, cb+2):
    rw = int(cw * 1.02)
    for dx in range(-rw, rw+1):
        wx, wy = cx+dx, dy
        if 0 <= wx < SIZE and 0 <= wy < SIZE and abs(dx) <= cw:
            _set(px, wx, wy, *P["spot_white"])

# spots
spots = [(cx-12, cp+15, 8), (cx+12, cp+18, 7), (cx-2, cp+8, 6), (cx-8, cp+28, 5), (cx+6, cp+30, 5)]
for sx, sy, sr in spots:
    for dx in range(-sr-1, sr+2):
        for dy in range(-sr-1, sr+2):
            dist = dx*dx + dy*dy
            wx, wy = sx+dx, sy+dy
            if 0 <= wx < SIZE and 0 <= wy < SIZE:
                rsq = sr*sr
                if dist <= (sr-1)*(sr-1):        _set(px, wx, wy, *P["spot_white"])
                elif dist <= rsq + 1:             _set(px, wx, wy, *P["spot_outline"])
                elif dist <= rsq + 4:             _set(px, wx, wy, *P["spot_shadow"])

# eyes
eye_y = 62
for side in [-1, 1]:
    ex = cx + side * 6
    for dx in range(-3, 4):
        for dy in range(-2, 4):
            if dx*dx*0.8 + dy*dy*0.4 <= 10:
                _set(px, ex+dx, eye_y+dy, *P["eye_black"])
    _set(px, ex+2, eye_y-1, *P["eye_white"])
    _set(px, ex+1, eye_y-2, *P["eye_white"])

# smile
for i in range(4):
    _set(px, cx-1+i, eye_y+6, *P["stem_outline"])
    _set(px, cx-1+i, eye_y+7, *P["stem_outline"])
_set(px, cx-2, eye_y+5, *P["stem_outline"])
_set(px, cx+2, eye_y+5, *P["stem_outline"])

# tiny spore dots removed — only 5 main spores

# === SPORES ===
# glowing floating spore particles around the mushroom
spores = []
for _ in range(5):
    spores.append({
        "x": random.randint(25, 100),
        "y": random.randint(15, 55),
        "r": random.randint(3, 6),
        "speed": random.uniform(0.3, 1.2),
        "phase": random.uniform(0, 6.28),
    })

for sp in spores:
    sx, sy, sr = sp["x"], sp["y"], sp["r"]
    for dx in range(-sr-1, sr+2):
        for dy in range(-sr-1, sr+2):
            dist = dx*dx + dy*dy
            wx, wy = sx+dx, sy+dy
            if 0 <= wx < SIZE and 0 <= wy < SIZE:
                rsq = sr*sr
                if dist <= rsq:
                    # core
                    if dist <= 2:
                        _set(px, wx, wy, *P["spore_core"])
                    elif dist <= rsq * 0.5:
                        _set(px, wx, wy, *P["spore_glow"])
                    elif dist <= rsq:
                        _set(px, wx, wy, *P["spore_edge"])
    # tiny trail
    for t in range(2, 5):
        tx = sx + t * 1
        ty = sy + t * 1
        if 0 <= tx < SIZE and 0 <= ty < SIZE:
            alpha = max(30, 180 - t*50)
            ex = px[tx, ty]
            _set(px, tx, ty,
                 int((ex[0] + P["spore_trail"][0]) // 2),
                 int((ex[1] + P["spore_trail"][1]) // 2),
                 int((ex[2] + P["spore_trail"][2]) // 2),
                 alpha)

# micro spores (tiny dots)
for _ in range(8):
    sx = random.randint(5, 120)
    sy = random.randint(10, 72)
    _set(px, sx, sy, 200, 220, 150, random.randint(60, 180))

img.save(OUT)
print(f"OK {OUT} | 128x128 | {os.path.getsize(OUT)} bytes")
