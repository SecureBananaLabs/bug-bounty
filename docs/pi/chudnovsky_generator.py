"""
Arbitrary-Precision Chudnovsky Algorithm for PI
Computes π to arbitrary decimal digits using pure Python integer binary splitting.
"""
import sys
from decimal import Decimal, getcontext

def compute_pi(digits):
    getcontext().prec = digits + 5
    C = 426880 * Decimal(10005).sqrt()

    def bs(a, b):
        if b - a == 1:
            if a == 0:
                Pab = Qab = 1
            else:
                Pab = (6*a - 5) * (2*a - 1) * (6*a - 1)
                Qab = a * a * a * (640320**3 // 24)
            Tab = Pab * (13591409 + 545140134 * a)
            if a & 1:
                Tab = -Tab
            return Pab, Qab, Tab
        else:
            m = (a + b) // 2
            Pam, Qam, Tam = bs(a, m)
            Pmb, Qmb, Tmb = bs(m, b)
            Pab = Pam * Pmb
            Qab = Qam * Qmb
            Tab = Qmb * Tam + Pam * Tmb
            return Pab, Qab, Tab

    N = int(digits / 14.18) + 1
    P, Q, T = bs(0, N)
    pi = (Q * 426880 * Decimal(10005).sqrt()) / Decimal(T)
    return str(pi)[:digits + 2]

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    print(compute_pi(n))
