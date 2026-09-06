#!/usr/bin/env python3
"""
Calculate PI using the Chudnovsky algorithm to high precision.
Chudnovsky converges at ~14 digits per iteration.
"""
from decimal import Decimal, getcontext, localcontext
import sys

def calc_pi(precision=500):
    """计算 PI 到指定精度"""
    getcontext().prec = precision + 50  # 额外精度用于计算

    C = 426880 * Decimal(10005).sqrt()
    K = Decimal(6)
    M = Decimal(1)
    X = Decimal(1)
    L = Decimal(13591409)
    S = Decimal(13591409)

    for k in range(1, precision // 14 + 2):
        M = M * (K ** 3 - 16 * K) / ((k) ** 3)
        K += Decimal(12)
        L += Decimal(545140134)
        X *= Decimal(-262537412640768000)
        S += M * L / X

    pi = C / S
    return Decimal(str(pi))  # 去除额外精度

if __name__ == "__main__":
    prec = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    print(f"Calculating PI to {prec} decimal places...", file=sys.stderr)
    pi = calc_pi(prec)
    pi_str = str(pi)[:prec + 2]  # 3. + prec digits
    print(f"π = {pi_str}")
    print(f"\n(note: calculated {len(pi_str)-2} decimal places)", file=sys.stderr)
