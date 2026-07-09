from __future__ import annotations

import json
import re
from pathlib import Path


CONTROLLER_DIR = Path("apps/api/src/controllers")
BODY_RE = re.compile(r"\breq\.body\b")
PARSE_RE = re.compile(r"\.(?:parse|safeParse)\(\s*req\.body\s*\)")


def has_nearby_validation(lines: list[str], index: int) -> bool:
    window_start = max(0, index - 4)
    window_end = min(len(lines), index + 2)
    return any(PARSE_RE.search(lines[i]) for i in range(window_start, window_end))


def scan_controller(path: Path) -> list[dict[str, object]]:
    findings = []
    lines = path.read_text(encoding="utf-8").splitlines()

    for index, line in enumerate(lines):
      if BODY_RE.search(line) and not has_nearby_validation(lines, index):
          findings.append({
              "file": str(path).replace("\\", "/"),
              "line": index + 1,
              "code": line.strip()
          })

    return findings


def main() -> int:
    findings = []
    for path in sorted(CONTROLLER_DIR.glob("*Controller.js")):
        findings.extend(scan_controller(path))

    report = {
        "rule": "controller-req-body-validation",
        "findings": findings,
        "summary": f"{len(findings)} unvalidated req.body use(s) found"
    }
    print(json.dumps(report, indent=2))
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
