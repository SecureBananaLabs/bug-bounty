from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
ART_PATH = ROOT / "assets" / "pixel-art" / "review-microscope-bench.png"
DEMO_FRAME_DIR = ROOT / "demos" / "review-microscope-frames"

SCALE = 4
BASE_SIZE = 128


def rgba(hex_color):
    value = hex_color.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def new_canvas(color):
    return [[rgba(color) for _ in range(BASE_SIZE)] for _ in range(BASE_SIZE)]


def block(canvas, xy, color):
    x1, y1, x2, y2 = xy
    fill = rgba(color)
    for y in range(max(0, y1), min(BASE_SIZE, y2 + 1)):
        for x in range(max(0, x1), min(BASE_SIZE, x2 + 1)):
            canvas[y][x] = fill


def line(canvas, points, color, width=1):
    x1, y1, x2, y2 = points
    if x1 == x2:
        block(canvas, (x1, min(y1, y2), x1 + width - 1, max(y1, y2)), color)
    elif y1 == y2:
        block(canvas, (min(x1, x2), y1, max(x1, x2), y1 + width - 1), color)
    else:
        # Small deterministic Bresenham fallback, kept for reviewability.
        dx = abs(x2 - x1)
        dy = -abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx + dy
        x, y = x1, y1
        while True:
            block(canvas, (x, y, x + width - 1, y + width - 1), color)
            if x == x2 and y == y2:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x += sx
            if e2 <= dx:
                err += dx
                y += sy


def save_png(canvas, path, scale=1):
    width = BASE_SIZE * scale
    height = BASE_SIZE * scale
    rows = []
    for y in range(BASE_SIZE):
        scaled_row = []
        for pixel in canvas[y]:
            scaled_row.extend(pixel * scale)
        row_bytes = bytes(scaled_row)
        for _ in range(scale):
            rows.append(b"\x00" + row_bytes)
    raw = b"".join(rows)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def make_art(glow_step=0):
    canvas = new_canvas("#0b1020")

    bg = "#101a2d"
    grid = "#17233b"
    rail = "#283a5a"
    cyan = "#38d9ff"
    mint = "#6df7b1"
    gold = "#ffd166"
    amber = "#f59e0b"
    violet = "#a78bfa"
    red = "#fb7185"
    white = "#d9f7ff"
    shadow = "#070a13"

    # Background panels and pixel grid.
    block(canvas, (0, 0, 127, 127), bg)
    for x in range(0, BASE_SIZE, 8):
        line(canvas, (x, 0, x, 127), grid)
    for y in range(0, BASE_SIZE, 8):
        line(canvas, (0, y, 127, y), grid)
    block(canvas, (6, 6, 121, 121), "#0d1426")
    block(canvas, (10, 10, 117, 117), bg)

    # Workbench.
    block(canvas, (14, 88, 113, 98), "#24344f")
    block(canvas, (12, 99, 115, 104), "#101827")
    block(canvas, (20, 105, 28, 119), "#17233b")
    block(canvas, (99, 105, 107, 119), "#17233b")
    line(canvas, (16, 88, 111, 88), rail, 2)

    # Commit chip under inspection.
    block(canvas, (47, 74, 81, 92), "#1f2937")
    block(canvas, (51, 78, 77, 88), "#111827")
    for x in range(45, 84, 6):
        block(canvas, (x, 71, x + 2, 74), violet)
        block(canvas, (x, 92, x + 2, 95), violet)
    for y in range(76, 91, 5):
        block(canvas, (43, y, 46, y + 2), violet)
        block(canvas, (82, y, 85, y + 2), violet)
    block(canvas, (56, 81, 62, 86), mint)
    block(canvas, (65, 81, 72, 86), cyan)

    # Microscope body.
    block(canvas, (34, 35, 46, 40), "#334155")
    block(canvas, (42, 39, 50, 49), "#475569")
    block(canvas, (49, 49, 57, 58), "#64748b")
    block(canvas, (57, 57, 63, 64), "#94a3b8")
    block(canvas, (64, 63, 70, 72), "#cbd5e1")
    block(canvas, (30, 62, 44, 68), "#475569")
    block(canvas, (25, 68, 52, 74), "#334155")
    block(canvas, (24, 75, 55, 80), "#1e293b")
    block(canvas, (36, 42, 42, 70), "#64748b")
    block(canvas, (30, 34, 35, 40), white)
    block(canvas, (67, 67, 73, 72), white)

    # Lens glow on commit chip.
    glow_colors = ["#164e63", "#0e7490", "#0891b2", "#06b6d4"]
    glow = glow_colors[glow_step % len(glow_colors)]
    block(canvas, (58, 68, 76, 74), glow)
    block(canvas, (61, 65, 73, 67), "#67e8f9")
    block(canvas, (64, 61, 70, 64), "#cffafe")

    # Evidence rails and status nodes.
    for y, label_color in [(25, cyan), (33, mint), (41, gold)]:
        line(canvas, (78, y, 108, y), rail, 2)
        block(canvas, (108, y - 2, 113, y + 3), label_color)
        block(canvas, (80, y - 1, 84, y + 2), label_color)
        block(canvas, (88, y - 1, 96, y + 2), "#1e293b")

    # Review checklist display.
    block(canvas, (78, 50, 111, 74), "#111827")
    block(canvas, (80, 52, 109, 72), "#0f172a")
    for i, y in enumerate([56, 62, 68]):
        block(canvas, (83, y, 86, y + 3), mint if i < 2 else gold)
        line(canvas, (90, y + 1, 104, y + 1), "#38bdf8" if i < 2 else "#fbbf24")

    # Payout coin in tray.
    block(canvas, (83, 83, 106, 95), "#3f2e16")
    block(canvas, (88, 78, 101, 91), gold)
    block(canvas, (91, 81, 98, 88), amber)
    line(canvas, (93, 82, 96, 87), "#fff7ad", 1)

    # Small warning marker and signed proof sparkles.
    block(canvas, (19, 28, 28, 37), red)
    block(canvas, (22, 30, 25, 34), "#fff1f2")
    for x, y, color in [(19, 54, mint), (106, 18, cyan), (31, 21, gold), (113, 86, violet)]:
        block(canvas, (x, y, x + 2, y + 2), color)
        block(canvas, (x + 1, y - 2, x + 1, y + 4), color)
        block(canvas, (x - 2, y + 1, x + 4, y + 1), color)

    # Outer shadow and title pixels.
    block(canvas, (9, 118, 118, 121), shadow)
    block(canvas, (17, 13, 20, 16), mint)
    block(canvas, (23, 13, 35, 16), "#60a5fa")
    block(canvas, (39, 13, 52, 16), "#60a5fa")
    block(canvas, (56, 13, 61, 16), gold)

    return canvas


def main():
    ART_PATH.parent.mkdir(parents=True, exist_ok=True)
    DEMO_FRAME_DIR.mkdir(parents=True, exist_ok=True)

    save_png(make_art(2), ART_PATH)

    for idx in range(36):
        frame = make_art(idx // 6)
        if 8 <= idx <= 26:
            # Deterministic scan pulse over the inspected chip.
            x = 48 + (idx - 8) * 2
            block(frame, (x, 75, min(x + 2, 82), 91), "#bae6fd")
        save_png(frame, DEMO_FRAME_DIR / f"frame_{idx:03d}.png", scale=SCALE)

    print(f"wrote {ART_PATH.relative_to(ROOT)}")
    print(f"wrote {len(list(DEMO_FRAME_DIR.glob('frame_*.png')))} demo frames")


if __name__ == "__main__":
    main()
