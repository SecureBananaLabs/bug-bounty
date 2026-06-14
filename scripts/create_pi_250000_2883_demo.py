#!/usr/bin/env python3
"""Create a tiny dependency-free GIF demo for the PI #2883 artifact."""

from __future__ import annotations

import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "demos" / "pi-250000-2883-demo.gif"
WIDTH = 640
HEIGHT = 360
FRAMES = [
    "PI issue #2883",
    "250,000 decimals",
    "Chudnovsky verifier",
    "SHA-256 evidence",
]


FONT = {
    " ": ["000", "000", "000", "000", "000"],
    "#": ["101", "111", "101", "111", "101"],
    ",": ["000", "000", "000", "010", "100"],
    "-": ["000", "000", "111", "000", "000"],
    ".": ["000", "000", "000", "000", "010"],
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    "A": ["010", "101", "111", "101", "101"],
    "C": ["111", "100", "100", "100", "111"],
    "D": ["110", "101", "101", "101", "110"],
    "E": ["111", "100", "110", "100", "111"],
    "F": ["111", "100", "110", "100", "100"],
    "G": ["111", "100", "101", "101", "111"],
    "H": ["101", "101", "111", "101", "101"],
    "I": ["111", "010", "010", "010", "111"],
    "K": ["101", "101", "110", "101", "101"],
    "N": ["101", "111", "111", "111", "101"],
    "O": ["111", "101", "101", "101", "111"],
    "P": ["111", "101", "111", "100", "100"],
    "R": ["111", "101", "111", "110", "101"],
    "S": ["111", "100", "111", "001", "111"],
    "T": ["111", "010", "010", "010", "010"],
    "V": ["101", "101", "101", "101", "010"],
    "Y": ["101", "101", "010", "010", "010"],
}


def draw_text(pixels: bytearray, text: str, x: int, y: int, scale: int) -> None:
    cursor = x
    for raw in text.upper():
        glyph = FONT.get(raw, FONT[" "])
        for row, bits in enumerate(glyph):
            for col, bit in enumerate(bits):
                if bit == "1":
                    fill_rect(pixels, cursor + col * scale, y + row * scale, scale, scale, 1)
        cursor += 4 * scale


def fill_rect(pixels: bytearray, x: int, y: int, width: int, height: int, color: int) -> None:
    for yy in range(max(0, y), min(HEIGHT, y + height)):
        start = yy * WIDTH + max(0, x)
        end = yy * WIDTH + min(WIDTH, x + width)
        pixels[start:end] = bytes([color]) * (end - start)


def lzw_encode(indices: bytes, min_code_size: int = 2) -> bytes:
    clear = 1 << min_code_size
    end = clear + 1
    next_code = end + 1
    code_size = min_code_size + 1
    dictionary = {bytes([i]): i for i in range(clear)}
    output_bits: list[int] = []

    def emit(code: int) -> None:
        for bit in range(code_size):
            output_bits.append((code >> bit) & 1)

    emit(clear)
    phrase = bytes([indices[0]])
    for value in indices[1:]:
        candidate = phrase + bytes([value])
        if candidate in dictionary:
            phrase = candidate
            continue
        emit(dictionary[phrase])
        if next_code < 4096:
            dictionary[candidate] = next_code
            next_code += 1
            if next_code == (1 << code_size) and code_size < 12:
                code_size += 1
        phrase = bytes([value])

    emit(dictionary[phrase])
    emit(end)

    data = bytearray()
    current = 0
    used = 0
    for bit in output_bits:
        current |= bit << used
        used += 1
        if used == 8:
            data.append(current)
            current = 0
            used = 0
    if used:
        data.append(current)
    return bytes(data)


def subblocks(data: bytes) -> bytes:
    chunks = bytearray()
    for index in range(0, len(data), 255):
        chunk = data[index : index + 255]
        chunks.append(len(chunk))
        chunks.extend(chunk)
    chunks.append(0)
    return bytes(chunks)


def frame_pixels(label: str, frame_index: int) -> bytes:
    pixels = bytearray([0]) * (WIDTH * HEIGHT)
    fill_rect(pixels, 36, 34, WIDTH - 72, HEIGHT - 68, 1)
    fill_rect(pixels, 44, 42, WIDTH - 88, HEIGHT - 84, 0)
    draw_text(pixels, label, 78, 128, 8)
    draw_text(pixels, f"frame {frame_index + 1}/4", 212, 232, 5)
    return bytes(pixels)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    gif = bytearray()
    gif.extend(b"GIF89a")
    gif.extend(struct.pack("<HH", WIDTH, HEIGHT))
    gif.extend(bytes([0b10000001, 0, 0]))
    gif.extend(bytes([12, 18, 28, 77, 222, 128, 255, 255, 255, 0, 0, 0]))
    gif.extend(b"!\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00")

    for index, label in enumerate(FRAMES):
        gif.extend(b"!\xf9\x04\x04")
        gif.extend(struct.pack("<H", 90))
        gif.extend(b"\x00\x00")
        gif.extend(b",")
        gif.extend(struct.pack("<HHHH", 0, 0, WIDTH, HEIGHT))
        gif.extend(b"\x00")
        compressed = lzw_encode(frame_pixels(label, index))
        gif.extend(b"\x02")
        gif.extend(subblocks(compressed))

    gif.extend(b";")
    OUTPUT.write_bytes(gif)
    print(f"wrote {OUTPUT} ({len(gif)} bytes)")


if __name__ == "__main__":
    main()
