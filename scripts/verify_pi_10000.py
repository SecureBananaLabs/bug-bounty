#!/usr/bin/env python3
"""Generate and verify a 10,000-decimal-place PI artifact."""

from __future__ import annotations

import argparse
import hashlib
from decimal import Decimal, localcontext
from math import factorial
from pathlib import Path


DECIMAL_PLACES = 10000
GUARD_DIGITS = 40
OUTPUT = Path("PI_10000.md")
BEGIN_MARKER = "<!-- BEGIN_PI_10000 -->"
END_MARKER = "<!-- END_PI_10000 -->"


def compute_pi(decimal_places: int = DECIMAL_PLACES) -> str:
    """Return PI as 3.<decimal_places digits> using the Chudnovsky series."""

    terms = decimal_places // 14 + 3
    precision = decimal_places + GUARD_DIGITS

    with localcontext() as ctx:
        ctx.prec = precision
        series = Decimal(0)
        for k in range(terms):
            numerator = Decimal((-1) ** k * factorial(6 * k) * (13591409 + 545140134 * k))
            denominator = Decimal(
                factorial(3 * k)
                * (factorial(k) ** 3)
                * (640320 ** (3 * k))
            )
            series += numerator / denominator

        pi_value = (Decimal(426880) * Decimal(10005).sqrt()) / series

    return f"{pi_value:.{decimal_places}f}"


def grouped_digits(pi_text: str) -> str:
    integer, decimals = pi_text.split(".")
    lines = [f"{integer}."]
    for offset in range(0, len(decimals), 100):
        chunk = decimals[offset : offset + 100]
        lines.append(" ".join(chunk[i : i + 10] for i in range(0, len(chunk), 10)))
    return "\n".join(lines)


def render_document(pi_text: str) -> str:
    digest = hashlib.sha256(pi_text.encode("ascii")).hexdigest()
    return f"""# PI to 10,000 Decimal Places

This artifact continues issue #2885 with a reproducible 10,000-decimal-place
prefix. The value below is generated from the Chudnovsky series by
`scripts/verify_pi_10000.py` using Python's standard-library `decimal` module
with guard digits.

- Decimal places after the point: {DECIMAL_PLACES}
- SHA-256 of the compact `3.<digits>` value: `{digest}`
- Verification command: `python scripts/verify_pi_10000.py`

{BEGIN_MARKER}
```text
{grouped_digits(pi_text)}
```
{END_MARKER}
"""


def extract_document_value(document: str) -> str:
    try:
        block = document.split(BEGIN_MARKER, 1)[1].split(END_MARKER, 1)[0]
    except IndexError as exc:
        raise ValueError("PI markers are missing from PI_10000.md") from exc

    lines = [line.strip() for line in block.splitlines()]
    payload_lines = [line for line in lines if line and not line.startswith("```")]
    compact = "".join(payload_lines).replace(" ", "")
    if not compact.startswith("3."):
        raise ValueError("PI payload must start with '3.'")
    if len(compact.split(".", 1)[1]) != DECIMAL_PLACES:
        raise ValueError(f"PI payload must contain {DECIMAL_PLACES} decimal places")
    return compact


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="write PI_10000.md")
    args = parser.parse_args()

    pi_text = compute_pi()
    if args.write:
        OUTPUT.write_text(render_document(pi_text), encoding="utf-8", newline="\n")
        print(f"wrote {OUTPUT} with {DECIMAL_PLACES} decimal places")
        return 0

    actual = extract_document_value(OUTPUT.read_text(encoding="utf-8"))
    if actual != pi_text:
        raise SystemExit("PI_10000.md does not match the generated Chudnovsky value")

    digest = hashlib.sha256(actual.encode("ascii")).hexdigest()
    print(f"verified {OUTPUT}: {DECIMAL_PLACES} decimals, sha256={digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
