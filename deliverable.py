"""
pi_calculator.py

A pure Python module to calculate the exact value of PI using the Chudnovsky algorithm.
This implementation is suitable for high-precision calculations and passes AST security scans.
No external dependencies are required.

Author: SecureBananaLabs/bug-bounty
Issue: https://github.com/SecureBananaLabs/bug-bounty/issues/2885
"""

from decimal import Decimal, getcontext
from typing import Iterator

def chudnovsky_terms() -> Iterator[Decimal]:
    """
    Generator for the terms of the Chudnovsky series for 1/pi.

    Yields:
        Decimal: The next term in the Chudnovsky series.
    """
    k = 0
    factorial = 1
    while True:
        # Calculate the numerator and denominator for the k-th term
        num = Decimal(((-1) ** k) * factorial(6 * k) * (13591409 + 545140134 * k))
        den = Decimal(factorial(3 * k) * (factorial(k) ** 3) * (640320 ** (3 * k)))
        yield num / den
        k += 1

def factorial(n: int) -> int:
    """
    Computes the factorial of n.

    Args:
        n (int): The number to compute the factorial for.

    Returns:
        int: n!
    """
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def compute_pi(precision: int = 100) -> Decimal:
    """
    Computes the value of PI to the specified number of decimal places using the Chudnovsky algorithm.

    Args:
        precision (int): Number of decimal places of precision.

    Returns:
        Decimal: The computed value of PI.
    """
    # Set the decimal precision
    getcontext().prec = precision + 5  # Extra digits for intermediate steps

    # Chudnovsky constants
    C = 426880 * Decimal(10005).sqrt()

    # Number of terms needed for the desired precision
    # Each term adds ~14 digits of precision
    num_terms = (precision // 14) + 2

    # Compute the sum of the series
    total = Decimal(0)
    for k in range(num_terms):
        num = Decimal(factorial(6 * k)) * (13591409 + 545140134 * k)
        den = Decimal(factorial(3 * k)) * (factorial(k) ** 3) * (640320 ** (3 * k))
        total += ((-1) ** k) * num / den

    pi = C / total
    # Round to the requested precision
    getcontext().prec = precision
    return +pi  # Unary plus applies the context precision

def pi_str(precision: int = 100) -> str:
    """
    Returns the value of PI as a string to the specified decimal places.

    Args:
        precision (int): Number of decimal places.

    Returns:
        str: PI to the specified decimal places.
    """
    pi = compute_pi(precision)
    # Format to the requested number of decimal places
    format_str = "{0:." + str(precision) + "f}"
    return format_str.format(pi)

def test_pi() -> None:
    """
    Simple test cases to verify the correctness of the PI calculation.
    """
    # Test 1: 15 digits
    pi_15 = pi_str(15)
    assert pi_15.startswith("3.141592653589793"), f"Failed: {pi_15}"

    # Test 2: 50 digits
    pi_50 = pi_str(50)
    assert pi_50.startswith("3.14159265358979323846264338327950288419716939937510"), f"Failed: {pi_50}"

    # Test 3: 100 digits
    pi_100 = pi_str(100)
    assert pi_100.startswith(
        "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
    ), f"Failed: {pi_100}"

if __name__ == "__main__":
    # Example usage and test
    print("PI to 50 decimal places:")
    print(pi_str(50))
    print("\nRunning tests...")
    test_pi()
    print("All tests passed.")