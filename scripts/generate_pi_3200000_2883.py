#!/usr/bin/env python3
"""Generate and verify a 3,200,000-decimal-place PI artifact for issue #2883."""

from __future__ import annotations

import argparse
import hashlib
import sys
from math import isqrt
from pathlib import Path
from typing import Tuple


if hasattr(sys, "set_int_max_str_digits"):
    sys.set_int_max_str_digits(0)

DECIMAL_PLACES = 3_200_000
GUARD_DIGITS = 20
OUTPUT = Path("docs/pi/pi-3200000-2883.txt")
FIRST_100 = (
    "14159265358979323846264338327950288419716939937510"
    "58209749445923078164062862089986280348253421170679"
)


def binary_split(a: int, b: int) -> Tuple[int, int, int]:
    """Return P, Q, T for the Chudnovsky binary-splitting interval [a, b)."""

    c3_over_24 = 640320**3 // 24
    if b - a == 1:
        if a == 0:
            return 1, 1, 13591409

        p = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)
        q = a * a * a * c3_over_24
        t = p * (13591409 + 545140134 * a)
        if a % 2:
            t = -t
        return p, q, t

    midpoint = (a + b) // 2
    p1, q1, t1 = binary_split(a, midpoint)
    p2, q2, t2 = binary_split(midpoint, b)
    return p1 * p2, q1 * q2, t1 * q2 + p1 * t2


def compute_pi(decimal_places: int = DECIMAL_PLACES) -> str:
    """Return PI as a compact 3.<digits> string with decimal_places digits."""

    terms = decimal_places // 14 + 3
    scale = decimal_places + GUARD_DIGITS
    p, q, t = binary_split(0, terms)
    del p

    one = 10**scale
    sqrt_10005 = isqrt(10005 * one * one)
    pi_scaled = (q * 426880 * sqrt_10005) // t
    digits = str(pi_scaled)
    if len(digits) <= scale:
        digits = digits.zfill(scale + 1)
    compact = f"{digits[0]}.{digits[1:1 + decimal_places]}"
    return compact


def grouped_value(compact: str) -> str:
    integer, decimals = compact.split(".", 1)
    lines = [f"{integer}."]
    for offset in range(0, len(decimals), 100):
        chunk = decimals[offset : offset + 100]
        lines.append(" ".join(chunk[i : i + 10] for i in range(0, len(chunk), 10)))
    return "\n".join(lines)


def render_artifact(compact: str) -> str:
    digest = hashlib.sha256(compact.encode("ascii")).hexdigest()
    return (
        "# PI to 3,200,000 Decimal Places\n\n"
        "Reproducible continuation artifact for SecureBananaLabs/bug-bounty issue #2883.\n\n"
        f"- Decimal places after the point: {DECIMAL_PLACES}\n"
        f"- SHA-256 of compact `3.<digits>` value: `{digest}`\n"
        "- Generator/verifier: `python scripts/generate_pi_3200000_2883.py --check`\n"
        "- Method: Chudnovsky series with integer binary splitting and Python standard library only.\n\n"
        "```text\n"
        f"{grouped_value(compact)}\n"
        "```\n"
    )


def extract_compact(text: str) -> str:
    try:
        block = text.split("```text", 1)[1].split("```", 1)[0]
    except IndexError as exc:
        raise ValueError("artifact text block is missing") from exc

    compact = "".join(
        line.strip().replace(" ", "")
        for line in block.splitlines()
        if line.strip()
    )
    if not compact.startswith("3."):
        raise ValueError("artifact must start with 3.")
    decimals = compact.split(".", 1)[1]
    if len(decimals) != DECIMAL_PLACES:
        raise ValueError(f"artifact must contain {DECIMAL_PLACES} decimal places")
    return compact


def check_artifact() -> str:
    expected = compute_pi()
    actual = extract_compact(OUTPUT.read_text(encoding="utf-8"))
    if actual != expected:
        raise SystemExit("artifact does not match generated Chudnovsky value")
    decimals = actual.split(".", 1)[1]
    if decimals[:100] != FIRST_100:
        raise SystemExit("first 100 decimals do not match the discussion seed")
    return hashlib.sha256(actual.encode("ascii")).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="write the artifact")
    parser.add_argument("--check", action="store_true", help="verify the artifact")
    args = parser.parse_args()

    if args.write:
        compact = compute_pi()
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(render_artifact(compact), encoding="utf-8", newline="\n")
        digest = hashlib.sha256(compact.encode("ascii")).hexdigest()
        print(f"wrote {OUTPUT}: {DECIMAL_PLACES} decimals, sha256={digest}")
        return 0

    if args.check:
        digest = check_artifact()
        print(f"verified {OUTPUT}: {DECIMAL_PLACES} decimals, sha256={digest}")
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
