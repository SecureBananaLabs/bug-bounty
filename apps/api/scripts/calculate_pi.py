#!/usr/bin/env python3
"""Calculate PI to N decimal places using the Chudnovsky algorithm.

Usage: python calculate_pi.py [digits]

Chudnovsky algorithm converges at ~14 digits per term:
    pi = 426880 * sqrt(10005) / K
where K = sum_{k=0}^{inf} (6k)! * (13591409 + 545140134k) / ((3k)! * (k!)^3 * 640320^(3k))

Uses Python's decimal module for arbitrary-precision arithmetic.
"""

import sys
from decimal import Decimal, localcontext


def sqrt(n, precision):
    with localcontext() as ctx:
        ctx.prec = precision + 20
        x = Decimal(n)
        half = Decimal('0.5')
        guess = x / Decimal('2')
        for _ in range(50):
            next_guess = (guess + x / guess) * half
            if abs(next_guess - guess) < Decimal(1) / Decimal(10) ** (precision + 5):
                break
            guess = next_guess
    return guess


def compute_pi_chudnovsky(digits):
    internal_prec = int(digits * 3.5) + 50
    with localcontext() as ctx:
        ctx.prec = internal_prec
        C = Decimal(426880) * sqrt(10005, internal_prec)
        M = Decimal(1)
        X = Decimal(1)
        L = Decimal(13591409)
        S = Decimal(13591409)
        k = 1
        while True:
            M *= Decimal((12 * k - 10) * (12 * k - 6) * (12 * k - 2)) / Decimal(k ** 3)
            X *= Decimal(-262537412640768000)
            L += Decimal(545140134)
            term = M * L / X
            S += term
            k += 1
            if abs(term) < Decimal(1) / Decimal(10) ** (digits + 5):
                break
        pi = C / S
    return str(pi)[:digits + 2]


def main():
    n = 1000
    if len(sys.argv) > 1:
        try:
            n = int(sys.argv[1])
            if n < 1:
                raise ValueError
        except ValueError:
            print('Usage: python calculate_pi.py [positive_integer]', file=sys.stderr)
            sys.exit(1)

    pi = compute_pi_chudnovsky(n)
    print(f"PI to {n} decimal places:")
    print(pi)


if __name__ == '__main__':
    main()
