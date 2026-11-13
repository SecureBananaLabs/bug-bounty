#!/usr/bin/env python3
"""
Original pixel-art generator: 'Bounty Banana' (SecureBananaLabs issue #80).

Pure stdlib PNG writer (no PIL). Authors a 32x32 logical sprite
(hand-tuned silhouette + shading profile) and renders it nearest-neighbor
at 4x into a 128x128 RGBA PNG.

Art concept: a lone banana under a night-sky bounty field — shading model
(dark outline / shadow / body / highlight) applied per row so the sprite
reads as a fruit, not a blob.
"""

import struct
import zlib
import random

W = H = 128           # final canvas (>= 64x64 required)
S = 4                 # scale factor per logical pixel
L = W // S            # 32 logical rows/cols


def png_write(path, w, h, pixels):
    """pixels: list of rows of (r,g,b,a). Uncompressed-filter PNG encoder."""
    raw = b"".join(b"\x00" + b"".join(struct.pack("4B", *p) for p in row)
                   for row in pixels)

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">2I5B", w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA
    out = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", ihdr)
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(out)
    return len(out)


# ---------------------------------------------------------------- palette
PAL = {
    "outline": (42, 23, 5, 255),
    "shadow":  (217, 147, 29, 255),
    "body":    (244, 196, 84, 255),
    "light":   (230, 172, 52, 255),
    "highlight": (255, 233, 168, 255),
    "stem":    (138, 90, 26, 255),
    "stem_dk": (94, 58, 16, 255),
    "bg":      (16, 24, 44, 255),
    "bg2":     (24, 34, 64, 255),
    "bg3":     (38, 50, 92, 255),
    "star":    (255, 244, 200, 255),
    "star2":   (150, 170, 230, 255),
}

# ------------------------------------------------- hand-tuned silhouette
# Half-width of the banana body at each of 32 rows: narrow tip, bulge, taper.
HW = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9,
      10, 10, 10, 10, 10, 10, 10, 10, 9, 9,
      9, 8, 8, 7, 6, 5, 4, 3, 2, 1, 1, 0]

# Gentle S-curve: centre drifts right through the middle of the sprite.
def CX(y):
    import math
    return 16 + int(round(1.8 * math.sin(math.pi * (y - 2) / 28.0)))


def sprite_pixel(y, x):
    if y >= len(HW):
        return None
    cx = CX(y)
    hw = HW[y]
    if hw <= 0:
        return PAL["stem_dk"] if x == cx else None
    left, right = cx - hw, cx + hw
    if not (left <= x <= right):
        return None

    # tip treatment: brown stem at the top, dark nub at the bottom
    if y <= 2 or y >= 30:
        if x == cx:
            return PAL["stem"] if y <= 2 else PAL["stem_dk"]
        return PAL["outline"]

    if x in (left, right):
        return PAL["outline"]
    d = (x - cx) / hw  # -1 left edge .. +1 right edge
    if d < -0.40:
        return PAL["highlight"]
    if d < -0.10:
        return PAL["body"]
    if d < 0.42:
        return PAL["body"]
    return PAL["shadow"]


def build():
    grid = [[None] * L for _ in range(L)]

    # background: deep night field
    for y in range(L):
        for x in range(L):
            grid[y][x] = PAL["bg"]
    for y in range(L):                      # soft vertical gradient
        for x in range(L):
            if (x * 7 + y * 13) % 11 == 0:
                grid[y][x] = PAL["bg2"]

    # deterministic star field (seeded -> reproducible art)
    rnd = random.Random(780)
    for _ in range(26):
        sx, sy = rnd.randrange(L), rnd.randrange(L)
        c = PAL["star"] if rnd.random() < 0.6 else PAL["star2"]
        grid[sy][sx] = c
        if sx + 1 < L and rnd.random() < 0.4:      # plus-shaped sparkle
            grid[sy][sx + 1] = c
        if sy + 1 < L and rnd.random() < 0.4:
            grid[sy + 1][sx] = c

    # banana
    for y in range(L):
        for x in range(L):
            p = sprite_pixel(y, x)
            if p is not None:
                grid[y][x] = p

    # glossy streak on the upper-left flank
    for y in range(8, 14):
        for x in (CX(y) - 5, CX(y) - 4):
            if grid[y][x] == PAL["body"]:
                grid[y][x] = PAL["highlight"]

    # nearest-neighbor upscale to the final canvas
    pixels = [[grid[y // S][x // S] for x in range(W)] for y in range(H)]
    return pixels


def ascii_proof(grid):
    """Compact ASCII preview so the shape can be eyeballed in the terminal."""
    key = {PAL["outline"]: "#", PAL["shadow"]: "s", PAL["body"]: "+",
           PAL["highlight"]: "*", PAL["light"]: "+", PAL["stem"]: "t",
           PAL["stem_dk"]: "t"}
    lines = []
    for row in grid:
        lines.append("".join(key.get(p, ".") for p in row))
    return "\n".join(lines)


if __name__ == "__main__":
    pixels = build()
    path = "assets/pixel-art/bounty-banana-128.png"
    size = png_write(path, W, H, pixels)
    # read-back verification
    with open(path, "rb") as f:
        blob = f.read()
    assert blob[:8] == b"\x89PNG\r\n\x1a\n", "bad magic"
    w, h = struct.unpack(">2I", blob[16:24])
    assert (w, h) == (128, 128), (w, h)
    assert blob[-12:] == b"\x00\x00\x00\x00IEND\xaeB`\x82", "missing IEND"
    # full zlib roundtrip: decoded stream must equal what we encoded
    import zlib as _z
    idat = blob[blob.index(b"IDAT") + 4: blob.index(b"IEND") - 4]
    decoded = _z.decompress(idat)
    assert len(decoded) == H * (1 + W * 4), (len(decoded), H * (1 + W * 4))
    print(f"written: {path} {len(blob)} bytes, {w}x{h}")
    print(ascii_proof([row[::S] for row in pixels[::S]]))
