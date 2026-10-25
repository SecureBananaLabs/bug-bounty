#!/usr/bin/env python3
"""
detect_bugs.py — Scan Express controllers for req.body used without Zod schema.parse()

Bug pattern:
  In an Express+Zod codebase, controllers that accept req.body should validate it
  via schema.parse(req.body). Passing raw req.body to service functions bypasses
  type checking, input sanitization, and can allow injection attacks or data corruption.

Usage:
  python detect_bugs.py [--dir path/to/controllers]

Exit code:
  0 — no vulnerabilities found
  1 — vulnerabilities found (report printed to stdout)
"""

import os
import re
import sys
import json

def scan_controller(filepath, rel_root):
    """Scan a single controller file for req.body without prior schema.parse()."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        lines = content.split("\n")

    filename = os.path.relpath(filepath, rel_root)
    results = []

    has_schema_import = "schema" in content.lower() or re.search(
        r"import\s+.*z\s+from\s+['\"]zod['\"]", content
    )

    # Find all functions that use req.body
    # Pattern: look for `req.body` usage in the file
    # Then check if that function or any prior line has `.parse(req.body)`

    # Step 1: find lines referencing req.body
    for i, line in enumerate(lines):
        if "req.body" in line and not line.strip().startswith("//"):
            line_num = i + 1

            # Check if .parse(req.body) is used on this same line
            if re.search(r"\.parse\s*\(\s*req\.body\s*\)", line):
                continue  # Has validation — skip

            # Check if this line is just a comment or non-functional reference
            stripped = line.strip()
            if stripped.startswith("*") or stripped.startswith("//"):
                continue

            # Check if the line or the function block has .parse(req.body)
            # Look backwards for the function declaration
            func_body_start = max(0, i - 30)
            func_code = "\n".join(lines[func_body_start : i + 1])

            if re.search(r"\.parse\s*\(\s*req\.body\s*\)", func_code):
                continue  # parse() found earlier in the same function

            # Check if req.body is passed to a service call (likely an unvalidated bug)
            # Patterns: serviceFunction(req.body), await someService(req.body)
            if re.search(r"\b\w+\s*\(\s*req\.body\b", line) or re.search(
                r"req\.body\b", line
            ):
                # Determine the function name
                func_match = re.search(
                    r"export\s+(?:async\s+)?function\s+(\w+)", func_code
                )
                func_name = func_match.group(1) if func_match else "(anonymous)"
                results.append(
                    {
                        "file": filename,
                        "line": line_num,
                        "function": func_name,
                        "snippet": stripped[:120],
                    }
                )

    return results


def scan_directory(controller_dir):
    """Scan all .js/.ts files in the controllers directory."""
    all_results = []
    if not os.path.isdir(controller_dir):
        print(f"ERROR: directory not found: {controller_dir}", file=sys.stderr)
        sys.exit(2)

    for entry in sorted(os.listdir(controller_dir)):
        if not entry.endswith((".js", ".ts")):
            continue
        path = os.path.join(controller_dir, entry)
        results = scan_controller(path, controller_dir)
        all_results.extend(results)

    return all_results


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Detect req.body used without schema.parse() in controllers"
    )
    parser.add_argument(
        "--dir",
        default="apps/api/src/controllers",
        help="Path to controllers directory (default: apps/api/src/controllers)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    args = parser.parse_args()

    results = scan_directory(args.dir)

    if not results:
        if args.json:
            print(json.dumps({"vulnerabilities": [], "count": 0, "status": "clean"}))
        else:
            print("✅ No vulnerabilities found — all req.body usage has schema.parse()")
        return 0

    if args.json:
        print(
            json.dumps(
                {
                    "vulnerabilities": results,
                    "count": len(results),
                    "status": "vulnerable",
                },
                indent=2,
            )
        )
    else:
        print(f"🔴 Found {len(results)} controller(s) using req.body without schema.parse():\n")
        for r in results:
            print(f"  📁 {r['file']}:{r['line']}")
            print(f"     Function: {r['function']}")
            print(f"     Code:     {r['snippet']}")
            print()
        print("---")
        print("FIX: Add a Zod schema and call it before using req.body:")
        print('  import { z } from "zod";')
        print('  const mySchema = z.object({ ... });')
        print("  const payload = mySchema.parse(req.body);")

    return 1


if __name__ == "__main__":
    sys.exit(main())
