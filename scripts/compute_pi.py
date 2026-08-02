#!/usr/bin/env python3
"""
Compute Pi to N decimal places using the Chudnovsky algorithm.
Usage: python3 compute_pi.py <digits>
"""

import sys
from decimal import Decimal, getcontext


def compute_pi(digits: int) -> str:
    """Return Pi as a string with the given number of decimal places."""
    getcontext().prec = digits + 10  # guard digits
    C = 426880 * Decimal(10005).sqrt()
    M = Decimal(1)
    L = Decimal(13591409)
    X = Decimal(1)
    K = Decimal(6)
    S = L
    for i in range(1, digits):
        M = (K**3 - 16 * K) * M / (i**3)
        L += 545140134
        X *= -262537412640768000
        S += M * L / X
        K += 12
    pi = C / S
    return str(pi)[: digits + 2]  # include "3."


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    print(compute_pi(n))