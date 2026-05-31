#!/usr/bin/env python3
"""PI Calculator using mpmath - extend to arbitrary precision"""
from mpmath import mp

def compute_pi(digits=310):
    mp.dps = digits
    return mp.nstr(mp.pi, digits)

if __name__ == '__main__':
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 310
    pi = compute_pi(n)
    # Remove decimal point for pure digits
    pure = pi.replace('.', '')
    print(f'PI to {n-1} decimal places ({len(pure)} digits total):')
    print(pi)
    print()
    print(f'Digits 1-100:  {pure[:100]}')
    print(f'Digits 101-200: {pure[100:200]}')
    print(f'Digits 201-300: {pure[200:300]}')
