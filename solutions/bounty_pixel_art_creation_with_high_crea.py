import os
from PIL import Image

def create_pixel_art(size=64):
    """Create a simple 64x64 pixel art of a smiling alien."""
    # Define a small palette
    BG = (20, 20, 40)        # dark background
    SKIN = (0, 200, 0)       # alien green
    EYE = (255, 255, 255)    # white
    MOUTH = (255, 50, 50)    # red
    # Initialize image with background
    img = Image.new("RGB", (size, size), BG)
    pixels = img.load()
    # Draw alien shape (simple symmetric design)
    for y in range(size):
        for x in range(size):
            # Define regions for alien body
            if 10 <= x < 54 and 20 <= y < 44:
                pixels[x, y] = SKIN
            # Eyes
            if (22 <= x < 26 and 28 <= y < 32) or (38 <= x < 42 and 28 <= y < 32):
                pixels[x, y] = EYE
            # Mouth (a simple curve)
            if 24 <= x < 40 and 36 <= y < 40:
                if abs(x - 32) <= 8 - (y - 36):
                    pixels[x, y] = MOUTH
    return img

def save_pixel_art(path, size=64):
    """Save pixel art to the given path, creating directories if needed."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = create_pixel_art(size)
    img.save(path)
    print(f"Pixel art saved to {path}")

if __name__ == "__main__":
    # Example usage: generate and save a 64x64 pixel art PNG
    save_pixel_art("/assets/pixel-art/alien_smiley.png")