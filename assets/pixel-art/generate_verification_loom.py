from pathlib import Path

from PIL import Image, ImageDraw


def generate(path: Path) -> None:
    scale = 4
    base = 128
    img = Image.new("RGB", (base, base), "#111622")
    d = ImageDraw.Draw(img)

    bg = "#111622"
    grid = "#1d2a3a"
    thread_blue = "#47b8ff"
    thread_gold = "#f6c85f"
    thread_green = "#62e6a8"
    thread_pink = "#e66ad2"
    shadow = "#0a0f18"
    metal = "#7d8da1"
    metal_dark = "#3b4656"
    cream = "#f5f0d8"

    for x in range(0, base, 8):
        d.line((x, 0, x, base), fill=grid)
    for y in range(0, base, 8):
        d.line((0, y, base, y), fill=grid)
    for x, y in [(16, 24), (104, 24), (24, 104), (96, 96), (64, 16), (112, 64), (16, 72)]:
        d.rectangle((x - 1, y - 1, x + 1, y + 1), fill=thread_gold)

    for y in range(94, 116):
        shade = "#1a2230" if y < 106 else "#121a27"
        d.rectangle((10, y, 118, y), fill=shade)
    d.rectangle((8, 90, 120, 96), fill=metal_dark)
    d.rectangle((12, 86, 116, 91), fill=metal)

    for rect in [
        (18, 28, 24, 92),
        (104, 28, 110, 92),
        (18, 28, 110, 34),
        (18, 72, 110, 78),
    ]:
        d.rectangle(rect, fill=metal_dark)
    for rect in [
        (21, 31, 23, 89),
        (107, 31, 109, 89),
        (22, 31, 106, 33),
        (22, 74, 106, 76),
    ]:
        d.rectangle(rect, fill=metal)

    thread_colors = [thread_blue, thread_green, thread_gold, thread_pink]
    for i, x in enumerate(range(30, 100, 6)):
        color = thread_colors[i % len(thread_colors)]
        d.line((x, 36, x, 88), fill=color, width=2)
        d.point((x, 35), fill=cream)

    for idx, y in enumerate(range(42, 72, 6)):
        color = thread_colors[(idx + 1) % len(thread_colors)]
        d.line((28, y, 100, y), fill=color, width=3)
        for x in range(31 + (idx % 2) * 3, 99, 12):
            d.rectangle((x, y - 1, x + 3, y + 1), fill=bg)

    d.rectangle((45, 56, 83, 62), fill="#2b3548")
    d.rectangle((49, 54, 79, 64), fill="#394962")
    d.rectangle((54, 57, 74, 61), fill=thread_gold)
    d.rectangle((76, 58, 82, 60), fill=thread_green)

    for rect in [
        (53, 66, 58, 71),
        (58, 71, 63, 76),
        (63, 76, 68, 81),
        (68, 71, 73, 76),
        (73, 66, 78, 71),
        (78, 61, 83, 66),
    ]:
        d.rectangle(rect, fill=thread_green)
    d.rectangle((58, 66, 63, 71), fill="#2fd18a")
    d.rectangle((73, 61, 78, 66), fill="#2fd18a")

    for x, color in [(20, thread_blue), (38, thread_gold), (88, thread_green)]:
        d.rectangle((x, 99, x + 14, 110), fill="#242f40")
        d.rectangle((x + 2, 101, x + 12, 103), fill=color)
        d.rectangle((x + 2, 106, x + 8, 107), fill=cream)

    for x, y, color in [
        (36, 20, thread_blue),
        (46, 24, thread_green),
        (78, 22, thread_gold),
        (92, 28, thread_pink),
        (12, 52, thread_green),
        (116, 48, thread_blue),
        (28, 118, thread_gold),
        (102, 116, thread_pink),
    ]:
        d.rectangle((x, y, x + 2, y + 2), fill=color)

    for i in range(0, 12, 2):
        d.rectangle((i, i, base - 1 - i, base - 1 - i), outline=shadow)

    out = img.resize((base * scale, base * scale), Image.Resampling.NEAREST)
    out.save(path)


if __name__ == "__main__":
    generate(Path(__file__).with_name("verification-loom.png"))
