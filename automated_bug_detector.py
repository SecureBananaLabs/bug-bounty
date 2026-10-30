"""Automated AST Bug Detection & Static Code Review Engine (Issue #11398 Solution).

Parses Python source files via the standard-library `ast` module to detect common
security, reliability, and performance defects (mutable default arguments, bare excepts,
hardcoded secrets, and unsafe eval/exec calls) and generates a structured review report.
"""

from __future__ import annotations

import ast
from dataclasses import asdict, dataclass
from typing import Any, Dict, List


@dataclass
class ReviewFinding:
    rule_id: str
    severity: str
    line: int
    message: str


class AutomatedBugDetector(ast.NodeVisitor):
    """AST-based static analyzer for automated pull request code review."""

    DANGEROUS_CALLS = {"eval", "exec", "compile"}
    SECRET_KEYWORDS = {"api_key", "secret_key", "password", "private_key", "access_token"}

    def __init__(self) -> None:
        self.findings: List[ReviewFinding] = []

    def visit_FunctionDef(self, node: ast.FunctionDef) -> Any:
        for default in node.args.defaults + node.args.kw_defaults:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.findings.append(
                    ReviewFinding(
                        rule_id="BUG-001",
                        severity="HIGH",
                        line=node.lineno,
                        message=f"Function '{node.name}' uses a mutable default argument.",
                    )
                )
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler) -> Any:
        if node.type is None:
            self.findings.append(
                ReviewFinding(
                    rule_id="BUG-002",
                    severity="MEDIUM",
                    line=node.lineno,
                    message="Bare 'except:' clause catches SystemExit and KeyboardInterrupt.",
                )
            )
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> Any:
        if isinstance(node.func, ast.Name) and node.func.id in self.DANGEROUS_CALLS:
            self.findings.append(
                ReviewFinding(
                    rule_id="SEC-001",
                    severity="CRITICAL",
                    line=node.lineno,
                    message=f"Unsafe dynamic code execution via '{node.func.id}()'.",
                )
            )
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> Any:
        for target in node.targets:
            if isinstance(target, ast.Name) and any(k in target.id.lower() for k in self.SECRET_KEYWORDS):
                if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str) and len(node.value.value) > 8:
                    self.findings.append(
                        ReviewFinding(
                            rule_id="SEC-002",
                            severity="CRITICAL",
                            line=node.lineno,
                            message=f"Potential hardcoded credential assigned to '{target.id}'.",
                        )
                    )
        self.generic_visit(node)


def analyze_source(source_code: str) -> Dict[str, Any]:
    tree = ast.parse(source_code)
    detector = AutomatedBugDetector()
    detector.visit(tree)
    return {
        "total_findings": len(detector.findings),
        "passed_gate": all(f.severity != "CRITICAL" for f in detector.findings),
        "findings": [asdict(f) for f in detector.findings],
    }
