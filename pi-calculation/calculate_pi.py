#!/usr/bin/env python3
"""
Calculate PI to 1000 decimal places using the Chudnovsky algorithm.
This algorithm converges very fast - each iteration gives about 14 digits.
"""

import decimal
import math
from decimal import Decimal, getcontext

def pi_chudnovsky(precision=1000):
    """Calculate PI using the Chudnovsky algorithm."""
    # Set decimal precision
    getcontext().prec = precision + 10  # Extra precision for rounding
    
    C = 426880 * Decimal(10005).sqrt()
    M = Decimal(1)
    L = Decimal(13591409)
    X = Decimal(1)
    K = Decimal(6)
    S = Decimal(13591409)
    
    for i in range(1, precision // 14 + 10):  # Enough iterations
        M = M * (K**3 - 16*K) // (i**3)
        L += 545140134
        X *= -262537412640768000
        K += 12
        S += Decimal(M * L) / X
    
    pi = C / S
    return pi

def format_pi_string(pi_decimal, num_digits=1000):
    """Format PI as a string with the specified number of digits."""
    pi_str = str(pi_decimal)
    # Find the decimal point
    if '.' in pi_str:
        decimal_index = pi_str.index('.')
        # Take the whole part + decimal point + requested digits
        return pi_str[:decimal_index + num_digits + 1]
    else:
        return pi_str

def calculate_and_verify():
    """Calculate PI and verify against known digits."""
    # Known first 100 digits
    known_100 = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
    
    print("Calculating PI to 1000 decimal places...")
    pi_decimal = pi_chudnovsky(1000)
    pi_str = format_pi_string(pi_decimal, 1000)
    
    # Verify first 100 digits
    if pi_str.startswith(known_100):
        print("OK - First 100 digits match known value")
    else:
        print("ERROR - First 100 digits do not match")
        # Find where they differ
        for i in range(min(len(pi_str), len(known_100))):
            if pi_str[i] != known_100[i]:
                print(f"Differ at position {i}: {pi_str[i]} != {known_100[i]}")
                break
    
    # Count decimal digits
    decimal_digits = len(pi_str.split('.')[1]) if '.' in pi_str else 0
    print(f"Calculated PI to {decimal_digits} decimal places")
    
    return pi_str

if __name__ == "__main__":
    pi_string = calculate_and_verify()
    
    # Output in a format suitable for GitHub comment
    print("\n" + "="*60)
    print("PI calculated to 1000 decimal places:")
    print("="*60)
    print(pi_string)
    
    # Also output in chunks for easier reading
    print("\n" + "="*60)
    print("PI in 50-digit chunks:")
    print("="*60)
    
    # Remove the decimal point for chunking
    if '.' in pi_string:
        parts = pi_string.split('.')
        integer_part = parts[0]
        decimal_part = parts[1]
        
        print(f"{integer_part}.")
        for i in range(0, len(decimal_part), 50):
            chunk = decimal_part[i:i+50]
            print(f"  {chunk}")
            if i + 50 < len(decimal_part):
                print("   ", end="")
    else:
        print(pi_string)