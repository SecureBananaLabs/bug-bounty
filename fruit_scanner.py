#!/usr/bin/env python3
import os
import re
import sys
import math

# Patterns for "Low Hanging Fruit" bugs
PATTERNS = {
    "High Entropy Secret": r"[a-zA-Z0-9]{32,}",
    "AWS Access Key": r"AKIA[0-9A-Z]{16}",
    "Generic API Key": r"(api_key|secret|password|token)\s*[:=]\s*['\"][a-zA-Z0-9_\-]{10,}['\"]",
    "Hardcoded IPv4": r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
}

def calculate_entropy(data):
    if not data:
        return 0
    entropy = 0
    for x in range(256):
        p_x = float(data.count(chr(x))) / len(data)
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return entropy

def scan_file(path):
    findings = []
    try:
        with open(path, 'r', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                # Pattern Matching
                for label, pattern in PATTERNS.items():
                    if re.search(pattern, line):
                        findings.append({"type": label, "line": i, "content": line.strip()[:50]})
                
                # Entropy Analysis (Bonus Feature for high-fidelity detection)
                for word in re.findall(r"['\"]([a-zA-Z0-9]{20,})['\"]", line):
                    if calculate_entropy(word) > 3.5:
                        findings.append({"type": "High Entropy String (Potential Secret)", "line": i, "content": word[:20] + "..."})
    except Exception:
        pass
    return findings

def main():
    root_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    print(f"## QuickOps Security Audit Report")
    print(f"Target: {os.path.abspath(root_dir)}\n")
    print("| File | Line | Type | Preview |")
    print("| --- | --- | --- | --- |")
    
    found_any = False
    for root, _, files in os.walk(root_dir):
        for file in files:
            path = os.path.join(root, file)
            results = scan_file(path)
            for res in results:
                found_any = True
                rel_path = os.path.relpath(path, root_dir)
                print(f"| {rel_path} | {res['line']} | {res['type']} | `{res['content']}` |")
    
    if not found_any:
        print("| N/A | N/A | No issues found | N/A |")

if __name__ == "__main__":
    main()
