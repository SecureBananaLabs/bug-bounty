#!/usr/bin/env python3
"""
Pixel Art Generator - Creates original pixel art at 64x64 pixels
Generates a "Cosmic Whale" scene with stars and nebula effects
"""

import struct
import zlib


def create_png(width, height, pixels):
    """Create a minimal PNG file from pixel data"""
    
    def chunks(chunk_type, data):
        chunk = chunk_type + data
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', 
            zlib.crc32(chunk) & 0xFFFFFFFF)
    
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = chunks(b'IHDR', ihdr_data)
    
    # IDAT chunk (compressed image data)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type: None
        for x in range(width):
            r, g, b = pixels[y][x]
            raw_data += bytes([r, g, b])
    
    compressed = zlib.compress(raw_data)
    idat = chunks(b'IDAT', compressed)
    
    # IEND chunk
    iend = chunks(b'IEND', b'')
    
    return signature + ihdr + idat + iend


def create_pixel_art():
    """Create the cosmic whale pixel art"""
    size = 64
    pixels = [[(0, 0, 0) for _ in range(size)] for _ in range(size)]
    
    # Deep space background with gradient
    for y in range(size):
        for x in range(size):
            # Dark blue/purple space background
            r = int(10 + 5 * (y / size))
            g = int(5 + 3 * (y / size))
            b = int(20 + 15 * (y / size))
            pixels[y][x] = (r, g, b)
    
    # Add stars (random white dots)
    import random
    random.seed(42)  # Reproducible
    for _ in range(80):
        sx = random.randint(0, size - 1)
        sy = random.randint(0, size - 1)
        brightness = random.randint(180, 255)
        pixels[sy][sx] = (brightness, brightness, brightness)
    
    # Draw the whale body (teal/cyan color)
    whale_color = (0, 180, 200)
    whale_dark = (0, 120, 140)
    whale_light = (100, 220, 230)
    
    # Whale body - main shape
    # Center of canvas
    cx, cy = 32, 32
    
    # Body curve (simplified bezier-like shape)
    body_points = []
    for t in range(0, 64):
        x = t
        # Curve up then down
        y = 32 + int(15 * (1 - abs(t - 32) / 32) ** 2)
        body_points.append((x, y))
    
    # Fill whale body
    for px in range(size):
        for py in range(size):
            # Check if point is within whale body
            # Simple ellipse approximation
            dx = (px - cx) / 28.0
            dy = (py - cy) / 18.0
            
            if dx * dx + dy * dy <= 1.0:
                # Inside whale body
                # Add shading based on position
                if py < cy - 5:
                    pixels[py][px] = whale_light
                elif py > cy + 5:
                    pixels[py][px] = whale_dark
                else:
                    pixels[py][px] = whale_color
    
    # Tail fin
    tail_points = [
        (55, 32), (58, 28), (60, 22), (58, 30),
        (55, 32), (58, 36), (60, 42), (58, 34)
    ]
    for tx, ty in tail_points:
        if 0 <= tx < size and 0 <= ty < size:
            pixels[ty][tx] = whale_color
    
    # Eye
    pixels[28][25] = (0, 0, 0)
    pixels[29][25] = (0, 0, 0)
    pixels[28][26] = (0, 0, 0)
    
    # Water droplets/splash effect
    splash_color = (150, 220, 230)
    splash_points = [
        (10, 25), (12, 23), (14, 26), (8, 28),
        (15, 30), (11, 32), (13, 29)
    ]
    for sx, sy in splash_points:
        if 0 <= sx < size and 0 <= sy < size:
            pixels[sy][sx] = splash_color
    
    # Small fish in background
    fish_color = (255, 200, 100)
    fish_positions = [(5, 15), (58, 12), (60, 15), (4, 45)]
    for fx, fy in fish_positions:
        if 0 <= fx < size and 0 <= fy < size:
            pixels[fy][fx] = fish_color
    
    # Add some bubbles
    bubble_color = (200, 230, 240)
    bubble_positions = [(20, 40), (25, 42), (22, 45), (30, 38)]
    for bx, by in bubble_positions:
        if 0 <= bx < size and 0 <= by < size:
            pixels[by][bx] = bubble_color
    
    return pixels


def main():
    print("Generating pixel art...")
    pixels = create_pixel_art()
    
    # Create PNG
    png_data = create_png(64, 64, pixels)
    
    # Save to file
    output_path = '/assets/pixel-art/cosmic-whale.png'
    with open(output_path, 'wb') as f:
        f.write(png_data)
    
    print(f"Saved: {output_path}")
    print(f"Size: 64x64 pixels")
    print(f"Theme: Cosmic Whale in deep space")


if __name__ == '__main__':
    main()
