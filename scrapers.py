import requests
import re
from typing import List, Dict, Any

class BountyScraper:
    def __init__(self):
        self.targets = ["algora.io", "github.com", "polar.sh"]

    def scan_for_bugs(self, repo_content: List[str]) -> List[Dict[str, Any]]:
        """
        Analyzes codebase content for common vulnerabilities and quality issues.
        """
        findings = []
        patterns = {
            "Hardcoded Secret": r'(?i)(api_key|secret|password|token|access_key)\s*=\s*["\'][a-zA-Z0-9_\-]{16,}[\'"]',
            "SQL Injection": r'(?i)(select|insert|update|delete).*?f".*?\{.*?\}',
            "Insecure Eval": r'eval\(.*?\)',
            "Debug Mode Enabled": r'debug\s*=\s*True'
        }
        
        for i, content in enumerate(repo_content):
            for label, pattern in patterns.items():
                if re.search(pattern, content):
                    findings.append({
                        "type": label,
                        "file_index": i,
                        "detail": "Potential vulnerability detected via pattern matching."
                    })
        return findings
