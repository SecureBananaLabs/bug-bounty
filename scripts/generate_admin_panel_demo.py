from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
FRAME_DIR = ROOT / "demos" / "admin-panel-frames"
WIDTH = 1280
HEIGHT = 720


def rgb(hex_color):
    value = hex_color.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def canvas(color):
    return [[rgb(color) for _ in range(WIDTH)] for _ in range(HEIGHT)]


def block(img, xy, color):
    x1, y1, x2, y2 = xy
    fill = rgb(color)
    for y in range(max(0, y1), min(HEIGHT, y2 + 1)):
        row = img[y]
        for x in range(max(0, x1), min(WIDTH, x2 + 1)):
            row[x] = fill


def save_png(img, path):
    raw = b"".join(b"\x00" + bytes(channel for pixel in row for channel in pixel) for row in img)

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


def frame(index):
    img = canvas("#0b1020")
    active = min(6, index // 10 + 1)
    colors = ["#38bdf8", "#f97316", "#22c55e", "#a78bfa", "#facc15", "#fb7185"]

    block(img, (70, 58, 1210, 662), "#111827")
    block(img, (92, 86, 1188, 640), "#172033")
    block(img, (120, 118, 380, 156), "#0f172a")
    block(img, (980, 118, 1130, 156), "#064e3b")

    for i in range(5):
        x = 120 + i * 210
        block(img, (x, 190, x + 170, 280), "#0f172a")
        block(img, (x + 18, 212, x + 72, 232), colors[i % len(colors)])
        block(img, (x + 18, 248, x + 140, 260), "#334155")

    for i in range(6):
        y = 340 + i * 42
        color = colors[i] if i < active else "#475569"
        block(img, (120, y, 1120, y + 26), "#0f172a")
        block(img, (140, y + 6, 240, y + 14), color)
        block(img, (300, y + 6, 520, y + 14), "#64748b")
        block(img, (800, y + 6, 940, y + 14), color)
        block(img, (1000, y + 4, 1080, y + 18), "#1e293b")

    progress = min(990, index * 18)
    block(img, (145, 604, 1135, 622), "#24344f")
    block(img, (145, 604, 145 + progress, 622), "#22c55e")
    return img


def main():
    for idx in range(60):
        save_png(frame(idx), FRAME_DIR / f"frame_{idx:03d}.png")
    print(f"wrote {len(list(FRAME_DIR.glob('frame_*.png')))} demo frames")


if __name__ == "__main__":
    main()
