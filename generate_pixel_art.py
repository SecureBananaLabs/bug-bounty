"""
Generate a pixel art image from a design.

Usage:
    python generate_pixel_art.py <design_file>

Arguments:
    design_file (str): The file path to the pixel art design.
"""
import os
from PIL import Image

def generate_pixel_art(design_file):
    """
    Generate a pixel art image from a design.

    Args:
        design_file (str): The file path to the pixel art design.

    Returns:
        str: The file path to the generated pixel art image.
    """
    # Open the design file
    with Image.open(design_file) as img:
        # Resize the image to the minimum canvas size
        img = img.resize((64, 64))
        # Save the image as a .png file
        filename = os.path.splitext(design_file)[0] + '.png'
        img.save(filename)
        return filename

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        print("Usage: python generate_pixel_art.py <design_file>")
        sys.exit(1)
    design_file = sys.argv[1]
    pixel_art_file = generate_pixel_art(design_file)
    print(f"Generated pixel art image: {pixel_art_file}")