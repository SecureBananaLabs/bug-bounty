from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ART_PATH = ROOT / "assets" / "pixel-art" / "review-ledger-terminal.png"
DEMO_MP4_PATH = ROOT / "demos" / "issue-80-review-ledger-terminal-demo.mp4"
DEMO_AVI_PATH = ROOT / "demos" / "issue-80-review-ledger-terminal-demo.avi"

W = 128
H = 128

BG = (15, 18, 25)
PANEL = (35, 43, 58)
PANEL_DARK = (22, 28, 39)
EDGE = (92, 116, 134)
BLUE = (89, 179, 255)
GREEN = (89, 227, 149)
AMBER = (252, 180, 71)
RED = (239, 89, 99)
INK = (8, 10, 14)
WHITE = (229, 239, 247)
MUTED = (111, 132, 147)


def new_canvas(color=BG):
    return [[color for _ in range(W)] for _ in range(H)]


def rect(canvas, x0, y0, x1, y1, color):
    x0 = max(0, min(W, x0))
    x1 = max(0, min(W, x1))
    y0 = max(0, min(H, y0))
    y1 = max(0, min(H, y1))
    for y in range(y0, y1):
        row = canvas[y]
        for x in range(x0, x1):
            row[x] = color


def frame(canvas, x0, y0, x1, y1, color):
    rect(canvas, x0, y0, x1, y0 + 1, color)
    rect(canvas, x0, y1 - 1, x1, y1, color)
    rect(canvas, x0, y0, x0 + 1, y1, color)
    rect(canvas, x1 - 1, y0, x1, y1, color)


def dither_rect(canvas, x0, y0, x1, y1, c1, c2):
    for y in range(y0, y1):
        for x in range(x0, x1):
            canvas[y][x] = c1 if (x + y) % 2 == 0 else c2


def line_h(canvas, x0, x1, y, color):
    rect(canvas, x0, y, x1, y + 1, color)


def line_v(canvas, x, y0, y1, color):
    rect(canvas, x, y0, x + 1, y1, color)


def draw_terminal(canvas, pulse=0.0):
    # Back wall and desk.
    dither_rect(canvas, 0, 0, W, H, (14, 17, 24), (17, 21, 29))
    rect(canvas, 0, 95, W, H, (19, 23, 31))
    rect(canvas, 15, 91, 113, 101, (26, 31, 42))
    frame(canvas, 15, 91, 113, 101, (67, 81, 95))

    # Main ledger terminal.
    rect(canvas, 19, 18, 109, 89, PANEL_DARK)
    rect(canvas, 23, 22, 105, 85, PANEL)
    frame(canvas, 19, 18, 109, 89, EDGE)
    rect(canvas, 25, 24, 103, 28, (66, 80, 96))
    rect(canvas, 28, 26, 33, 27, RED)
    rect(canvas, 36, 26, 41, 27, AMBER)
    rect(canvas, 44, 26, 49, 27, GREEN)

    # Four workflow lanes: brief, proof, review, payout.
    lane_y = [36, 48, 60, 72]
    colors = [BLUE, GREEN, AMBER, RED]
    widths = [52, 62, 46, 57]
    for i, y in enumerate(lane_y):
        rect(canvas, 31, y, 96, y + 7, (24, 30, 42))
        frame(canvas, 31, y, 96, y + 7, (54, 67, 80))
        rect(canvas, 35, y + 2, 35 + widths[i], y + 5, colors[i])
        rect(canvas, 89, y + 2, 92, y + 5, WHITE if i < 3 else AMBER)

    # Payout coin rail and acceptance window.
    rect(canvas, 75, 80, 101, 84, (24, 30, 42))
    for x in (79, 86, 93):
        rect(canvas, x, 78, x + 4, 82, AMBER)
        rect(canvas, x + 1, 79, x + 3, 81, (255, 218, 115))
    rect(canvas, 27, 79, 57, 84, (24, 30, 42))
    rect(canvas, 30, 80, 54, 82, GREEN)

    # Scanner antenna.
    line_v(canvas, 64, 9, 18, MUTED)
    rect(canvas, 57, 9, 72, 11, MUTED)
    glow = int(45 + 35 * pulse)
    signal = (min(255, BLUE[0] + glow), min(255, BLUE[1] + glow // 2), 255)
    frame(canvas, 54, 5, 75, 15, signal)
    rect(canvas, 61, 7, 68, 13, signal)

    # Side proof lights.
    for i in range(6):
        x = 8 + i * 6
        lit = i <= int(2 + pulse * 3)
        rect(canvas, x, 106, x + 3, 109, GREEN if lit else (48, 57, 66))
    for i in range(5):
        x = 93 + i * 5
        lit = i <= int(1 + pulse * 4)
        rect(canvas, x, 106, x + 3, 109, AMBER if lit else (48, 57, 66))

    # Pixel signature blocks: scoped, tested, reviewed, paid.
    for i, c in enumerate((BLUE, GREEN, AMBER, RED)):
        x = 25 + i * 20
        rect(canvas, x, 108, x + 10, 118, (23, 28, 38))
        frame(canvas, x, 108, x + 10, 118, (59, 72, 84))
        rect(canvas, x + 3, 111, x + 7, 115, c)

    # A few scanline highlights.
    for y in range(31, 88, 8):
        line_h(canvas, 24, 104, y, (41, 50, 64))


def pixel_art(pulse=0.0):
    canvas = new_canvas()
    draw_terminal(canvas, pulse)
    return canvas


def png_chunk(kind, data):
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def write_png(path, canvas):
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))
    data = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            png_chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0)),
            png_chunk(b"IDAT", zlib.compress(bytes(raw), 9)),
            png_chunk(b"IEND", b""),
        ]
    )
    path.write_bytes(data)


def scale_canvas(canvas, scale=2):
    out_w = W * scale
    out_h = H * scale
    rows = []
    for row in canvas:
        expanded = []
        for pixel in row:
            expanded.extend([pixel] * scale)
        for _ in range(scale):
            rows.append(expanded[:])
    return out_w, out_h, rows


def avi_chunk(kind, data):
    pad = b"\0" if len(data) % 2 else b""
    return kind + struct.pack("<I", len(data)) + data + pad


def avi_list(kind, data):
    return b"LIST" + struct.pack("<I", len(data) + 4) + kind + data


def frame_bytes(rows, width, height):
    # AVI DIB frames use bottom-up BGR rows.
    data = bytearray()
    row_stride = ((width * 3 + 3) // 4) * 4
    pad = b"\0" * (row_stride - width * 3)
    for y in range(height - 1, -1, -1):
        for r, g, b in rows[y]:
            data.extend((b, g, r))
        data.extend(pad)
    return bytes(data)


def write_avi(path, frames, fps=10):
    path.parent.mkdir(parents=True, exist_ok=True)
    width, height, first_rows = frames[0]
    sample = frame_bytes(first_rows, width, height)
    frame_size = len(sample)
    total = len(frames)

    avih = struct.pack(
        "<IIIIIIIIII4I",
        int(1_000_000 / fps),
        frame_size * fps,
        0,
        0x10,
        total,
        0,
        1,
        frame_size,
        width,
        height,
        0,
        0,
        0,
        0,
    )
    strh = struct.pack(
        "<4s4sIHHIIIIIIIIhhhh",
        b"vids",
        b"DIB ",
        0,
        0,
        0,
        0,
        1,
        fps,
        0,
        total,
        frame_size,
        0xFFFFFFFF,
        0,
        0,
        0,
        width,
        height,
    )
    strf = struct.pack(
        "<IiiHHIIiiII",
        40,
        width,
        height,
        1,
        24,
        0,
        frame_size,
        0,
        0,
        0,
        0,
    )
    hdrl = avi_list(b"hdrl", avi_chunk(b"avih", avih) + avi_list(b"strl", avi_chunk(b"strh", strh) + avi_chunk(b"strf", strf)))

    movi_data = bytearray()
    index = bytearray()
    offset = 4
    for _, _, rows in frames:
        data = frame_bytes(rows, width, height)
        chunk = avi_chunk(b"00db", data)
        movi_data.extend(chunk)
        index.extend(struct.pack("<4sIII", b"00db", 0x10, offset, len(data)))
        offset += len(chunk)
    movi = avi_list(b"movi", bytes(movi_data))
    idx1 = avi_chunk(b"idx1", bytes(index))
    body = b"AVI " + hdrl + movi + idx1
    path.write_bytes(b"RIFF" + struct.pack("<I", len(body)) + body)


def write_mp4(path, frames, fps=10):
    try:
        import imageio.v3 as iio
        import numpy as np
    except Exception:
        return False

    path.parent.mkdir(parents=True, exist_ok=True)
    arrays = [np.array(rows, dtype=np.uint8) for _, _, rows in frames]
    iio.imwrite(path, arrays, fps=fps, codec="libx264", quality=7, macro_block_size=16)
    return True


def main():
    still = pixel_art(0.75)
    write_png(ART_PATH, still)

    frames = []
    for i in range(50):
        pulse = (math.sin(i / 50 * math.tau) + 1) / 2
        frames.append(scale_canvas(pixel_art(pulse), 4))

    print(f"wrote {ART_PATH.relative_to(ROOT)}")
    if write_mp4(DEMO_MP4_PATH, frames):
        print(f"wrote {DEMO_MP4_PATH.relative_to(ROOT)}")
    else:
        write_avi(DEMO_AVI_PATH, frames)
        print(f"wrote {DEMO_AVI_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
