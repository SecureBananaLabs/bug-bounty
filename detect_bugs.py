#!/usr/bin/env python3
"""Detect API controllers that pass req.body without schema validation."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

FUNCTION_RE = re.compile(r"export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*\{", re.MULTILINE)
RAW_BODY_RE = re.compile(r"\breq\.body\b")
PARSE_RE = re.compile(r"\b\w+Schema\.parse\(\s*req\.body\s*\)")


def iter_functions(source: str):
    for match in FUNCTION_RE.finditer(source):
        index = match.end()
        depth = 1
        while index < len(source) and depth:
            char = source[index]
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
            index += 1
        yield match.group(1), source[match.end() : index - 1]


def scan_controller(path: Path):
    source = path.read_text()
    findings = []

    for function_name, body in iter_functions(source):
        if RAW_BODY_RE.search(body) and not PARSE_RE.search(body):
            findings.append((path, function_name))

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--controllers-dir",
        default="apps/api/src/controllers",
        help="Directory containing API controller files",
    )
    args = parser.parse_args()

    controllers_dir = Path(args.controllers_dir)
    findings = []

    for controller in sorted(controllers_dir.glob("*Controller.js")):
      findings.extend(scan_controller(controller))

    if not findings:
        print("No missing req.body validation found in API controllers.")
        return 0

    print("Missing req.body validation detected:")
    for path, function_name in findings:
        print(f"- {path}: {function_name}")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
