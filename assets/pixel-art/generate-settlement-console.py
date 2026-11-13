#!/usr/bin/env python3
"""Generate a small original pixel-art settlement console without third-party dependencies."""
from pathlib import Path
import struct
import zlib

W = H = 128
BG = (10, 18, 32, 255)

def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)

def put(px, x, y, color):
    if 0 <= x < W and 0 <= y < H:
        px[y][x] = color

def rect(px, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(px, xx, yy, color)

def outline(px, x, y, w, h, color):
    for xx in range(x, x + w):
        put(px, xx, y, color); put(px, xx, y + h - 1, color)
    for yy in range(y, y + h):
        put(px, x, yy, color); put(px, x + w - 1, yy, color)

def main():
    px = [[BG for _ in range(W)] for _ in range(H)]
    navy = (18, 31, 53, 255); blue = (37, 93, 150, 255); cyan = (72, 220, 219, 255)
    gold = (255, 196, 74, 255); green = (93, 224, 141, 255); red = (242, 102, 112, 255)
    pale = (203, 232, 241, 255); violet = (132, 112, 222, 255); dark = (6, 12, 23, 255)
    # subtle star/indicator pixels
    for x, y in [(8, 12), (25, 8), (116, 15), (108, 31), (14, 91), (119, 103), (71, 10), (91, 119)]: put(px, x, y, cyan)
    # outer console and header
    rect(px, 8, 20, 112, 88, navy); outline(px, 8, 20, 112, 88, blue)
    rect(px, 12, 24, 104, 10, dark); rect(px, 16, 27, 4, 4, green); rect(px, 24, 27, 22, 4, pale)
    rect(px, 98, 27, 12, 4, gold)
    # left status panel
    rect(px, 14, 39, 29, 61, dark); outline(px, 14, 39, 29, 61, blue)
    rect(px, 18, 44, 21, 5, violet); rect(px, 18, 55, 14, 3, pale)
    for y, c, n in [(65, green, 16), (74, cyan, 11), (83, gold, 18), (92, red, 7)]:
        rect(px, 18, y, n, 4, c); rect(px, 34, y, 5, 4, dark)
    # central work packet flowing to a payout core
    rect(px, 49, 39, 61, 61, dark); outline(px, 49, 39, 61, 61, blue)
    rect(px, 55, 46, 19, 17, blue); outline(px, 55, 46, 19, 17, cyan); rect(px, 60, 51, 9, 3, pale); rect(px, 60, 57, 5, 3, gold)
    rect(px, 82, 46, 19, 17, blue); outline(px, 82, 46, 19, 17, cyan); rect(px, 87, 51, 10, 3, pale); rect(px, 87, 57, 7, 3, green)
    # rails and arrows
    rect(px, 73, 53, 9, 3, gold); rect(px, 76, 50, 3, 9, gold)
    rect(px, 59, 72, 42, 4, violet); rect(px, 59, 87, 42, 4, cyan)
    for x in (64, 75, 86, 97): rect(px, x, 70, 3, 8, pale)
    for x in (64, 75, 86, 97): rect(px, x, 85, 3, 8, pale)
    # glowing settlement core
    rect(px, 68, 94, 24, 3, gold); rect(px, 72, 98, 16, 2, pale)
    rect(px, 76, 78, 8, 12, gold); rect(px, 73, 81, 14, 6, gold); rect(px, 78, 75, 4, 18, pale)
    # footer labels and lamps
    rect(px, 54, 103, 14, 3, green); rect(px, 72, 103, 14, 3, cyan); rect(px, 90, 103, 14, 3, gold)
    raw = b"".join(b"\x00" + bytes(sum(row, ())) for row in px)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    out = Path(__file__).with_name("settlement-console.png")
    out.write_bytes(png)
    print(f"{out} {W}x{H} bytes={len(png)}")

if __name__ == "__main__":
    main()
