# Extended π Calculation

This repository extends the known decimal digits of π contributed to
discussion [#2872](https://github.com/SecureBananaLabs/bug-bounty/discussions/2872).

## π to 200 decimal places

```
3.14159265358979323846264338327950288419716939937510
  58209749445923078164062862089986280348253421170679
  82148086513282306647093844609550582231725359408128
  48111745028410270193852110555964462294895493038196
```

- Decimal places 1–100: Posted by the issue author in discussion #2872
- Decimal places 101–200: Added via this contribution using `mpmath` with 210-digit precision

## Verification

The script [`scripts/pi_calculator.py`](scripts/pi_calculator.py) computes π using mpmath's high-precision
implementation. Run it with:

```bash
pip install mpmath
python scripts/pi_calculator.py
```
