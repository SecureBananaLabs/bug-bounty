import decimal
import math
from decimal import Decimal, getcontext

def pi_chudnovsky(precision=1000):
    """Calculate PI using the Chudnovsky algorithm."""
    getcontext().prec = precision + 10
    C = 426880 * Decimal(10005).sqrt()
    M = Decimal(1)
    L = Decimal(13591409)
    X = Decimal(1)
    K = Decimal(6)
    S = Decimal(13591409)
    
    for i in range(1, precision // 14 + 10):
        M = M * (K**3 - 16*K) // (i**3)
        L += 545140134
        X *= -262537412640768000
        K += 12
        S += Decimal(M * L) / X
    
    pi = C / S
    return pi

def format_pi_string(pi_decimal, num_digits=1000):
    pi_str = str(pi_decimal)
    if '.' in pi_str:
        decimal_index = pi_str.index('.')
        return pi_str[:decimal_index + num_digits + 1]
    else:
        return pi_str

# Calculate PI to 1000 digits
pi_decimal = pi_chudnovsky(1000)
pi_str = format_pi_string(pi_decimal, 1000)

# Save to file
with open('pi_1000.txt', 'w', encoding='utf-8') as f:
    f.write(pi_str + '\n')

print(f"PI calculated to 1000 decimal places and saved to pi_1000.txt")
print(f"First 50 digits: {pi_str[:52]}")