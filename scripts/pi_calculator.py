#!/usr/bin/env python3
"""
Calculate π (PI) to high precision using mpmath.
Extended from 100 to 200 decimal places for bounty #2885.
"""
import mpmath

mpmath.mp.dps = 210  # 210 decimal places
pi_val = mpmath.pi
pi_str = mpmath.nstr(pi_val, 210)

print("π calculated to 210 decimal places:")
print(pi_str)

# Verify first 100 digits (already in discussion #2872)
first_100 = pi_str[2:102]
print(f"\nFirst 100 decimal digits: {first_100}")

# Next 100 digits (101-200)
next_100 = pi_str[102:202]
print(f"\nDecimal places 101-200: {next_100}")
