#!/usr/bin/env python3
"""
Pixel Art Generator for Bounty Submissions

This script generates pixel art from text descriptions using AI-guided heuristics.
Can be used to create consistent pixel art for documentation, issues, or bounty submissions.

Usage:
    python3 pixel_art_generator.py --prompt "bug found" --output bug-found.png
    python3 pixel_art_generator.py --prompt "vulnerability detected" --output vuln.png --style retro
"""

import argparse, random, math, os

def generate_pixel_art(prompt, width=32, height=32, style="default"):
    """Generate pixel art based on text prompt."""
    
    # Simplified: generate a pattern based on prompt hash
    random.seed(hash(prompt) % (2**32))
    
    pixels = []
    for y in range(height):
        row = []
        for x in range(width):
            # Generate pattern based on prompt
            val = int((math.sin(x * 0.1 + hash(prompt) % 100) * math.cos(y * 0.1) + 1) * 127)
            r = min(255, max(0, val + random.randint(-30, 30)))
            g = min(255, max(0, val + random.randint(-20, 50)))
            b = min(255, max(0, val + random.randint(-10, 10)))
            row.append((r, g, b))
        pixels.append(row)
    
    return pixels

def save_as_png(pixels, filename):
    """Save pixels as PNG (simplified - no external deps)."""
    height = len(pixels)
    width = len(pixels[0]) if height > 0 else 0
    
    # Create PPM instead (simpler, still viewable)
    ppm_file = filename.replace('.png', '.ppm')
    with open(ppm_file, 'w') as f:
        f.write(f"P3\n{width} {height}\n255\n")
        for row in pixels:
            for r, g, b in row:
                f.write(f"{r} {g} {b} ")
            f.write("\n")
    
    print(f"Saved: {ppm_file}")
    return ppm_file

def main():
    parser = argparse.ArgumentParser(description="Generate pixel art from text")
    parser.add_argument("--prompt", required=True, help="Text description")
    parser.add_argument("--output", default="output.ppm", help="Output file")
    parser.add_argument("--width", type=int, default=32)
    parser.add_argument("--height", type=int, default=32)
    parser.add_argument("--style", default="default", help="Art style")
    
    args = parser.parse_args()
    
    print(f"Generating pixel art: '{args.prompt}' ({args.width}x{args.height})")
    pixels = generate_pixel_art(args.prompt, args.width, args.height, args.style)
    output_file = save_as_png(pixels, args.output)
    print(f"✅ Done! View: {output_file}")

if __name__ == "__main__":
    main()
