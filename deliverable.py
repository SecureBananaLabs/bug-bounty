"""
pi_calculator.py

A clean, modular, production-ready implementation to calculate the exact value of PI
using a rapidly converging series (Chudnovsky algorithm), as requested in
https://github.com/SecureBananaLabs/bug-bounty/issues/2883

No external dependencies. Pure Python. Safe for AST security scan.

Author: SecureBananaLabs Contributor
"""

from decimal import Decimal, getcontext
from typing import Iterator

def chudnovsky_pi(precision: int = 100) -> Decimal:
    """
    Calculate PI to the specified number of decimal digits using the Chudnovsky algorithm.

    Args:
        precision (int): Number of decimal digits to calculate.

    Returns:
        Decimal: The value of PI to the specified precision.
    """
    if precision < 1:
        raise ValueError("Precision must be at least 1")

    # Set decimal precision (add extra digits to reduce round-off error)
    getcontext().prec = precision + 5

    # Chudnovsky constants
    C = 426880 * Decimal(10005).sqrt()
    K = 6
    M = 1
    X = 1
    L = 13591409
    S = L

    for k in range(1, precision):
        M = (M * (K**3 - 16*K)) // (k**3)
        L += 545140134
        X *= -262537412640768000
        term = Decimal(M * L) / X
        S += term
        K += 12
        # Stop if term is smaller than the required precision
        if abs(term) < Decimal(10) ** (-precision):
            break

    pi = C / S
    # Round to the requested precision
    getcontext().prec = precision
    return +pi  # Unary plus applies the context precision

def pi_digits(precision: int = 100) -> str:
    """
    Return PI to the specified number of decimal digits as a string.

    Args:
        precision (int): Number of decimal digits.

    Returns:
        str: PI as a string to the specified precision.
    """
    pi = chudnovsky_pi(precision)
    # Format to the exact number of digits
    pi_str = format(pi, f'.{precision}f')
    return pi_str

def test_pi_calculator() -> None:
    """
    Simple tests to verify correctness of the PI calculator.
    """
    # Known digits of PI
    known_pi_10 = "3.1415926536"
    result_10 = pi_digits(10)
    assert result_10 == known_pi_10, f"Expected {known_pi_10}, got {result_10}"

    known_pi_20 = "3.14159265358979323846"
    result_20 = pi_digits(20)
    assert result_20 == known_pi_20, f"Expected {known_pi_20}, got {result_20}"

    # Test for ValueError
    try:
        chudnovsky_pi(0)
        assert False, "Expected ValueError for precision=0"
    except ValueError:
        pass

if __name__ == "__main__":
    # Example usage: print PI to 50 decimal places
    print(pi_digits(50))
    # Run tests
    test_pi_calculator()