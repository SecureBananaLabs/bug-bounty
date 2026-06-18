#!/usr/bin/env python3
import os
import re
import sys

# Patterns for "Low Hanging Fruit" bugs (Secrets, Hardcoded keys, etc.)
PATTERNS = {
    "High Entropy Secret": r"[a-zA-Z0-9]{32,}",
    "AWS Key": r"AKIA[0-9A-Z]{16}",
    "Generic API Key": r"(api_key|secret|password|token)\s*[:=]\s*['\"][a-zA-Z0-9_\-]{10,}['\"]",
    "Hardcoded IP": r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
}

def scan_file(path):
    findings = []
    try:
        with open(path, 'r', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                for label, pattern in PATTERNS.items():
                    if re.search(pattern, line):
                        findings.append(f"[{label}] {path}:{i}")
    except Exception:
        pass
    return findings

def main():
    root_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    all_findings = []
    for root, _, files in os.walk(root_dir):
        for file in files:
            path = os.path.join(root, file)
            all_findings.extend(scan_file(path))
    
    if all_findings:
        print("\n".join(all_findings))
        sys.exit(1)
    print("No low-hanging fruit found.")
    sys.exit(0)

if __name__ == "__main__":
    main()
