#!/usr/bin/env python3
"""Create a short animated GIF demo for the issue #2883 PI artifact."""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ARTIFACT = Path("docs/pi/pi-150000-2883.md")
OUTPUT = Path("demos/pi-150000-2883-demo.gif")


def load_summary() -> tuple[str, str]:
    text = ARTIFACT.read_text(encoding="utf-8")
    digest_match = re.search(r"SHA-256 of the compact `3\.<digits>` value: `([0-9a-f]+)`", text)
    if not digest_match:
        raise RuntimeError("could not find SHA-256 line in PI artifact")
    digest = digest_match.group(1)
    first_digits = "".join(character for character in text.split("```text", 1)[1] if character.isdigit())[:32]
    return digest, first_digits


def font(size: int) -> ImageFont.ImageFont:
    for name in ("DejaVuSansMono.ttf", "C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/cour.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_frame(title: str, lines: list[str], accent: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (960, 540), (15, 17, 24))
    draw = ImageDraw.Draw(image)

    for x in range(-100, 980, 48):
        draw.line((x, 540, x + 260, 0), fill=(25, 35, 44), width=3)

    draw.rectangle((36, 34, 924, 506), outline=accent, width=4)
    draw.rectangle((54, 64, 906, 150), fill=(20, 29, 39), outline=(84, 99, 110), width=2)
    draw.text((78, 84), title, fill=(242, 246, 250), font=font(38))

    y = 190
    for line in lines:
        draw.text((82, y), line, fill=(226, 232, 238), font=font(28))
        y += 52

    for index, x in enumerate(range(96, 864, 64)):
        height = 26 + (index % 4) * 12
        draw.rectangle((x, 456 - height, x + 34, 456), fill=accent)
        draw.rectangle((x, 462, x + 34, 474), fill=(67, 78, 91))

    return image


def main() -> int:
    digest, first_digits = load_summary()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    frames = [
        draw_frame(
            "Discussion #2872 continued",
            ["150,000 decimal places", f"prefix: {first_digits[:17]}...", "docs/pi/pi-150000-2883.md"],
            (111, 191, 255),
        ),
        draw_frame(
            "Verifier included",
            ["standard-library Python", "Chudnovsky binary splitting", "first 100 decimals checked"],
            (95, 211, 176),
        ),
        draw_frame(
            "Checksum evidence",
            [f"sha256: {digest[:24]}...", "regenerates byte-for-byte", "discussion summary ready"],
            (255, 203, 107),
        ),
        draw_frame(
            "Claim-ready",
            ["repo starred", "short demo GIF included", "/claim #2883"],
            (235, 128, 166),
        ),
    ]

    frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=frames[1:],
        duration=900,
        loop=0,
        optimize=False,
    )
    print(f"wrote {OUTPUT} ({frames[0].size[0]}x{frames[0].size[1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
