#!/usr/bin/env python3
"""Generate a short proof video for the bounty #76 poem submission."""

from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
POEM = ROOT / "POEM.md"
OUT_DIR = ROOT / "demos"
OUT = OUT_DIR / "darkroom-proof-poem-demo.mp4"
PNG = OUT_DIR / "darkroom-proof-poem-demo.png"
GEORGIA = Path("/System/Library/Fonts/Supplemental/Georgia.ttf")
GEORGIA_BOLD = Path("/System/Library/Fonts/Supplemental/Georgia Bold.ttf")
WIDTH = 1280
HEIGHT = 720
FPS = 12
DURATION_SECONDS = 5


def load_font(path: Path, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if path.exists():
        return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default(size=size)


def centered_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, fill) -> None:
    y = xy[1]
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (WIDTH - (bbox[2] - bbox[0])) // 2
    draw.text((x, y), text, font=font, fill=fill)


def render_frame(progress: float) -> Image.Image:
    title_and_poem = POEM.read_text(encoding="utf-8").strip().replace("# ", "", 1)
    lines = title_and_poem.splitlines()
    title = lines[0]
    body_lines = lines[1:]
    while body_lines and not body_lines[0]:
        body_lines.pop(0)

    image = Image.new("RGB", (WIDTH, HEIGHT), "#111820")
    draw = ImageDraw.Draw(image)
    title_font = load_font(GEORGIA_BOLD, 42)
    body_font = load_font(GEORGIA, 24)
    footer_font = load_font(GEORGIA, 22)

    draw.rounded_rectangle((54, 42, 1226, 678), radius=18, outline="#4c5d5f", width=2)
    draw.rounded_rectangle((86, 74, 1194, 646), radius=14, fill="#101418")
    draw.rectangle((86, 74, 1194, 108), fill="#182229")

    centered_text(draw, (0, 124), title, title_font, "#f3efe4")

    y = 198
    line_height = 27
    stanza_gap = 8
    for line in body_lines:
        if not line:
            y += stanza_gap
            continue
        centered_text(draw, (0, y), line, body_font, "#e9e3d6")
        y += line_height

    footer = "POEM.md proof preview | bounty #76"
    centered_text(draw, (0, 688), footer, footer_font, "#9eb8b0")
    draw.rounded_rectangle((300, 660, 980, 668), radius=4, fill="#263238")
    draw.rounded_rectangle((300, 660, 300 + int(680 * progress), 668), radius=4, fill="#b7c7a7")

    return image


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    total_frames = FPS * DURATION_SECONDS

    frame = render_frame(1.0)
    frame.save(PNG)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for index in range(total_frames):
            progress = (index + 1) / total_frames
            render_frame(progress).save(tmp_path / f"frame_{index:03d}.png")

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                str(FPS),
                "-i",
                str(tmp_path / "frame_%03d.png"),
                "-an",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(OUT),
            ],
            check=True,
        )

    shutil.rmtree(OUT_DIR / "frames", ignore_errors=True)


if __name__ == "__main__":
    main()
