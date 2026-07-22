#!/usr/bin/env python3
"""
Pixel Art Creator
生成指定尺寸和颜色数的随机像素画，输出为 PNG。
Usage:
  python pixel_art_creator.py --width 32 --height 32 --colors 16 --output examples/sample.png
"""
import argparse
import random
from PIL import Image

def main():
    parser = argparse.ArgumentParser(description='Generate random pixel art')
    parser.add_argument('--width', type=int, default=32, help='Image width in pixels')
    parser.add_argument('--height', type=int, default=32, help='Image height in pixels')
    parser.add_argument('--colors', type=int, default=16, help='Number of distinct colors to use')
    parser.add_argument('--output', type=str, required=True, help='Output PNG file path')
    args = parser.parse_args()

    # 生成调色板
    palette = [(random.randint(0,255), random.randint(0,255), random.randint(0,255)) for _ in range(args.colors)]
    # 创建图像
    img = Image.new('RGB', (args.width, args.height))
    pixels = []
    for y in range(args.height):
        for x in range(args.width):
            pixels.append(random.choice(palette))
    img.putdata(pixels)
    img.save(args.output, 'PNG')
    print(f'Saved pixel art to {args.output} ({args.width}x{args.height}, {args.colors} colors)')

if __name__ == '__main__':
    main()
