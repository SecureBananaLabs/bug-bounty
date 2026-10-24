#!/usr/bin/env python3
"""
Pixel Art Generator - Creates a cute pixel art image
Theme: A cozy pixel art scene with a cat and stars
"""

from PIL import Image, ImageDraw
import random

def create_pixel_art():
    # Create a 128x128 pixel canvas
    width, height = 128, 128
    img = Image.new('RGB', (width, height), (20, 20, 40))  # Dark blue background
    draw = ImageDraw.Draw(img)
    
    # Define pixel size (each "pixel" in our art is 4x4 actual pixels)
    pixel_size = 4
    
    # Colors
    cat_color = (255, 165, 0)  # Orange
    cat_dark = (200, 120, 0)   # Dark orange
    eye_color = (0, 255, 0)    # Green
    nose_color = (255, 100, 100)  # Pink
    star_color = (255, 255, 100)  # Yellow
    moon_color = (200, 200, 255)  # Light blue
    
    # Draw stars
    for _ in range(30):
        x = random.randint(0, width - 1)
        y = random.randint(0, height // 2)
        size = random.randint(1, 3)
        brightness = random.randint(150, 255)
        draw.rectangle([x, y, x + size, y + size], fill=(brightness, brightness, brightness))
    
    # Draw moon
    moon_x, moon_y = 20, 20
    for dx in range(-8, 9):
        for dy in range(-8, 9):
            if dx*dx + dy*dy <= 64:
                px = moon_x + dx
                py = moon_y + dy
                if 0 <= px < width and 0 <= py < height:
                    draw.rectangle([px*2, py*2, px*2+1, py*2+1], fill=moon_color)
    
    # Draw cat body (sitting position)
    cat_center_x, cat_center_y = 64, 80
    
    # Cat body
    body_pixels = [
        (0, 0), (1, 0), (2, 0), (3, 0),
        (-1, 1), (0, 1), (1, 1), (2, 1), (3, 1), (4, 1),
        (-1, 2), (0, 2), (1, 2), (2, 2), (3, 2), (4, 2),
        (-1, 3), (0, 3), (1, 3), (2, 3), (3, 3), (4, 3),
        (0, 4), (1, 4), (2, 4), (3, 4),
    ]
    
    for dx, dy in body_pixels:
        x = cat_center_x + dx * pixel_size
        y = cat_center_y + dy * pixel_size
        draw.rectangle([x, y, x + pixel_size - 1, y + pixel_size - 1], fill=cat_color)
    
    # Cat head
    head_pixels = [
        (1, -2), (2, -2), (3, -2),
        (0, -1), (1, -1), (2, -1), (3, -1), (4, -1),
        (0, 0), (1, 0), (2, 0), (3, 0), (4, 0),
        (1, 1), (2, 1), (3, 1),
    ]
    
    for dx, dy in head_pixels:
        x = cat_center_x + dx * pixel_size
        y = cat_center_y + dy * pixel_size
        draw.rectangle([x, y, x + pixel_size - 1, y + pixel_size - 1], fill=cat_color)
    
    # Cat ears
    ear_pixels = [
        (-1, -3), (0, -2), (0, -3),
        (5, -3), (4, -2), (4, -3),
    ]
    
    for dx, dy in ear_pixels:
        x = cat_center_x + dx * pixel_size
        y = cat_center_y + dy * pixel_size
        draw.rectangle([x, y, x + pixel_size - 1, y + pixel_size - 1], fill=cat_dark)
    
    # Cat eyes
    eye_pixels = [
        (1, -1), (3, -1),
    ]
    
    for dx, dy in eye_pixels:
        x = cat_center_x + dx * pixel_size
        y = cat_center_y + dy * pixel_size
        draw.rectangle([x, y, x + pixel_size - 1, y + pixel_size - 1], fill=eye_color)
    
    # Cat nose
    nose_x = cat_center_x + 2 * pixel_size
    nose_y = cat_center_y + 0 * pixel_size
    draw.rectangle([nose_x, nose_y, nose_x + pixel_size - 1, nose_y + pixel_size - 1], fill=nose_color)
    
    # Cat tail
    tail_pixels = [
        (5, 2), (6, 2), (7, 2), (7, 1), (7, 0),
    ]
    
    for dx, dy in tail_pixels:
        x = cat_center_x + dx * pixel_size
        y = cat_center_y + dy * pixel_size
        draw.rectangle([x, y, x + pixel_size - 1, y + pixel_size - 1], fill=cat_dark)
    
    # Save the image
    output_path = "assets/pixel-art/cozy_cat_night.png"
    img.save(output_path, "PNG")
    print(f"✅ Pixel art saved to: {output_path}")
    print(f"📐 Image size: {width}x{height} pixels")
    print(f"🎨 Theme: Cozy cat under the night sky")
    
    return output_path

if __name__ == "__main__":
    create_pixel_art()
