#!/usr/bin/env python3
"""Generate a reproducible 50,000-decimal PI artifact for issue #2883."""

from __future__ import annotations

from decimal import Decimal, getcontext
from hashlib import sha256
from pathlib import Path


DECIMAL_PLACES = 50_000
GUARD_DIGITS = 35
OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "pi" / "pi-50000.md"
KNOWN_FIRST_100 = (
    "14159265358979323846264338327950288419716939937510"
    "58209749445923078164062862089986280348253421170679"
)


def chudnovsky_pi(decimal_places: int) -> str:
    """Return the non-rounded PI prefix with decimal_places digits after the point."""
    getcontext().prec = decimal_places + GUARD_DIGITS

    constant = 426880 * Decimal(10005).sqrt()
    multiplier = 1
    linear = 13_591_409
    exponential = 1
    series = Decimal(linear)
    k = 6

    # Each Chudnovsky term contributes a little over 14 decimal digits.
    iterations = decimal_places // 14 + 5
    for index in range(1, iterations):
        multiplier = (multiplier * (k**3 - 16 * k)) // (index**3)
        linear += 545_140_134
        exponential *= -262_537_412_640_768_000
        series += Decimal(multiplier * linear) / exponential
        k += 12

    value = str(constant / series)
    whole, fractional = value.split(".", 1)
    if whole != "3" or len(fractional) < decimal_places:
        raise RuntimeError("PI calculation did not produce the expected prefix length")

    compact = f"{whole}.{fractional[:decimal_places]}"
    if compact[2:102] != KNOWN_FIRST_100:
        raise RuntimeError("PI prefix failed the 100-decimal issue seed check")

    return compact


def grouped_digits(compact: str) -> str:
    fractional = compact.split(".", 1)[1]
    lines = ["3."]
    for start in range(0, len(fractional), 100):
        chunk = fractional[start : start + 100]
        groups = [chunk[index : index + 10] for index in range(0, len(chunk), 10)]
        lines.append(" ".join(groups))
    return "\n".join(lines)


def render_markdown(compact: str) -> str:
    digest = sha256(compact.encode("ascii")).hexdigest()
    grouped = grouped_digits(compact)
    return f"""# PI to 50,000 Decimal Places

This artifact continues discussion #2872 for issue #2883 with a reproducible PI
prefix that extends beyond the prior 20,000-decimal submission.

- Decimal places after the point: {DECIMAL_PLACES:,}
- Algorithm: Chudnovsky series with Python standard-library `decimal`
- SHA-256 of compact `3.<digits>` value: `{digest}`
- Reproduce and verify: `python3 scripts/generate_pi_50000.py`

The first 100 decimal places are checked against the seed value from the PI
discussion before this file is written.

<!-- BEGIN_PI_50000 -->
```text
{grouped}
```
<!-- END_PI_50000 -->
"""


def main() -> None:
    compact = chudnovsky_pi(DECIMAL_PLACES)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(render_markdown(compact), encoding="utf-8")
    digest = sha256(compact.encode("ascii")).hexdigest()
    print(f"Wrote {OUTPUT}")
    print(f"decimal_places={DECIMAL_PLACES}")
    print(f"sha256={digest}")


if __name__ == "__main__":
    main()
