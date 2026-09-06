#!/usr/bin/env python3
"""
Generate PI to 10,000,000 decimal places using the Chudnovsky algorithm.

Uses pure integer arithmetic with binary splitting and integer square root
to avoid any floating-point overflow.

Usage:
    python3 scripts/generate_pi_10000000_2883.py --digits 10000000 --output docs/pi/pi_10000000_digits_2883.md
    python3 scripts/generate_pi_10000000_2883.py --verify --digits 10000000
    python3 scripts/generate_pi_10000000_2883.py --verify --online-samples --digits 10000000

/claim #2883
"""

import argparse
import hashlib
import math
import sys
import time

sys.set_int_max_str_digits(50_000_000)


def isqrt(n):
    """Compute integer square root of n (largest integer x with x*x <= n)."""
    if n < 0:
        raise ValueError("Square root of negative number")
    if n == 0:
        return 0
    x = n
    y = (x + 1) // 2
    while y < x:
        x = y
        y = (x + n // x) // 2
    return x


def chudnovsky_pi(num_digits):
    """
    Compute PI to num_digits decimal places using the Chudnovsky algorithm.

    Uses binary splitting with pure integer arithmetic, then integer
    square root for the sqrt(10005) factor.
    """
    C = 640320
    C3_OVER_24 = C ** 3 // 24

    def bs(a, b):
        """Binary split: returns (P, Q, T) as Python ints."""
        if b - a == 1:
            if a == 0:
                P = Q = 1
            else:
                P = (6 * a - 5) * (2 * a - 1) * (6 * a - 1)
                Q = a * a * a * C3_OVER_24
            T = P * (13591409 + 545140134 * a)
            if a & 1:
                T = -T
            return P, Q, T
        else:
            m = (a + b) // 2
            P1, Q1, T1 = bs(a, m)
            P2, Q2, T2 = bs(m, b)
            P = P1 * P2
            Q = Q1 * Q2
            T = Q2 * T1 + P1 * T2
            return P, Q, T

    N = int(math.ceil(num_digits / math.log10(12.5))) + 1
    print(f"  Using {N} terms for {num_digits:,} digits")

    P, Q, T = bs(0, N + 1)

    # pi = (Q * 426880 * sqrt(10005)) / T
    # Compute: sqrt(10005 * 10^(2*(num_digits+50))) using integer sqrt
    extra = num_digits + 50
    sqrt_input = 10005 * (10 ** (2 * extra))
    sqrt_val = isqrt(sqrt_input)

    numerator = Q * 426880 * sqrt_val
    pi_scaled = numerator // T  # integer division, gives pi * 10^extra

    # Convert to string with decimal point
    pi_str = str(pi_scaled)
    # Insert decimal point: first digit is '3', then decimal
    integer_part = pi_str[:1]
    decimal_part = pi_str[1:1 + num_digits]

    return f"{integer_part}.{decimal_part}"


def compute_sha256(content):
    """Compute SHA-256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def format_digits(pi_str, digits):
    """Format PI digits into a markdown document."""
    integer_part = pi_str[0]
    decimal_part = pi_str[2:2 + digits]

    lines = []
    lines.append(f"# PI to {digits:,} Decimal Places")
    lines.append("")
    lines.append(f"**Issue:** #2883")
    lines.append(f"**Algorithm:** Chudnovsky formula with binary splitting (pure integer arithmetic)")
    lines.append(f"**Digits:** {digits:,} decimal places")
    lines.append(f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
    lines.append("")

    lines.append("## First 100 Digits")
    lines.append("")
    lines.append("```")
    lines.append(pi_str[:102])
    lines.append("```")
    lines.append("")

    lines.append("## Last 100 Digits")
    lines.append("")
    lines.append("```")
    lines.append(f"...{pi_str[-100:]}")
    lines.append("```")
    lines.append("")

    lines.append(f"## Full Digits ({digits:,} decimal places)")
    lines.append("")
    lines.append("```")
    lines.append(f"{integer_part}.{decimal_part[:10]}")
    for i in range(10, len(decimal_part), 10):
        chunk = decimal_part[i:i + 10]
        lines.append(chunk)
    lines.append("```")
    lines.append("")

    content = f"{integer_part}.{decimal_part}"
    sha256 = compute_sha256(content)
    lines.append("## Verification")
    lines.append("")
    lines.append(f"**SHA-256 of `3.<digits>`:** `{sha256}`")
    lines.append("")

    return "\n".join(lines), content


def verify_online_samples(pi_str, digits):
    """Verify samples against the Pi Delivery API."""
    import urllib.request
    import json

    base_url = "https://api.pi.delivery/v1/pi"
    full_pi = pi_str.replace(".", "")

    samples = [0, 100, 1000, 10000, 100000, 1000000]
    samples = [s for s in samples if s + 10 <= len(full_pi)]

    all_ok = True
    for start in samples:
        end = start + 10
        url = f"{base_url}?start={start}&numberOfDigits=10"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                api_digits = data.get("content", "")
                local_digits = full_pi[start:end]
                match = api_digits == local_digits
                status = "PASS" if match else "FAIL"
                if not match:
                    all_ok = False
                print(f"  Position {start:>10,}: {status}")
        except Exception as e:
            print(f"  Position {start:>10,}: ERROR ({e})")
            all_ok = False

    return all_ok


def main():
    parser = argparse.ArgumentParser(description="Generate PI to arbitrary precision")
    parser.add_argument("--digits", type=int, default=10000000, help="Number of decimal digits")
    parser.add_argument("--output", type=str, default=None, help="Output markdown file")
    parser.add_argument("--verify", action="store_true", help="Verify the result")
    parser.add_argument("--online-samples", action="store_true", help="Verify against Pi Delivery API")
    parser.add_argument("--verify-hash", type=str, default=None, help="Verify SHA-256 hash")
    args = parser.parse_args()

    print(f"Computing PI to {args.digits:,} decimal places using Chudnovsky algorithm...")
    start_time = time.time()

    pi = chudnovsky_pi(args.digits)
    pi_str = str(pi)

    elapsed = time.time() - start_time
    print(f"Completed in {elapsed:.2f} seconds")
    print(f"Computed {len(pi_str)} characters total")

    if args.verify:
        print("\nVerifying computed value...")
        content = f"{pi_str[0]}.{pi_str[2:2 + args.digits]}"
        sha256 = compute_sha256(content)
        print(f"SHA-256: {sha256}")

        if args.verify_hash:
            if sha256 == args.verify_hash:
                print("Hash verification: PASS")
            else:
                print(f"Hash verification: FAIL (expected {args.verify_hash})")
                sys.exit(1)

        if args.online_samples:
            print("\nVerifying against Pi Delivery API...")
            if verify_online_samples(pi_str, args.digits):
                print("\nAll samples verified: PASS")
            else:
                print("\nSome samples failed verification")
                sys.exit(1)

    if args.output:
        print(f"\nWriting to {args.output}...")
        md_content, _ = format_digits(pi_str, args.digits)
        with open(args.output, 'w') as f:
            f.write(md_content)
        print(f"Written {len(md_content):,} bytes")

    print("\nDone.")


if __name__ == "__main__":
    main()
