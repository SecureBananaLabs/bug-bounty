#!/usr/bin/env python3
"""Calculate PI to N decimal places using the Chudnovsky algorithm.

Usage: python calculate_pi.py [digits]

Chudnovsky algorithm converges at ~14 digits per term:
    pi = 426880 * sqrt(10005) / K
where K = sum_{k=0}^{inf} (6k)! * (13591409 + 545140134k) / ((3k)! * (k!)^3 * 640320^{3k+1.5})

Uses Python's decimal module for arbitrary-precision arithmetic.
"""

import sys
from decimal import Decimal, localcontext


def sqrt(n, precision):
    with localcontext() as ctx:
        ctx.prec = precision + 50
        x = Decimal(n)
        half = Decimal('0.5')
        guess = x / Decimal('2')
        for _ in range(100):
            next_guess = (guess + x / guess) * half
            if abs(next_guess - guess) < Decimal(1) / Decimal(10) ** (precision + 10):
                return next_guess
            guess = next_guess
    return guess


def compute_pi_chudnovsky(digits):
    prec = digits + 50
    with localcontext() as ctx:
        ctx.prec = prec
        C = Decimal(426880) * sqrt(10005, digits)
        K = Decimal(0)
        M = Decimal(1)
        X = Decimal(1)
        L = Decimal(13591409)
        S = Decimal(13591409)
        k = 1
        while True:
            M *= Decimal((6 * k - 5) * (2 * k - 1) * (6 * k - 1)) / Decimal(k ** 3)
            X *= Decimal(-262537412640768000)
            L += Decimal(545140134)
            term = M * L / X
            S += term
            k += 1
            if abs(term) < Decimal(1) / Decimal(10) ** (digits + 10):
                break
        pi = C / S
    pi_tuple = str(pi)
    return pi_tuple[0] + pi_tuple[1:digits + 1]


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
