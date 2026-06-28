#!/usr/bin/env python3
"""
Reproducible PI generator using the Chudnovsky algorithm with binary splitting.
Usage: python3 scripts/generate_pi.py [digits]
Default: 50000 digits
"""
import sys, os
from decimal import Decimal, getcontext

def chudnovsky(n):
    getcontext().prec = n + 15
    sys.setrecursionlimit(1000000)

    def bs(a, b):
        if b - a == 1:
            Pab = 1 if a == 0 else -(6*a-5)*(2*a-1)*(6*a-1)
            Qab = 1 if a == 0 else 10939058860032000 * a**3
            Tab = Pab * (13591409 + 545140134 * a)
            return Pab, Qab, Tab
        m = (a + b) // 2
        Pam, Qam, Tam = bs(a, m)
        Pmb, Qmb, Tmb = bs(m, b)
        return Pam * Pmb, Qam * Qmb, Qmb * Tam + Pam * Tmb

    terms = n // 14 + 2
    P, Q, T = bs(0, terms)
    return str((Decimal(426880) * Decimal(10005).sqrt() * Q) / T)[:n+2]

if __name__ == "__main__":
    digits = int(sys.argv[1]) if len(sys.argv) > 1 else 50000
    print(f"Computing PI to {digits:,} digits...", file=sys.stderr)
    pi = chudnovsky(digits)
    print(f"3.\n", end="")
    d = pi[2:]
    for i in range(0, len(d), 100):
        line = d[i:i+100]
        print(" ".join(line[j:j+10] for j in range(0, len(line), 10)))
    print(f"\n# {digits:,} decimal digits", file=sys.stderr)
