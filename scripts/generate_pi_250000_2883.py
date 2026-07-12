#!/usr/bin/env python3
"""Generate and verify a 250,000-decimal PI artifact for issue #2883."""

from __future__ import annotations

import argparse
import hashlib
import math
import sys
from pathlib import Path


DIGITS = 250_000
EXTRA_GUARD_DIGITS = 20
CHUDNOVSKY_C = 640_320
CHUDNOVSKY_C3_OVER_24 = CHUDNOVSKY_C**3 // 24
KNOWN_FIRST_100 = (
    "14159265358979323846264338327950288419716939937510"
    "58209749445923078164062862089986280348253421170679"
)
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "pi" / "pi-250000-2883.md"

if hasattr(sys, "set_int_max_str_digits"):
    sys.set_int_max_str_digits(DIGITS + EXTRA_GUARD_DIGITS + 100)


def binary_split(a: int, b: int) -> tuple[int, int, int]:
    if b - a == 1:
        if a == 0:
            return 1, 1, 13_591_409

        p = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)
        q = a * a * a * CHUDNOVSKY_C3_OVER_24
        t = p * (13_591_409 + 545_140_134 * a)
        if a % 2:
            t = -t
        return p, q, t

    midpoint = (a + b) // 2
    p1, q1, t1 = binary_split(a, midpoint)
    p2, q2, t2 = binary_split(midpoint, b)
    return p1 * p2, q1 * q2, q2 * t1 + p1 * t2


def pi_digits(count: int) -> str:
    precision = count + EXTRA_GUARD_DIGITS
    terms = count // 14 + 2
    _, q, t = binary_split(0, terms)
    scale = 10**precision
    sqrt_10005 = math.isqrt(10_005 * scale * scale)
    pi_scaled = (426_880 * sqrt_10005 * q) // t
    text = str(pi_scaled)
    return text[0] + "." + text[1 : count + 1]


def grouped_digits(compact_pi: str, width: int = 100) -> str:
    fractional = compact_pi.split(".", 1)[1]
    lines = []
    for index in range(0, len(fractional), width):
        start = index + 1
        end = min(index + width, len(fractional))
        lines.append(f"{start:06d}-{end:06d}: {fractional[index:end]}")
    return "\n".join(lines)


def write_artifact(compact_pi: str) -> None:
    fractional = compact_pi.split(".", 1)[1]
    checksum = hashlib.sha256(compact_pi.encode("ascii")).hexdigest()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "\n".join(
            [
                "# PI prefix for issue #2883",
                "",
                "This artifact continues the reproducible PI discussion with the first "
                f"{DIGITS:,} decimal places of PI.",
                "",
                f"- Decimal places: {len(fractional):,}",
                f"- Compact SHA-256 (`3.<digits>`): `{checksum}`",
                f"- First 100 decimals verified: `{fractional[:100]}`",
                "- Generator: `scripts/generate_pi_250000_2883.py`",
                "",
                "```text",
                grouped_digits(compact_pi),
                "```",
                "",
            ]
        ),
        encoding="ascii",
    )


def verify(compact_pi: str) -> None:
    fractional = compact_pi.split(".", 1)[1]
    if len(fractional) != DIGITS:
        raise SystemExit(f"expected {DIGITS} digits, got {len(fractional)}")
    if fractional[:100] != KNOWN_FIRST_100:
        raise SystemExit("first 100 decimal places do not match the known PI prefix")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verify the generated artifact")
    args = parser.parse_args()

    compact_pi = pi_digits(DIGITS)
    verify(compact_pi)

    if args.check:
        if not OUTPUT.exists():
            raise SystemExit(f"missing artifact: {OUTPUT}")
        existing = OUTPUT.read_text(encoding="ascii")
        checksum = hashlib.sha256(compact_pi.encode("ascii")).hexdigest()
        if checksum not in existing:
            raise SystemExit("artifact checksum does not match generated PI")
        print(f"verified {DIGITS} decimal places; sha256={checksum}")
        return

    write_artifact(compact_pi)
    print(f"wrote {OUTPUT}")


if __name__ == "__main__":
    main()
