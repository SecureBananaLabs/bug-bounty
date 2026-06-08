from __future__ import annotations

import hashlib
import sys
from math import isqrt
from pathlib import Path
from time import perf_counter


sys.set_int_max_str_digits(0)

DIGITS = 3_200_000
TERMS = DIGITS // 14 + 2
C3_OVER_24 = 640320**3 // 24


def binary_split(a: int, b: int) -> tuple[int, int, int]:
    if b - a == 1:
        if a == 0:
            return 1, 1, 13591409

        p = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)
        q = a * a * a * C3_OVER_24
        t = p * (13591409 + 545140134 * a)
        if a & 1:
            t = -t
        return p, q, t

    mid = (a + b) // 2
    p1, q1, t1 = binary_split(a, mid)
    p2, q2, t2 = binary_split(mid, b)
    return p1 * p2, q1 * q2, t1 * q2 + t2 * p1


def pi_scaled(digits: int) -> int:
    p, q, t = binary_split(0, TERMS)
    scale = 10**digits
    sqrt_term = isqrt(10005 * scale * scale)
    return (426880 * sqrt_term * q) // t


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "docs" / "pi"
    out_dir.mkdir(parents=True, exist_ok=True)

    started = perf_counter()
    scaled = pi_scaled(DIGITS)
    raw = str(scaled)
    pi_text = f"{raw[0]}.{raw[1:].zfill(DIGITS)}"

    out_file = out_dir / "pi-3200000.txt"
    out_file.write_text(pi_text + "\n", encoding="ascii")

    digest = hashlib.sha256((pi_text + "\n").encode("ascii")).hexdigest()
    summary = out_dir / "pi-3200000-2883.md"
    summary.write_text(
        "\n".join(
            [
                "# PI To 3,200,000 Decimal Places",
                "",
                "This artifact extends issue #2883 with a reproducible 3,200,000-decimal-place prefix of PI.",
                "",
                f"- Digits after decimal point: `{DIGITS:,}`",
                "- Artifact: `docs/pi/pi-3200000.txt`",
                f"- SHA-256: `{digest}`",
                f"- First 100 visible characters: `{pi_text[:102]}`",
                f"- Last 100 decimal digits: `{pi_text[-100:]}`",
                "",
                "The value was generated with `scripts/generate_pi_3200000.py`, a standard-library",
                "Chudnovsky binary-splitting verifier/generator.",
                "",
            ]
        ),
        encoding="ascii",
    )

    print(f"digits={DIGITS}")
    print(f"terms={TERMS}")
    print(f"chars={len(pi_text)}")
    print(f"sha256={digest}")
    print(f"elapsed_seconds={perf_counter() - started:.2f}")


if __name__ == "__main__":
    main()
