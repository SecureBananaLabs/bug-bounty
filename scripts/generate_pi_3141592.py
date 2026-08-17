#!/usr/bin/env python3
"""Generate and verify a 3,141,592-decimal-place PI artifact.

The implementation uses Chudnovsky binary splitting with Python standard-library
big integers. It writes a compact Markdown artifact grouped into reviewable
100-digit rows and verifies the generated value by SHA-256.
"""

from __future__ import annotations

import argparse
import hashlib
import math
import sys
from pathlib import Path

DIGITS = 3_141_592
TERMS = DIGITS // 14 + 2
C3_OVER_24 = 640320**3 // 24
EXPECTED_PREFIX = (
    "314159265358979323846264338327950288419716939937510582097494459230"
    "78164062862089986280348253421170679"
)
EXPECTED_SHA256 = "f49ead24831299d2505e8404f5f694371b498aa187304368d757d4c7287d3b49"
OUTPUT_PATH = Path("docs/pi/pi_3141592_digits.md")


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
    # Python 3.11+ limits int-to-str conversion by default.
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
    rows = [" ".join(fractional[i : i + 100][j : j + 10] for j in range(0, 100, 10)) for i in range(0, len(fractional), 100)]
    return compact[0] + ".\n" + "\n".join(rows)


def write_artifact(path: Path, compact: str, digest: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "# PI to 3,141,592 Decimal Places",
                "",
                "This artifact extends issue #2885 with a reproducible PI prefix whose",
                "decimal-place count is itself inspired by PI. The value below is generated",
                "by `scripts/generate_pi_3141592.py` using the Chudnovsky series with",
                "binary splitting and Python standard-library big integers.",
                "",
                f"- Decimal places after the point: {DIGITS}",
                f"- Chudnovsky terms: {TERMS}",
                f"- SHA-256 of compact `3.<digits>` value: `{digest}`",
                "- Verification command: `python scripts/generate_pi_3141592.py --verify`",
                "",
                "<!-- BEGIN_PI_3141592 -->",
                "```text",
                grouped_decimal(compact),
                "```",
                "<!-- END_PI_3141592 -->",
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
