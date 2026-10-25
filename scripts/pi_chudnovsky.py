#!/usr/bin/env python3
"""Generate and verify decimal digits of pi with the Chudnovsky series.

The implementation uses only Python's standard library and binary splitting so
the submitted artifact can be reproduced without third-party dependencies.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, getcontext
from hashlib import sha256
from pathlib import Path


CHUDNOVSKY_C = 640320
CHUDNOVSKY_C3_OVER_24 = CHUDNOVSKY_C**3 // 24
ISSUE_2883_SEED = (
    "3."
    "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
)


def binary_split(start: int, stop: int) -> tuple[int, int, int]:
    if stop - start == 1:
        if start == 0:
            return 1, 1, 13591409

        p = (6 * start - 5) * (2 * start - 1) * (6 * start - 1)
        q = start**3 * CHUDNOVSKY_C3_OVER_24
        t = p * (13591409 + 545140134 * start)
        if start % 2:
            t = -t
        return p, q, t

    mid = (start + stop) // 2
    p_left, q_left, t_left = binary_split(start, mid)
    p_right, q_right, t_right = binary_split(mid, stop)
    return (
        p_left * p_right,
        q_left * q_right,
        q_right * t_left + p_left * t_right,
    )


def calculate_pi(digits: int) -> str:
    terms = digits // 14 + 1
    getcontext().prec = digits + 8
    _, q, t = binary_split(0, terms)
    pi_value = (Decimal(q) * 426880 * Decimal(10005).sqrt()) / Decimal(t)
    compact = format(pi_value, "f")
    integer, fractional = compact.split(".", 1)
    return f"{integer}.{fractional[:digits]}"


def grouped_digits(compact: str) -> str:
    integer, fractional = compact.split(".", 1)
    groups = [fractional[i : i + 10] for i in range(0, len(fractional), 10)]
    lines = [
        " ".join(groups[i : i + 10])
        for i in range(0, len(groups), 10)
    ]
    return integer + ".\n" + "\n".join(lines) + "\n"


def verify(compact: str, digits: int) -> None:
    if not compact.startswith(ISSUE_2883_SEED):
        raise SystemExit("PI seed mismatch against issue #2883 first 100 decimal places.")
    fractional = compact.split(".", 1)[1]
    if len(fractional) != digits:
        raise SystemExit(f"Expected {digits} decimal places, got {len(fractional)}.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--digits", type=int, required=True)
    parser.add_argument("--compact-out", type=Path)
    parser.add_argument("--grouped-out", type=Path)
    parser.add_argument("--check", type=Path)
    args = parser.parse_args()

    if args.check:
        compact = "".join(args.check.read_text().split())
    else:
        compact = calculate_pi(args.digits)

    verify(compact, args.digits)
    digest = sha256(compact.encode()).hexdigest()

    if args.compact_out:
        args.compact_out.parent.mkdir(parents=True, exist_ok=True)
        args.compact_out.write_text(compact + "\n")
    if args.grouped_out:
        args.grouped_out.parent.mkdir(parents=True, exist_ok=True)
        args.grouped_out.write_text(grouped_digits(compact))

    print(f"digits={args.digits}")
    print(f"sha256={digest}")


if __name__ == "__main__":
    main()
