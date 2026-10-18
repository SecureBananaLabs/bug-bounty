#!/usr/bin/env python3
"""Original pixel-art generator: 'Owl Auditor' — an owl auditor wearing a headlamp,
perched on a curly-brace branch, examining a glowing bug through a magnifying lens.
Deterministic, stdlib + PIL only. Outputs 128x128 PNG (designed at 64x64, x2 nearest)."""
from PIL import Image

W = H = 64
img = Image.new("RGB", (W, H), (12, 10, 24))
px = img.load()

# ---------- palette (deliberate, limited) ----------
SKY_TOP   = (14, 12, 34)
SKY_MID   = (34, 20, 62)
SKY_LOW   = (60, 30, 84)
GROUND    = (26, 24, 38)
GROUND_LT = (44, 40, 60)
STAR      = (250, 244, 214)
MOON      = (255, 236, 170)
OWL_BODY  = (140, 92, 52)
OWL_DARK  = (96, 60, 34)
OWL_BELLY = (214, 172, 120)
OWL_BROW  = (70, 44, 26)
EYE_WHITE = (245, 242, 230)
PUPIL     = (18, 16, 28)
BEAK      = (232, 168, 60)
LAMP      = (255, 214, 92)
BEAM      = (255, 232, 150)
BUG_RED   = (206, 54, 48)
BUG_DARK  = (120, 26, 30)
BRANCH    = (58, 44, 30)
BRACE     = (120, 200, 180)
GLASS_RIM = (190, 196, 210)
GLASS_TNT = (150, 190, 220)

def set(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = c

def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            set(x, y, c)

def ellipse(cx, cy, rx, ry, c, fill=True):
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if (d <= 1.0) if fill else (0.72 <= d <= 1.0):
                set(x, y, c)

def dither_gradient():
    # vertical sky gradient with 4x4 ordered dithering for authentic pixel-art banding
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    for y in range(H):
        t = y / (H - 1)
        if t < 0.45:
            k = t / 0.45
            c = tuple(int(SKY_TOP[i] + (SKY_MID[i] - SKY_TOP[i]) * k) for i in range(3))
        else:
            k = (t - 0.45) / 0.55
            c = tuple(int(SKY_MID[i] + (SKY_LOW[i] - SKY_MID[i]) * k) for i in range(3))
        for x in range(W):
            th = bayer[y % 4][x % 4] / 16.0
            cc = tuple(max(0, min(255, int(v + (th - 0.5) * 14))) for v in c)
            set(x, y, cc)

def stars():
    pts = [(6,7),(13,4),(21,9),(28,5),(35,10),(43,6),(50,12),(57,7),(9,16),(17,13),
           (25,18),(33,15),(41,19),(48,16),(55,21),(4,24),(12,27),(20,23),(31,26),(38,22),
           (46,28),(53,25),(60,30),(7,33),(15,37),(24,33),(36,38),(44,35),(52,40),(59,36)]
    for (x, y) in pts:
        set(x, y, STAR)
        set(x + 1, y, STAR)

def moon():
    ellipse(52, 12, 5, 5, MOON)
    ellipse(54, 11, 4, 4, SKY_MID)  # crescent bite

def circuit_horizon():
    # ground band + circuit traces
    rect(0, 50, W - 1, H - 1, GROUND)
    for x in range(0, W, 2):
        set(x, 50, GROUND_LT)
    traces = [(4, 56, 22, 56), (30, 58, 52, 58), (10, 62, 44, 62)]
    for (x0, y, x1, _) in traces:
        for x in range(x0, x1):
            set(x, y, GROUND_LT)
            if (x - x0) % 6 == 0:
                set(x, y - 1, GROUND_LT); set(x + 1, y - 1, GROUND_LT)
    for (x, y) in [(22, 55), (52, 57), (44, 61)]:
        set(x, y, (90, 220, 160))

def branch():
    # curly-brace branch across the middle
    rect(0, 38, W - 1, 39, BRANCH)
    for x in range(0, W, 6):  # bark notches
        set(x, 38, (38, 28, 20)); set(x + 1, 39, (38, 28, 20))
    # braces { } hanging under the branch
    for x in (8, 56):
        for y in range(42, 50):
            set(x, y, BRACE)
        set(x - 1, 43, BRACE); set(x - 1, 48, BRACE)
        set(x + 1, 44, BRACE); set(x + 1, 47, BRACE)

def owl():
    cx, cy = 32, 30
    # body (rounded egg)
    ellipse(cx, cy, 11, 13, OWL_BODY)
    # belly
    ellipse(cx, cy + 5, 7, 7, OWL_BELLY)
    # wing arcs
    for y in range(cy - 8, cy + 9):
        for x in range(cx - 11, cx + 12):
            d = ((x - cx) / 11) ** 2 + ((y - cy) / 13) ** 2
            if 0.55 <= d <= 1.0 and x < cx:
                set(x, y, OWL_DARK)
    # ear tufts
    set(cx - 10, cy - 13, OWL_DARK); set(cx - 9, cy - 14, OWL_DARK)
    set(cx + 10, cy - 13, OWL_DARK); set(cx + 9, cy - 14, OWL_DARK)
    # brow band
    for x in range(cx - 8, cx + 9):
        set(x, cy - 7, OWL_BROW)
        set(x, cy - 8, OWL_BROW)
    # eyes
    ellipse(cx - 5, cy - 4, 3, 3, EYE_WHITE)
    ellipse(cx + 5, cy - 4, 3, 3, EYE_WHITE)
    ellipse(cx - 5, cy - 4, 1, 2, PUPIL)
    ellipse(cx + 5, cy - 4, 1, 2, PUPIL)
    set(cx - 6, cy - 5, STAR); set(cx + 4, cy - 5, STAR)  # catchlights
    # beak
    for i in range(3):
        set(cx - i, cy + i - 1, BEAK); set(cx + i, cy + i - 1, BEAK)
    set(cx, cy + 1, (190, 130, 40))
    # headlamp on brow
    rect(cx + 6, cy - 9, cx + 10, cy - 7, LAMP)
    set(cx + 8, cy - 8, (255, 246, 200))
    # lamp beam toward the bug (bottom right)
    for i in range(9):
        set(cx + 11 + i, cy - 2 + i // 3, BEAM)

def bug():
    bx, by = 47, 44
    # glowing bug on the ground near the beam
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            if abs(dx) + abs(dy) <= 3:
                set(bx + dx, by + dy, BUG_RED)
    set(bx, by, (255, 120, 100))
    # legs
    for (lx, ly) in [(bx - 4, by - 1), (bx - 4, by + 1), (bx + 4, by - 1), (bx + 4, by + 1)]:
        set(lx, ly, BUG_DARK)
    # glow pixels
    for (gx, gy) in [(bx - 4, by - 3), (bx + 4, by - 3), (bx, by + 4), (bx, by - 4)]:
        set(gx, gy, (255, 170, 120))

def lens():
    # magnifying lens held by owl's wing (bottom-left → bottom-right direction)
    cx, cy = 47, 44
    ellipse(cx, cy, 6, 6, GLASS_TNT, fill=False)
    ellipse(cx, cy, 6, 6, GLASS_RIM, fill=False)
    for x in range(cx + 6, cx + 13):
        set(x, cy + int((x - cx - 6) * 0.8), GLASS_RIM)
    # glass sheen
    set(cx - 3, cy - 3, (235, 245, 255)); set(cx - 2, cy - 3, (235, 245, 255))
    set(cx - 3, cy - 2, (235, 245, 255))

dither_gradient(); stars(); moon(); circuit_horizon(); branch(); owl(); lens(); bug()

# ---- outline pass for crispness on dark shapes ----
out = Image.new("RGB", (W, H))
op = out.load()
for y in range(H):
    for x in range(W):
        op[x, y] = px[x, y]

big = out.resize((128, 128), Image.NEAREST)
big.save("/workspace/bounties/algora/owl-auditor.png")
print("saved 128x128 owl-auditor.png")
