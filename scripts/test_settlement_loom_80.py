from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PNG_PATH = ROOT / "assets" / "pixel-art" / "settlement_loom.png"
DEMO_PATH = ROOT / "assets" / "demos" / "settlement-loom-80-demo.mp4"
GENERATOR_PATH = ROOT / "scripts" / "generate_settlement_loom_80.py"


def assert_file(path: Path) -> None:
    assert path.exists(), f"Missing required file: {path.relative_to(ROOT)}"
    assert path.stat().st_size > 0, f"File is empty: {path.relative_to(ROOT)}"


def test_png_asset() -> None:
    assert_file(PNG_PATH)
    with Image.open(PNG_PATH) as image:
        assert image.format == "PNG", "Pixel art asset must be a PNG"
        assert image.size == (128, 128), f"Expected 128x128 canvas, got {image.size}"
        colors = image.convert("RGB").getcolors(maxcolors=16384)
        assert colors is not None and len(colors) >= 16, "Artwork should use a deliberate multi-color palette"


def test_demo_video() -> None:
    assert_file(DEMO_PATH)
    assert DEMO_PATH.stat().st_size > 20_000, "Demo video should contain an actual rendered preview"


def test_generator_present() -> None:
    assert_file(GENERATOR_PATH)


if __name__ == "__main__":
    test_png_asset()
    test_demo_video()
    test_generator_present()
    print("settlement loom asset checks passed")
