#!/usr/bin/env python3
"""Generate and verify a 2,000,000 decimal-place prefix of pi.

The implementation uses the Chudnovsky series with binary splitting and only
Python's standard library. It writes both a compact text artifact and a grouped
Markdown artifact so the value can be reviewed and verified without external
dependencies.
"""

from __future__ import annotations

import argparse
import hashlib
import math
import sys
from pathlib import Path

DEFAULT_DIGITS = 2_000_000
GUARD_DIGITS = 16
CHUDNOVSKY_DIGITS_PER_TERM = 14.181647462725477
CHUDNOVSKY_C3_OVER_24 = 640320**3 // 24
ISSUE_SEED = (
    "3.141592653589793238462643383279502884197169399375105820974944592307816"
    "4062862089986280348253421170679"
)

if hasattr(sys, "set_int_max_str_digits"):
    sys.set_int_max_str_digits(0)


def binary_split(start: int, stop: int) -> tuple[int, int, int]:
    if stop - start == 1:
        if start == 0:
            return 1, 1, 13591409

        p = (6 * start - 5) * (2 * start - 1) * (6 * start - 1)
        q = start * start * start * CHUDNOVSKY_C3_OVER_24
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
        t_left * q_right + p_left * t_right,
    )


def calculate_pi(digits: int) -> str:
    scale_digits = digits + GUARD_DIGITS
    terms = math.ceil(scale_digits / CHUDNOVSKY_DIGITS_PER_TERM) + 1
    _, q, t = binary_split(0, terms)

    one = 10**scale_digits
    sqrt_10005 = math.isqrt(10005 * one * one)
    scaled_pi = (426880 * sqrt_10005 * q) // t
    compact = str(scaled_pi)
    compact = f"{compact[0]}.{compact[1:digits + 1]}"

    if len(compact.split(".", 1)[1]) != digits:
        raise RuntimeError(f"expected {digits} decimals, got {len(compact.split('.', 1)[1])}")
    if not compact.startswith(ISSUE_SEED):
        raise RuntimeError("generated prefix does not match the issue's first 100 decimal places")
    return compact


def grouped_digits(compact: str) -> str:
    integer, decimals = compact.split(".", 1)
    groups = [decimals[i : i + 10] for i in range(0, len(decimals), 10)]
    lines = [" ".join(groups[i : i + 10]) for i in range(0, len(groups), 10)]
    return f"{integer}.\n" + "\n".join(lines) + "\n"


def write_artifacts(compact: str, output_dir: Path, digits: int) -> tuple[Path, Path, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    compact_path = output_dir / f"pi-{digits}.txt"
    markdown_path = output_dir / f"pi-{digits}.md"
    checksum = hashlib.sha256(compact.encode("ascii")).hexdigest()

    compact_path.write_text(compact + "\n", encoding="ascii")
    markdown_path.write_text(
        "\n".join(
            [
                f"# Pi to {digits:,} Decimal Places",
                "",
                f"This artifact extends issue #2885 with a reproducible {digits:,}-decimal-place prefix of pi.",
                "",
                "- Algorithm: Chudnovsky series with binary splitting",
                "- Runtime: Python standard library only",
                f"- Decimal places after the point: {digits:,}",
                f"- SHA-256 of compact `3.<digits>` value: `{checksum}`",
                f"- Verification command: `python scripts/generate_pi_2000000.py --digits {digits} --check`",
                "",
                "<!-- BEGIN_PI -->",
                "```text",
                grouped_digits(compact).rstrip(),
                "```",
                "<!-- END_PI -->",
                "",
            ],
        ),
        encoding="ascii",
    )
    return compact_path, markdown_path, checksum


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--digits", type=int, default=DEFAULT_DIGITS)
    parser.add_argument("--output-dir", type=Path, default=Path("docs/pi"))
    parser.add_argument("--check", action="store_true", help="regenerate and verify already-written artifacts")
    args = parser.parse_args()

    compact = calculate_pi(args.digits)
    compact_path, markdown_path, checksum = write_artifacts(compact, args.output_dir, args.digits)

    if args.check:
        written = compact_path.read_text(encoding="ascii").strip()
        if written != compact:
            raise RuntimeError(f"{compact_path} does not match regenerated value")
        if hashlib.sha256(written.encode("ascii")).hexdigest() != checksum:
            raise RuntimeError("checksum mismatch after writing compact artifact")

    print(f"Wrote {compact_path}")
    print(f"Wrote {markdown_path}")
    print(f"sha256={checksum}")


if __name__ == "__main__":
    main()
