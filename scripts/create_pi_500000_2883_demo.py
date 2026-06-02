#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path


WIDTH = 960
HEIGHT = 540
OUTPUT = Path("demos/pi-500000-2883-demo.mp4")
SHA = "5F3ABE6957D568030429A1D56B4E7F637F8C69A5A0CAEEF84B53B193DE0FB037"

FONT = {
    " ": ["000", "000", "000", "000", "000", "000", "000"],
    "-": ["000", "000", "000", "111", "000", "000", "000"],
    "#": ["01010", "11111", "01010", "01010", "11111", "01010", "01010"],
    "0": ["111", "101", "101", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "010", "010", "111"],
    "2": ["111", "001", "001", "111", "100", "100", "111"],
    "3": ["111", "001", "001", "111", "001", "001", "111"],
    "4": ["101", "101", "101", "111", "001", "001", "001"],
    "5": ["111", "100", "100", "111", "001", "001", "111"],
    "6": ["111", "100", "100", "111", "101", "101", "111"],
    "7": ["111", "001", "001", "010", "010", "010", "010"],
    "8": ["111", "101", "101", "111", "101", "101", "111"],
    "9": ["111", "101", "101", "111", "001", "001", "111"],
    "A": ["010", "101", "101", "111", "101", "101", "101"],
    "B": ["110", "101", "101", "110", "101", "101", "110"],
    "C": ["111", "100", "100", "100", "100", "100", "111"],
    "D": ["110", "101", "101", "101", "101", "101", "110"],
    "E": ["111", "100", "100", "111", "100", "100", "111"],
    "F": ["111", "100", "100", "111", "100", "100", "100"],
    "G": ["111", "100", "100", "101", "101", "101", "111"],
    "H": ["101", "101", "101", "111", "101", "101", "101"],
    "I": ["111", "010", "010", "010", "010", "010", "111"],
    "K": ["101", "101", "110", "100", "110", "101", "101"],
    "L": ["100", "100", "100", "100", "100", "100", "111"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "N": ["1001", "1101", "1011", "1001", "1001", "1001", "1001"],
    "O": ["111", "101", "101", "101", "101", "101", "111"],
    "P": ["111", "101", "101", "111", "100", "100", "100"],
    "R": ["110", "101", "101", "110", "110", "101", "101"],
    "S": ["111", "100", "100", "111", "001", "001", "111"],
    "T": ["111", "010", "010", "010", "010", "010", "010"],
    "U": ["101", "101", "101", "101", "101", "101", "111"],
    "V": ["101", "101", "101", "101", "101", "101", "010"],
}


def set_pixel(frame: bytearray, x: int, y: int, color: tuple[int, int, int]) -> None:
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        index = (y * WIDTH + x) * 3
        frame[index : index + 3] = bytes(color)


def fill_rect(
    frame: bytearray,
    x: int,
    y: int,
    width: int,
    height: int,
    color: tuple[int, int, int],
) -> None:
    for yy in range(y, y + height):
        for xx in range(x, x + width):
            set_pixel(frame, xx, yy, color)


def text_width(text: str, scale: int) -> int:
    total = 0
    for char in text:
        pattern = FONT[char]
        total += (len(pattern[0]) + 1) * scale
    return max(0, total - scale)


def draw_text(
    frame: bytearray,
    text: str,
    x: int,
    y: int,
    scale: int,
    color: tuple[int, int, int],
) -> None:
    cursor = x
    for char in text:
        pattern = FONT[char]
        for row, bits in enumerate(pattern):
            for col, bit in enumerate(bits):
                if bit == "1":
                    fill_rect(frame, cursor + col * scale, y + row * scale, scale, scale, color)
        cursor += (len(pattern[0]) + 1) * scale


def make_frame(progress: int) -> bytes:
    frame = bytearray([12, 21, 34] * WIDTH * HEIGHT)

    fill_rect(frame, 0, 0, WIDTH, 12, (99, 102, 241))
    fill_rect(frame, 0, HEIGHT - 12, int(WIDTH * progress / 100), 12, (20, 184, 166))

    lines = [
        ("PI #2883", 18, (255, 255, 255)),
        ("500000 DIGITS", 15, (196, 181, 253)),
        ("DISCUSSION CHECK", 9, (167, 243, 208)),
        (f"SHA {SHA[:16]}", 7, (229, 231, 235)),
        (SHA[16:48], 6, (229, 231, 235)),
        (SHA[48:], 7, (229, 231, 235)),
    ]

    y = 70
    for text, scale, color in lines:
        x = (WIDTH - text_width(text, scale)) // 2
        draw_text(frame, text, x, y, scale, color)
        y += 72 if scale >= 11 else 48

    return b"P6\n%d %d\n255\n" % (WIDTH, HEIGHT) + bytes(frame)


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for index in range(60):
            progress = int((index + 1) * 100 / 60)
            (tmp_path / f"frame-{index:03d}.ppm").write_bytes(make_frame(progress))

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                "10",
                "-i",
                str(tmp_path / "frame-%03d.ppm"),
                "-pix_fmt",
                "yuv420p",
                str(OUTPUT),
            ],
            check=True,
        )

    print(OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
