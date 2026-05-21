from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
FRAME_DIR = ROOT / "demos" / "stripe-payment-frames"
WIDTH = 960
HEIGHT = 540


def rgb(hex_color):
    value = hex_color.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def new_canvas(color):
    return [[rgb(color) for _ in range(WIDTH)] for _ in range(HEIGHT)]


def block(canvas, xy, color):
    x1, y1, x2, y2 = xy
    fill = rgb(color)
    for y in range(max(0, y1), min(HEIGHT, y2 + 1)):
        row = canvas[y]
        for x in range(max(0, x1), min(WIDTH, x2 + 1)):
            row[x] = fill


def line(canvas, xy, color, width=4):
    x1, y1, x2, y2 = xy
    if y1 == y2:
        block(canvas, (min(x1, x2), y1, max(x1, x2), y1 + width - 1), color)
    elif x1 == x2:
        block(canvas, (x1, min(y1, y2), x1 + width - 1, max(y1, y2)), color)


def save_png(canvas, path):
    raw = b"".join(b"\x00" + bytes(channel for pixel in row for channel in pixel) for row in canvas)

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
        + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 6))
        + chunk(b"IEND", b"")
    )


def draw_frame(index):
    canvas = new_canvas("#0b1020")
    pulse = index % 12
    active = min(4, index // 12 + 1)
    colors = ["#38bdf8", "#a78bfa", "#6df7b1", "#ffd166"]

    block(canvas, (80, 70, 880, 470), "#111827")
    block(canvas, (96, 86, 864, 454), "#172033")

    for x in range(130, 831, 210):
        line(canvas, (x, 270, x + 160, 270), "#334155", 8)

    for i in range(4):
        x = 130 + i * 210
        color = colors[i] if i < active else "#475569"
        block(canvas, (x, 160, x + 120, 280), "#0f172a")
        block(canvas, (x + 10, 170, x + 110, 270), "#1e293b")
        block(canvas, (x + 24, 190, x + 96, 208), color)
        block(canvas, (x + 24, 225, x + 70, 238), color)
        block(canvas, (x + 24, 246, x + 92, 256), color)
        if i < 3 and i + 1 < active:
            line(canvas, (x + 124, 220, x + 204, 220), "#6df7b1", 10)

    scan_x = 130 + min(active - 1, 3) * 210 + 18 + pulse * 7
    block(canvas, (scan_x, 174, scan_x + 8, 266), "#e0f2fe")

    block(canvas, (165, 345, 795, 385), "#24344f")
    progress_width = min(630, index * 14)
    block(canvas, (165, 345, 165 + progress_width, 385), "#22c55e")
    for x in range(190, 775, 80):
        block(canvas, (x, 405, x + 38, 428), "#334155")
        if x < 165 + progress_width:
            block(canvas, (x, 405, x + 38, 428), "#facc15")

    return canvas


def main():
    for idx in range(48):
        save_png(draw_frame(idx), FRAME_DIR / f"frame_{idx:03d}.png")
    print(f"wrote {len(list(FRAME_DIR.glob('frame_*.png')))} demo frames")


if __name__ == "__main__":
    main()
