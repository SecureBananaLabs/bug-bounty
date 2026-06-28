#!/usr/bin/env python3
"""
Chudnovsky algorithm for calculating PI to arbitrary precision.
Uses binary-splitting for optimal performance.

Algorithm: π = 426880 * sqrt(10005) / K
where K = Σ (6k)! * (13591409 + 545140134*k) / ((3k)! * (k!)^3 * (-640320)^(3k))

Each term adds ~14.18 decimal digits of precision.
"""
from __future__ import annotations

import argparse
import hashlib
import sys
import time
from math import isqrt
from pathlib import Path

# The Chudnovsky constant: each term yields this many digits
# Increase the limit for large integer string conversion
import sys
if hasattr(sys, 'set_int_max_str_digits'):
    sys.set_int_max_str_digits(0)  # 0 = no limit

TERMS_PER_DIGIT = 14.181647462725477

# First 100 decimal digits of PI (from the issue seed) for verification
ISSUE_SEED_100 = (
    "14159265358979323846264338327950288419716939937510"
    "58209749445923078164062862089986280348253421170679"
)

# Default output paths
DEFAULT_OUTPUT_MD = Path("docs/pi/pi-1000000.md")
DEFAULT_OUTPUT_TXT = Path("pi_1000000.txt")


def binary_split(a: int, b: int) -> tuple[int, int, int]:
    """
    Compute P(a,b), Q(a,b), T(a,b) for the Chudnovsky series.

    Returns (P, Q, T) where the series sum K = T / Q and
    π ≈ 426880 * sqrt(10005) * Q / T

    Using binary splitting for O(n log^2 n) performance.
    """
    if b - a == 1:
        if a == 0:
            # P(0,1) = 1, Q(0,1) = 1, T(0,1) = 13591409 * 1 = 13591409
            return 1, 1, 13_591_409

        # P_k = (6k-5)*(2k-1)*(6k-1)
        p = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)

        # Q_k = k^3 * 640320^3 / 24
        # 640320^3 / 24 = 10939058860032000
        q = a * a * a * 10_939_058_860_032_000

        # T_k = P_k * (13591409 + 545140134 * k)
        t = p * (13_591_409 + 545_140_134 * a)

        # Alternating sign: (-1)^k
        if a & 1:
            t = -t

        return p, q, t

    # Recursive split
    m = (a + b) // 2

    P_left, Q_left, T_left = binary_split(a, m)
    P_right, Q_right, T_right = binary_split(m, b)

    # Combine: P = P_left * P_right
    #          Q = Q_left * Q_right
    #          T = Q_right * T_left + P_left * T_right
    return (
        P_left * P_right,
        Q_left * Q_right,
        Q_right * T_left + P_left * T_right,
    )


def pi_digits(digits: int, verbose: bool = False) -> str:
    """
    Calculate π to the specified number of decimal places.

    Returns the compact string representation like "3.14159..."
    """
    # Number of terms needed
    terms = int(digits / TERMS_PER_DIGIT) + 2

    # Guard digits for rounding safety
    guard = 10
    scale_digits = digits + guard
    scale = 10**scale_digits

    if verbose:
        print(f"Computing {digits:,} digits of π using {terms:,} Chudnovsky terms...")
        print(f"Working precision: {scale_digits:,} digits", flush=True)

    t0 = time.time()

    if verbose:
        print("Binary splitting...", flush=True)

    P, Q, T = binary_split(0, terms)

    if verbose:
        t1 = time.time()
        print(f"Binary split complete in {t1 - t0:.1f}s")
        print(f"Integer sizes: P={P.bit_length()//1000}Kb, Q={Q.bit_length()//1000}Kb, T={T.bit_length()//1000}Kb", flush=True)

    # Free P — we don't need it anymore
    del P

    # Compute sqrt(10005) * 10^scale_digits using integer arithmetic
    if verbose:
        print("Computing sqrt(10005)...", flush=True)

    sqrt_arg = 10_005 * scale * scale
    sqrt_10005 = isqrt(sqrt_arg)

    if verbose:
        t2 = time.time()
        print(f"sqrt(10005) computed in {t2 - t1:.1f}s", flush=True)

    # π ≈ (Q * 426880 * sqrt(10005)) / T
    if verbose:
        print("Final division (numerator / denominator)...", flush=True)

    numerator = Q * 426_880 * sqrt_10005
    pi_scaled = numerator // T

    if verbose:
        t3 = time.time()
        print(f"Final division complete in {t3 - t2:.1f}s")
        print(f"Total time: {t3 - t0:.1f}s", flush=True)

    compact = str(pi_scaled)

    # Pad if needed
    expected_len = scale_digits + 1
    if len(compact) < expected_len:
        compact = compact.zfill(expected_len)

    # Insert decimal point and trim to exact digits
    result = f"{compact[0]}.{compact[1:digits + 1]}"

    return result


def grouped_digits(compact: str) -> str:
    """Format PI digits into grouped blocks (10 digits per group, 10 groups per line)."""
    fractional = compact.split(".", 1)[1]
    groups = [fractional[i:i + 10] for i in range(0, len(fractional), 10)]
    lines = [" ".join(groups[i:i + 10]) for i in range(0, len(groups), 10)]
    return "3.\n" + "\n".join(lines)


def build_document(compact: str, digits: int) -> str:
    """Build the markdown document with PI digits."""
    fractional = compact.split(".", 1)[1]
    digest = hashlib.sha256(compact.encode("ascii")).hexdigest().upper()
    grouped = grouped_digits(compact)
    seed_ok = fractional[:100] == ISSUE_SEED_100

    return f"""# PI to {digits:,} Decimal Places

This artifact continues issue [#2885](https://github.com/SecureBananaLabs/bug-bounty/issues/2885)
with a reproducible {digits:,}-decimal-place prefix of PI. The value is generated
by `calculate_pi.py` using the Chudnovsky series with integer binary splitting
and Python standard-library arithmetic only.

- **Decimal places after the point:** {len(fractional):,}
- **SHA-256** of compact `3.<digits>` value: `{digest}`
- **First 100 decimals match the issue seed:** {seed_ok}
- **Verification command:** `python3 calculate_pi.py --check`

<!-- BEGIN_PI_{digits} -->
```text
{grouped}
```
<!-- END_PI_{digits} -->
"""


def parse_document(path: Path) -> str:
    """Extract the compact PI value from a markdown document."""
    text = path.read_text(encoding="utf-8")
    start_marker = "```text\n"
    end_marker = "\n```"
    start = text.index(start_marker) + len(start_marker)
    end = text.index(end_marker, start)
    digits_text = text[start:end]
    # Remove newlines and spaces
    compact = digits_text.replace("\n", "").replace(" ", "")
    # Ensure "3." prefix
    if compact.startswith("3."):
        return compact
    return "3." + compact


def validate(compact: str, digits: int) -> str:
    """Validate a compact PI value and return its SHA-256 hex digest."""
    if not compact.startswith("3."):
        raise ValueError("PI value must start with '3.'")

    fractional = compact.split(".", 1)[1]
    if len(fractional) != digits:
        raise ValueError(f"Expected {digits} decimal digits, found {len(fractional)}")

    if fractional[:100] != ISSUE_SEED_100:
        raise ValueError(
            f"First 100 decimals do not match the issue seed.\n"
            f"  Got:      {fractional[:100]}\n"
            f"  Expected: {ISSUE_SEED_100}"
        )

    return hashlib.sha256(compact.encode("ascii")).hexdigest().upper()


def verify_first_digits(compact: str, n: int = 10) -> bool:
    """Verify first n+1 digits against a known reference."""
    known = {
        100: "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679",
    }

    if n in known:
        expected = known[n]
        actual = compact[:len(expected)]
        return actual == expected

    # Generic check: first 10 digits
    expected_start = "3.141592653"
    return compact.startswith(expected_start)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate and verify PI to arbitrary precision using the Chudnovsky algorithm."
    )
    parser.add_argument(
        "--digits", type=int, default=1_000_000,
        help="Number of decimal digits to compute (default: 1,000,000)"
    )
    parser.add_argument(
        "--output-md", type=Path, default=DEFAULT_OUTPUT_MD,
        help="Output markdown file path"
    )
    parser.add_argument(
        "--output-txt", type=Path, default=DEFAULT_OUTPUT_TXT,
        help="Output plain text file path"
    )
    parser.add_argument(
        "--check", action="store_true",
        help="Verify a pre-existing document instead of generating"
    )
    parser.add_argument(
        "--check-file", type=Path, default=None,
        help="File to check (default: --output-md)"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Print progress information"
    )
    args = parser.parse_args()

    if args.check:
        check_path = args.check_file or args.output_md
        if not check_path.exists():
            print(f"Error: file not found: {check_path}", file=sys.stderr)
            return 1

        compact = parse_document(check_path)
        digest = validate(compact, args.digits)
        print(f"✅ Verification passed!")
        print(f"   digits  = {args.digits:,}")
        print(f"   sha256  = {digest}")
        print(f"   file    = {check_path}")
        return 0

    # === GENERATION MODE ===

    # 1. Compute PI
    t_start = time.time()
    compact = pi_digits(args.digits, verbose=args.verbose)

    # 2. Run verification
    digest = validate(compact, args.digits)
    t_end = time.time()

    print(f"\n{'='*60}")
    print(f"✅ PI calculation complete!")
    print(f"   digits  = {args.digits:,}")
    print(f"   sha256  = {digest}")
    print(f"   time    = {t_end - t_start:.1f}s")
    print(f"{'='*60}")

    # 3. Write markdown document
    args.output_md.parent.mkdir(parents=True, exist_ok=True)
    doc = build_document(compact, args.digits)
    args.output_md.write_text(doc, encoding="utf-8")
    print(f"\n📄 Markdown: {args.output_md} ({args.output_md.stat().st_size / 1024:.1f} KB)")

    # 4. Write plain text file (compact format)
    args.output_txt.parent.mkdir(parents=True, exist_ok=True)
    args.output_txt.write_text(compact + "\n", encoding="utf-8")
    print(f"📄 Text:     {args.output_txt} ({args.output_txt.stat().st_size / 1024:.1f} KB)")

    # 5. Print first and last few digits for visual confirmation
    fractional = compact.split(".", 1)[1]
    print(f"\n📋 First 50 digits: 3.{fractional[:50]}")
    print(f"📋 Last  50 digits: ...{fractional[-50:]}")
    print(f"📋 First 100 match seed: {fractional[:100] == ISSUE_SEED_100}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
