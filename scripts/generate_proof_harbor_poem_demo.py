from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
FRAME_DIR = ROOT / "demos" / "proof-harbor-frames"

WIDTH = 1280
HEIGHT = 720


def rgba(hex_color):
    value = hex_color.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def canvas(color):
    return [[rgba(color) for _ in range(WIDTH)] for _ in range(HEIGHT)]


def block(img, xy, color):
    x1, y1, x2, y2 = xy
    fill = rgba(color)
    for y in range(max(0, y1), min(HEIGHT, y2 + 1)):
        row = img[y]
        for x in range(max(0, x1), min(WIDTH, x2 + 1)):
            row[x] = fill


def line(img, xy, color, width=4):
    x1, y1, x2, y2 = xy
    if y1 == y2:
        block(img, (min(x1, x2), y1, max(x1, x2), y1 + width - 1), color)
    elif x1 == x2:
        block(img, (x1, min(y1, y2), x1 + width - 1, max(y1, y2)), color)


def save_png(img, path):
    raw = b"".join(b"\x00" + bytes(channel for px in row for channel in px) for row in img)

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
        + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 6))
        + chunk(b"IEND", b"")
    )


def draw_frame(index):
    img = canvas("#0b1020")
    active = min(5, index // 8 + 1)

    for x in range(0, WIDTH, 40):
        line(img, (x, 0, x, HEIGHT - 1), "#101a2d", 1)
    for y in range(0, HEIGHT, 40):
        line(img, (0, y, WIDTH - 1, y), "#101a2d", 1)

    block(img, (120, 96, 1160, 624), "#111827")
    block(img, (132, 108, 1148, 612), "#172033")

    colors = ["#38d9ff", "#6df7b1", "#ffd166", "#a78bfa", "#f472b6"]
    x0 = 190
    y0 = 225
    gap = 185

    for i in range(5):
        x = x0 + i * gap
        color = colors[i] if i < active else "#334155"
        block(img, (x, y0, x + 120, y0 + 170), "#0f172a")
        block(img, (x + 8, y0 + 8, x + 112, y0 + 162), "#1e293b")
        block(img, (x + 18, y0 + 22, x + 102, y0 + 36), color)
        for row in range(4):
            line(img, (x + 22, y0 + 58 + row * 22, x + 96, y0 + 58 + row * 22), color, 5)
        block(img, (x + 46, y0 + 134, x + 74, y0 + 150), color)
        if i < 4:
            line(img, (x + 125, y0 + 85, x + gap - 12, y0 + 85), "#475569", 8)
            if i + 1 < active:
                line(img, (x + 125, y0 + 85, x + gap - 12, y0 + 85), "#6df7b1", 8)

    # Harbor base: issue, evidence, review, merge, payout as abstract blocks.
    block(img, (220, 470, 1060, 492), "#24344f")
    for i, color in enumerate(colors):
        x = 245 + i * 195
        block(img, (x, 510, x + 86, 548), color if i < active else "#334155")
        block(img, (x + 18, 558, x + 68, 574), "#0f172a")

    return img


def main():
    for idx in range(48):
        save_png(draw_frame(idx), FRAME_DIR / f"frame_{idx:03d}.png")
    print(f"wrote {len(list(FRAME_DIR.glob('frame_*.png')))} demo frames")


if __name__ == "__main__":
    main()
