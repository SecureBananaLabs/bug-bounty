#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
from pathlib import Path


ARTIFACT = Path("docs/pi/pi-1000000-2883.md")
OUTPUT = Path("demos/pi-1000000-2883-demo.mp4")
FONT = "C\\:/Windows/Fonts/consola.ttf"


def load_summary() -> tuple[str, str]:
    text = ARTIFACT.read_text(encoding="utf-8")
    digest_match = re.search(r"SHA-256 of compact `3\.<digits>` value: `([0-9a-f]+)`", text)
    if not digest_match:
        raise RuntimeError("could not find SHA-256 line in PI artifact")

    block = text.split("```text", 1)[1]
    first_digits = "".join(character for character in block if character.isdigit())[:40]
    return digest_match.group(1), first_digits


def drawtext(text: str, x: int, y: int, size: int, color: str = "white") -> str:
    escaped = text.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    escaped = escaped.replace(",", "\\,")
    return (
        f"drawtext=fontfile='{FONT}':text='{escaped}':"
        f"x={x}:y={y}:fontsize={size}:fontcolor={color}"
    )


def main() -> int:
    digest, first_digits = load_summary()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    filters = [
        "drawbox=x=36:y=34:w=888:h=472:color=39d399@0.55:t=4",
        "drawbox=x=58:y=64:w=844:h=106:color=16202a:t=fill",
        drawtext("Issue #2883 PI continuation", 82, 88, 38),
        drawtext("1000000 decimal places after the point", 82, 205, 30, "e6edf3"),
        drawtext(f"prefix {first_digits[:32]}...", 82, 258, 28, "b7c3d0"),
        drawtext(f"sha256 {digest[:28]}...", 82, 312, 28, "b7c3d0"),
        drawtext("Chudnovsky binary splitting verifier included", 82, 366, 27, "e6edf3"),
        drawtext("/claim #2883 ready with demo evidence", 82, 420, 28, "39d399"),
        "drawbox=x=82:y=470:w=720:h=14:color=2b3440:t=fill",
        "drawbox=x=82:y=470:w=620:h=14:color=39d399:t=fill",
    ]

    command = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=0f1118:s=960x540:d=6",
        "-vf",
        ",".join(filters),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(OUTPUT),
    ]
    subprocess.run(command, check=True)
    print(f"wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
