"""Validate the milestone_signal_bay pixel-art asset."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PIXEL_ART = ROOT / "assets" / "pixel-art" / "milestone_signal_bay.png"
DEMO = ROOT / "assets" / "demos" / "milestone_signal_bay_80.gif"


def assert_png() -> None:
    assert PIXEL_ART.exists(), f"missing {PIXEL_ART}"
    with Image.open(PIXEL_ART) as image:
        assert image.format == "PNG", image.format
        assert image.size == (128, 128), image.size
        assert image.mode == "RGB", image.mode
        colors = image.getcolors(maxcolors=2048)
        assert colors is not None
        assert len(colors) >= 10, len(colors)


def assert_demo() -> None:
    assert DEMO.exists(), f"missing {DEMO}"
    with Image.open(DEMO) as image:
        assert image.format == "GIF", image.format
        assert getattr(image, "is_animated", False)
        assert image.n_frames >= 20, image.n_frames
        assert image.size == (512, 512), image.size


if __name__ == "__main__":
    assert_png()
    assert_demo()
    print("milestone_signal_bay assets validated")
