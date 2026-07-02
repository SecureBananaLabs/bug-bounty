"""
Test the generated pixel art image.

Usage:
    python test_pixel_art_image.py <pixel_art_file>
"""
import os
from PIL import Image

def test_pixel_art_image(pixel_art_file):
    """
    Test the generated pixel art image.

    Args:
        pixel_art_file (str): The file path to the pixel art image.

    Returns:
        bool: True if the image is valid, False otherwise.
    """
    # Open the image file
    with Image.open(pixel_art_file) as img:
        # Check if the image is a .png, .jpg, or .jpeg file
        if not (pixel_art_file.endswith('.png') or pixel_art_file.endswith('.jpg') or pixel_art_file.endswith('.jpeg')):
            return False
        # Check if the image is at least 64x64 pixels
        if img.size[0] < 64 or img.size[1] < 64:
            return False
        return True

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        print("Usage: python test_pixel_art_image.py <pixel_art_file>")
        sys.exit(1)
    pixel_art_file = sys.argv[1]
    if test_pixel_art_image(pixel_art_file):
        print(f"Pixel art image is valid: {pixel_art_file}")
    else:
        print(f"Pixel art image is invalid: {pixel_art_file}")