"""
Pi Calculator — Chudnovsky Algorithm
Calculates Pi to arbitrary precision
"""
from decimal import Decimal, getcontext
import math

def calc_pi(precision):
    """Calculate PI to N decimal places using Chudnovsky algorithm"""
    getcontext().prec = precision + 100
    
    C = Decimal(426880) * Decimal(math.sqrt(10005))
    K = Decimal(6)
    M = Decimal(1)
    X = Decimal(1)
    L = Decimal(13591409)
    S = Decimal(13591409)
    
    for i in range(1, precision // 14 + 2):
        M = M * (K**3 - 16*K) / (i**3)
        K += 12
        L += 545140134
        X *= -262537412640768000
        S += M * L / X
    
    return C / S

if __name__ == "__main__":
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    pi = calc_pi(n)
    print(f"Pi to {n} decimal places:")
    print(str(pi)[:n+2])
