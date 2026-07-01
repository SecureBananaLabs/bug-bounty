"""Generate original pixel art: Pixel Wizard at 64x64 (NES palette)."""
from PIL import Image
import os

W, H = 64, 64

NES = [
    (0x00, 0x00, 0x00), (0xFF, 0xFF, 0xFF), (0xF0, 0x78, 0x30),
    (0x00, 0xA8, 0x00), (0x00, 0x70, 0xD8), (0x88, 0x38, 0xF0),
    (0xF8, 0xE8, 0x30), (0xF8, 0xB8, 0x30), (0x58, 0xD8, 0x58),
    (0x78, 0xD8, 0xF8), (0xF8, 0x70, 0x70), (0xF8, 0xA0, 0xF8),
    (0xA0, 0x50, 0x00), (0x48, 0x48, 0x48), (0xA8, 0xA8, 0xA8),
    (0x00, 0x48, 0x58), (0x00, 0x30, 0x68), (0x28, 0x28, 0x28),
]

BLK, WHT, ORG, GRN, BLU, PUR, YEL, LOR, LGR, CYN, RED, PNK, BRN, GY1, GY2, TEAL, NVY, DK = range(len(NES))

img = Image.new("RGB", (W, H))
px = img.load()

# Night sky background gradient
for y in range(H):
    t = y / H
    r = int(5 + t * 10)
    g = int(5 + t * 8)
    b = int(25 + t * 20)
    for x in range(W):
        px[x, y] = (r, g, b)

# Stars
stars = [(5,3),(8,6),(15,2),(20,8),(25,4),(32,7),(38,2),(42,9),(48,3),
         (52,8),(58,4),(10,12),(18,15),(28,11),(35,16),(45,13),(55,10)]
for sx, sy in stars:
    px[sx, sy] = WHT
    if sx+1 < W: px[sx+1, sy] = WHT

# Ground
for y in range(48, H):
    for x in range(W):
        px[x, y] = (20, 28, 12)

# Stone platform
for y in range(46, 50):
    for x in range(20, 44):
        px[x, y] = GY1 if (x + y) % 2 == 0 else GY2

# Wizard body (robe)
for y in range(30, 48):
    for x in range(26, 38):
        px[x, y] = NVY if (x % 2 == 0) else BLU

# Robe trim
for x in range(25, 39):
    px[x, 30] = PUR
    px[x, 47] = PUR

# Wizard head
for y in range(22, 30):
    for x in range(28, 36):
        if (x-32)**2 + (y-26)**2 < 16:
            px[x, y] = (232, 200, 160)  # skin

# Eyes
px[29, 26] = BLK; px[30, 26] = BLK
px[33, 26] = BLK; px[34, 26] = BLK
px[29, 27] = WHT; px[30, 27] = WHT
px[33, 27] = WHT; px[34, 27] = WHT

# Beard
for y in range(28, 33):
    for x in range(29, 35):
        if 29 <= x <= 34:
            px[x, y] = GY2
px[30, 33] = GY2; px[33, 33] = GY2

# Hat (pointed wizard hat)
for y in range(10, 23):
    hat_w = max(4, int((23 - y) * 1.2))
    cx = 32
    for x in range(cx - hat_w, cx + hat_w + 1):
        if 0 <= x < W:
            px[x, y] = PUR if (x + y) % 3 != 0 else NVY

# Hat brim
for x in range(25, 39):
    px[x, 22] = PUR
px[24, 23] = PUR; px[39, 23] = PUR

# Hat star
px[32, 14] = YEL; px[31, 15] = YEL; px[33, 15] = YEL
px[32, 16] = YEL

# Staff (right arm holding)
for y in range(28, 48):
    px[39, y] = BRN
    px[40, y] = BRN

# Staff top crystal
for y in range(24, 30):
    for x in range(38, 43):
        dx, dy = x - 40, y - 27
        if dx*dx + dy*dy < 8:
            px[x, y] = CYN if (x + y) % 2 == 0 else WHT
px[40, 23] = CYN; px[41, 23] = CYN

# Magic particles around crystal
particles = [(36,20,YEL),(37,18,PNK),(43,19,CYN),(44,21,PUR),
             (35,25,PNK),(45,24,YEL),(38,17,WHT),(42,17,WHT)]
for px2, py2, pc in particles:
    px[px2, py2] = pc

# Left arm (extended casting)
for y in range(32, 36):
    for x in range(22, 27):
        px[x, y] = NVY
px[21, 33] = NVY; px[21, 34] = NVY

# Magic bolt from hand
magic_pts = [(18,33,PNK),(15,32,CYN),(12,34,YEL),(9,33,WHT),
             (6,32,CYN),(4,34,PNK),(2,33,YEL)]
for mx, my, mc in magic_pts:
    px[mx, my] = mc

out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "pixel-art")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "pixel_wizard.png")
img.save(out_path)
print(f"Saved: {out_path} ({os.path.getsize(out_path)} bytes)")
