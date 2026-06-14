#!/usr/bin/env python3
"""Generate and verify a 4,000,000-decimal-place PI artifact for #2883."""

from __future__ import annotations

import argparse
import hashlib
import math
import sys
from pathlib import Path

DIGITS = 4_000_000
TERMS = DIGITS // 14 + 2
C3_OVER_24 = 640320**3 // 24
EXPECTED_PREFIX = (
    "314159265358979323846264338327950288419716939937510582097494459230"
    "78164062862089986280348253421170679"
)
EXPECTED_SHA256 = "06d2b72a890a0b0757d15215bdee209f3769cfe5ccdaa16bf56337f85e02d9ce"
OUTPUT_PATH = Path("docs/pi/pi_4000000_digits_2883.md")


def binary_split(a: int, b: int) -> tuple[int, int, int]:
    if b - a == 1:
        if a == 0:
            return 1, 1, 13591409
        p = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)
        q = a * a * a * C3_OVER_24
        t = p * (13591409 + 545140134 * a)
        if a % 2:
            t = -t
        return p, q, t

    midpoint = (a + b) // 2
    p1, q1, t1 = binary_split(a, midpoint)
    p2, q2, t2 = binary_split(midpoint, b)
    return p1 * p2, q1 * q2, q2 * t1 + p1 * t2


def generate_pi_compact() -> str:
    if hasattr(sys, "set_int_max_str_digits"):
        sys.set_int_max_str_digits(0)

    p, q, t = binary_split(0, TERMS)
    one = 10**DIGITS
    sqrt_term = math.isqrt(10005 * one * one)
    pi_integer = (q * 426880 * sqrt_term) // t
    compact = str(pi_integer)
    if len(compact) != DIGITS + 1:
        raise RuntimeError(f"unexpected PI digit count: {len(compact) - 1}")
    if not compact.startswith(EXPECTED_PREFIX):
        raise RuntimeError("generated PI prefix does not match the known seed")
    return compact


def grouped_decimal(compact: str) -> str:
    fractional = compact[1:]
    rows = [
        " ".join(
            fractional[i : i + 100][j : j + 10]
            for j in range(0, min(100, len(fractional) - i), 10)
        )
        for i in range(0, len(fractional), 100)
    ]
    return compact[0] + ".\n" + "\n".join(rows)


def write_artifact(path: Path, compact: str, digest: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "# PI to 4,000,000 Decimal Places",
                "",
                "This artifact extends issue #2883 and discussion #2872 with a",
                "reproducible 4,000,000-decimal-place PI prefix. It intentionally",
                "exceeds the visible 3,200,000-decimal submissions for this issue.",
                "",
                f"- Decimal places after the point: {DIGITS}",
                f"- Chudnovsky terms: {TERMS}",
                f"- SHA-256 of compact `3.<digits>` value: `{digest}`",
                "- Verification command: `python scripts/generate_pi_4000000.py --verify`",
                "",
                "<!-- BEGIN_PI_4000000 -->",
                "```text",
                grouped_decimal(compact),
                "```",
                "<!-- END_PI_4000000 -->",
                "",
            ]
        ),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="write the Markdown artifact")
    parser.add_argument("--verify", action="store_true", help="verify the generated SHA-256")
    args = parser.parse_args()

    compact = generate_pi_compact()
    digest = hashlib.sha256(compact.encode("ascii")).hexdigest()
    print(f"digits={len(compact) - 1}")
    print(f"sha256={digest}")

    if args.verify and EXPECTED_SHA256 and digest != EXPECTED_SHA256:
        raise SystemExit(f"SHA-256 mismatch: expected {EXPECTED_SHA256}, got {digest}")

    if args.write:
        write_artifact(OUTPUT_PATH, compact, digest)
        print(f"wrote={OUTPUT_PATH}")


if __name__ == "__main__":
    main()
