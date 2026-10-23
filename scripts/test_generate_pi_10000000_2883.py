#!/usr/bin/env python3
"""
Test suite for PI generator script.

Validates the Chudnovsky algorithm implementation against known PI values
and structural properties.

Usage:
    python3 scripts/test_generate_pi_10000000_2883.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from generate_pi_10000000_2883 import chudnovsky_pi, compute_sha256


def test_known_digits():
    """Test against known PI digit sequences."""
    print("Test 1: Known digit sequences")
    test_cases = [
        (10, "1415926535"),
        (20, "14159265358979323846"),
        (50, "14159265358979323846264338327950288419716939937510"),
        (100, "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"),
    ]
    passed = 0
    for digits, expected in test_cases:
        pi = chudnovsky_pi(digits)
        pi_str = str(pi)
        actual = pi_str[2:2 + digits]
        if actual == expected:
            print(f"  {digits} digits: PASS")
            passed += 1
        else:
            print(f"  {digits} digits: FAIL")
            print(f"    Expected: {expected}")
            print(f"    Got:      {actual}")
    return passed == len(test_cases)


def test_first_digits():
    """Test the first 50 digits of PI."""
    print("Test 2: First 50 digits")
    pi = chudnovsky_pi(50)
    pi_str = str(pi)
    expected_start = "3.14159265358979323846264338327950288419716939937510"
    actual_start = pi_str[:52]
    if actual_start == expected_start:
        print("  First 50 digits: PASS")
        return True
    else:
        print(f"  First 50 digits: FAIL")
        print(f"    Expected: {expected_start}")
        print(f"    Got:      {actual_start}")
        return False


def test_digit_count():
    """Test that correct number of digits is produced."""
    print("Test 3: Digit count")
    test_digits = [10, 50, 100]
    passed = 0
    for n in test_digits:
        pi = chudnovsky_pi(n)
        pi_str = str(pi)
        decimal_part = pi_str[2:]
        if len(decimal_part) >= n:
            print(f"  {n} digits: PASS (got {len(decimal_part)})")
            passed += 1
        else:
            print(f"  {n} digits: FAIL (got {len(decimal_part)}, expected >= {n})")
    return passed == len(test_digits)


def test_sha256():
    """Test SHA-256 computation."""
    print("Test 4: SHA-256 computation")
    test_input = "3.1415926535"
    actual = compute_sha256(test_input)
    if len(actual) == 64 and all(c in '0123456789abcdef' for c in actual):
        print(f"  SHA-256 format: PASS")
        return True
    else:
        print(f"  SHA-256 format: FAIL")
        return False


def test_consistency():
    """Test that multiple calls produce the same result."""
    print("Test 5: Consistency")
    pi1 = chudnovsky_pi(20)
    pi2 = chudnovsky_pi(20)
    if str(pi1) == str(pi2):
        print("  Consistency: PASS")
        return True
    else:
        print("  Consistency: FAIL")
        return False


def main():
    print("=" * 60)
    print("PI Generator Test Suite")
    print("=" * 60)
    print()

    results = []
    results.append(test_known_digits())
    print()
    results.append(test_first_digits())
    print()
    results.append(test_digit_count())
    print()
    results.append(test_sha256())
    print()
    results.append(test_consistency())

    print()
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    if all(results):
        print(f"All {total} tests PASSED")
        return 0
    else:
        print(f"{passed}/{total} tests passed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
