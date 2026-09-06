#!/usr/bin/env python3
"""Generate and verify the issue #2883 PI artifact.

The Pi Delivery API returns compact PI digits without the decimal point:
``314159...``. This script stores the human-readable value as ``3.<digits>``
while verifying length, the issue seed, and SHA-256 of the compact value.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable


DECIMAL_PLACES = 5_000_000
ISSUE_NUMBER = 2883
DISCUSSION_NUMBER = 2872
ISSUE_SEED = (
    "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
)
BEGIN_MARKER = "<!-- BEGIN_PI_5000000 -->"
END_MARKER = "<!-- END_PI_5000000 -->"
DEFAULT_OUTPUT = Path("docs/pi/pi_5000000_digits_2883.md")
PI_DELIVERY_ENDPOINT = "https://api.pi.delivery/v1/pi"


Fetcher = Callable[[int, int], str]


def compact_value(compact_content: str) -> str:
    validate_compact_content(compact_content, len(compact_content) - 1)
    return f"{compact_content[0]}.{compact_content[1:]}"


def compact_sha256(compact_content: str) -> str:
    return hashlib.sha256(compact_value(compact_content).encode("utf-8")).hexdigest()


def validate_compact_content(compact_content: str, decimal_places: int) -> None:
    if not compact_content:
        raise ValueError("PI content is empty")
    if not compact_content.isdigit():
        raise ValueError("PI content must contain digits only")
    if compact_content[0] != "3":
        raise ValueError("PI content must start with 3")
    expected_length = decimal_places + 1
    if len(compact_content) != expected_length:
        raise ValueError(
            f"expected {expected_length:,} compact digits for {decimal_places:,} decimal places, "
            f"got {len(compact_content):,}"
        )


def group_decimal_digits(digits: str, group_size: int = 10, groups_per_line: int = 10) -> str:
    groups = [digits[index : index + group_size] for index in range(0, len(digits), group_size)]
    lines = [
        " ".join(groups[index : index + groups_per_line])
        for index in range(0, len(groups), groups_per_line)
    ]
    return "\n".join(lines)


def format_markdown(
    compact_content: str,
    *,
    decimal_places: int = DECIMAL_PLACES,
    generated_at: str | None = None,
) -> str:
    validate_compact_content(compact_content, decimal_places)
    if not compact_content.startswith("3" + ISSUE_SEED):
        raise ValueError("PI content does not match the issue seed")

    generated_at = generated_at or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    sha256 = compact_sha256(compact_content)
    grouped_decimals = group_decimal_digits(compact_content[1:])

    return (
        f"# PI to {decimal_places:,} Decimal Places for Issue #{ISSUE_NUMBER}\n\n"
        f"This artifact continues issue #{ISSUE_NUMBER} and discussion #{DISCUSSION_NUMBER} with a "
        f"reproducible {decimal_places:,}-decimal-place prefix of PI.\n\n"
        f"- Decimal places after the point: {decimal_places:,}\n"
        f"- Source: Pi Delivery API (`{PI_DELIVERY_ENDPOINT}`)\n"
        f"- Generated at: {generated_at}\n"
        f"- SHA-256 of the compact `3.<digits>` value: `{sha256}`\n"
        f"- Verification: `python3 scripts/generate_pi_5000000_2883.py --verify`\n"
        f"- Online sample check: `python3 scripts/generate_pi_5000000_2883.py --verify --online-samples`\n\n"
        f"{BEGIN_MARKER}\n"
        "```text\n"
        "3.\n"
        f"{grouped_decimals}\n"
        "```\n"
        f"{END_MARKER}\n"
    )


def extract_compact_content(markdown: str) -> str:
    try:
        start = markdown.index(BEGIN_MARKER) + len(BEGIN_MARKER)
        end = markdown.index(END_MARKER)
    except ValueError as exc:
        raise ValueError("PI markdown markers are missing") from exc

    block = markdown[start:end]
    block = block.replace("```text", "").replace("```", "")
    compact = "".join(char for char in block if char.isdigit() or char == ".")
    if not compact.startswith("3."):
        raise ValueError("PI markdown block must start with 3.")
    return "3" + compact[2:].replace(".", "")


def verify_markdown(
    markdown: str,
    *,
    decimal_places: int = DECIMAL_PLACES,
    expected_sha256: str | None = None,
) -> dict[str, str | int]:
    compact_content = extract_compact_content(markdown)
    validate_compact_content(compact_content, decimal_places)
    if not compact_content.startswith("3" + ISSUE_SEED):
        raise ValueError("PI content does not match the issue seed")

    sha256 = compact_sha256(compact_content)
    if expected_sha256 and sha256 != expected_sha256:
        raise ValueError(f"SHA-256 mismatch: expected {expected_sha256}, got {sha256}")

    return {
        "decimal_places": decimal_places,
        "compact_digits": len(compact_content),
        "sha256": sha256,
        "first_100_decimals": compact_content[1 : 1 + len(ISSUE_SEED)],
    }


def build_pi_delivery_url(start: int, number_of_digits: int) -> str:
    return f"{PI_DELIVERY_ENDPOINT}?start={start}&numberOfDigits={number_of_digits}"


def read_url(url: str) -> str:
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            return response.read().decode("utf-8")
    except (urllib.error.URLError, ValueError):
        result = subprocess.run(
            ["curl", "-fsSL", url],
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout


def fetch_pi_content(start: int, number_of_digits: int) -> str:
    if start < 0:
        raise ValueError("start must be non-negative")
    if number_of_digits <= 0:
        raise ValueError("number_of_digits must be positive")

    payload = read_url(build_pi_delivery_url(start, number_of_digits))
    data = json.loads(payload)
    content = data.get("content")
    if not isinstance(content, str) or not content.isdigit():
        raise ValueError("Pi Delivery response did not contain digit content")
    if len(content) != number_of_digits:
        raise ValueError(
            f"Pi Delivery returned {len(content):,} digits for range start={start:,}, "
            f"expected {number_of_digits:,}"
        )
    return content


def download_pi_content(
    decimal_places: int,
    chunk_size: int,
    workers: int = 8,
    fetcher: Fetcher | None = None,
    retries: int = 3,
) -> str:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if workers <= 0:
        raise ValueError("workers must be positive")
    if retries < 0:
        raise ValueError("retries must be non-negative")

    fetcher = fetcher or fetch_pi_content
    total_digits = decimal_places + 1
    ranges = [
        (start, min(chunk_size, total_digits - start))
        for start in range(0, total_digits, chunk_size)
    ]
    total_chunks = len(ranges)

    def fetch_range(item: tuple[int, int]) -> str:
        start, size = item
        for attempt in range(retries + 1):
            try:
                return fetcher(start, size)
            except Exception:
                if attempt == retries:
                    raise
                time.sleep(min(0.5 * (attempt + 1), 2.0))
        raise RuntimeError("unreachable retry state")

    parts: list[str] = []
    if workers == 1:
        for index, item in enumerate(ranges, start=1):
            start, size = item
            if index == 1 or index % 100 == 0 or index == total_chunks:
                print(
                    f"Fetching chunk {index:,}/{total_chunks:,}: PI digits {start:,}..{start + size - 1:,}",
                    file=sys.stderr,
                )
            parts.append(fetch_range(item))
    else:
        print(
            f"Fetching {total_chunks:,} chunks with {workers:,} workers "
            f"({chunk_size:,} digits per chunk)",
            file=sys.stderr,
        )
        with ThreadPoolExecutor(max_workers=workers) as executor:
            for index, part in enumerate(executor.map(fetch_range, ranges), start=1):
                if index == 1 or index % 100 == 0 or index == total_chunks:
                    print(f"Fetched chunk {index:,}/{total_chunks:,}", file=sys.stderr)
                parts.append(part)

    compact_content = "".join(parts)
    validate_compact_content(compact_content, decimal_places)
    if not compact_content.startswith("3" + ISSUE_SEED):
        raise ValueError("downloaded PI content does not match the issue seed")
    return compact_content


def verify_online_samples(compact_content: str, sample_size: int = 120) -> list[dict[str, int]]:
    total_digits = len(compact_content)
    starts = sorted({0, total_digits // 3, (2 * total_digits) // 3, total_digits - sample_size})
    reports: list[dict[str, int]] = []
    for start in starts:
        expected = compact_content[start : start + sample_size]
        actual = fetch_pi_content(start, len(expected))
        if actual != expected:
            raise ValueError(f"online sample mismatch at compact digit offset {start:,}")
        reports.append({"start": start, "digits": len(expected)})
    return reports


def write_artifact(output: Path, compact_content: str, decimal_places: int) -> dict[str, str | int]:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(format_markdown(compact_content, decimal_places=decimal_places), encoding="utf-8")
    return verify_markdown(output.read_text(encoding="utf-8"), decimal_places=decimal_places)


def verify_artifact(output: Path, decimal_places: int, online_samples: bool = False) -> dict[str, str | int]:
    markdown = output.read_text(encoding="utf-8")
    report = verify_markdown(markdown, decimal_places=decimal_places)
    if online_samples:
        compact_content = extract_compact_content(markdown)
        samples = verify_online_samples(compact_content)
        report["online_samples"] = len(samples)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="download PI digits and write the markdown artifact")
    parser.add_argument("--verify", action="store_true", help="verify the generated markdown artifact")
    parser.add_argument(
        "--online-samples",
        action="store_true",
        help="during verification, compare a few sampled ranges against Pi Delivery",
    )
    parser.add_argument("--digits", type=int, default=DECIMAL_PLACES, help="decimal places after the point")
    parser.add_argument("--chunk-size", type=int, default=1_000, help="download chunk size for --write")
    parser.add_argument("--workers", type=int, default=16, help="parallel workers for --write")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="artifact path")
    args = parser.parse_args()

    if args.write:
        compact_content = download_pi_content(args.digits, args.chunk_size, workers=args.workers)
        report = write_artifact(args.output, compact_content, args.digits)
        print(json.dumps(report, indent=2))

    if args.verify:
        report = verify_artifact(args.output, args.digits, online_samples=args.online_samples)
        print(json.dumps(report, indent=2))

    if not args.write and not args.verify:
        parser.print_help()
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
