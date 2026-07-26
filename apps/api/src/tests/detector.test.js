import test from "node:test";
import assert from "node:assert/strict";
import { scanRepository, generateMarkdownReport, groupByDetector, generateGitHubIssues } from "../../../../scripts/detect-issues.mjs";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

const ROOT = resolve(import.meta.dirname, "../../../../");

test("scanRepository returns array of findings", () => {
  const findings = scanRepository(ROOT);
  assert.ok(Array.isArray(findings));
  assert.ok(findings.length > 0, "Should detect at least one issue");
});

test("scanRepository findings have correct structure", () => {
  const findings = scanRepository(ROOT);
  for (const f of findings) {
    assert.ok(typeof f.detector === "string");
    assert.ok(typeof f.severity === "string");
    assert.ok(["critical", "high", "medium", "low"].includes(f.severity));
    assert.ok(typeof f.description === "string");
    assert.ok(typeof f.file === "string");
    assert.ok(typeof f.line === "number");
    assert.ok(typeof f.match === "string");
  }
});

test("scanRepository detects hardcoded jwt secret", () => {
  const findings = scanRepository(ROOT);
  const jwtFindings = findings.filter((f) => f.detector === "hardcoded-jwt-secret");
  assert.ok(jwtFindings.length >= 1);
  assert.ok(jwtFindings.some((f) => f.file.includes("env.js")));
});

test("scanRepository detects in-memory array storage", () => {
  const findings = scanRepository(ROOT);
  const memFindings = findings.filter((f) => f.detector === "in-memory-array-storage");
  assert.ok(memFindings.length >= 3, "Should detect at least 3 in-memory arrays");
});

test("scanRepository detects zod parse without try-catch", () => {
  const findings = scanRepository(ROOT);
  const zodFindings = findings.filter((f) => f.detector === "zod-parse-without-try-catch");
  const controllerFindings = zodFindings.filter((f) => f.file.includes("controllers"));
  assert.ok(controllerFindings.length >= 2, "Should detect zod parse in controllers");
});

test("scanRepository detects weak cors config", () => {
  const findings = scanRepository(ROOT);
  const corsFindings = findings.filter((f) => f.detector === "weak-cors-config");
  assert.ok(corsFindings.length >= 1);
});

test("scanRepository detects TODO comments", () => {
  const findings = scanRepository(ROOT);
  const todoFindings = findings.filter((f) => f.detector === "todo-comment");
  assert.ok(todoFindings.length >= 3, "Should detect at least 3 TODO comments");
});

test("groupByDetector groups findings by detector name", () => {
  const findings = scanRepository(ROOT);
  const grouped = groupByDetector(findings);
  const detectorNames = Object.keys(grouped);
  assert.ok(detectorNames.length > 0);
  for (const [name, items] of Object.entries(grouped)) {
    assert.ok(items.length > 0);
    for (const item of items) {
      assert.equal(item.detector, name);
    }
  }
});

test("generateMarkdownReport produces markdown output", () => {
  const findings = scanRepository(ROOT);
  const report = generateMarkdownReport(findings);
  assert.ok(report.includes("# Automated Bug Detection Report"));
  assert.ok(report.includes("Total findings:"));
  assert.ok(report.includes("**Severity:**"));
  assert.ok(report.includes("**Description:**"));
});

test("generateMarkdownReport with empty findings", () => {
  const report = generateMarkdownReport([]);
  assert.equal(report.trim(), "No issues detected.");
});

test("generateGitHubIssues generates issues with correct structure", () => {
  const findings = scanRepository(ROOT);
  const issues = generateGitHubIssues(findings);
  assert.ok(Array.isArray(issues));
  assert.ok(issues.length > 0);
  for (const issue of issues) {
    assert.ok(typeof issue.title === "string");
    assert.ok(issue.title.startsWith("[Auto]"));
    assert.ok(typeof issue.body === "string");
    assert.ok(issue.body.includes("This issue is limited only to the creator"));
    assert.ok(issue.body.includes("Automate Bug Detection and Reviews #11398"));
    assert.ok(Array.isArray(issue.labels));
    assert.ok(issue.labels.includes("automated"));
  }
});

test("README.md exists", () => {
  assert.ok(existsSync(join(ROOT, "README.md")));
});

test("CONTRIBUTING.md exists", () => {
  assert.ok(existsSync(join(ROOT, "CONTRIBUTING.md")));
});

test("detect script file exists", () => {
  assert.ok(existsSync(join(ROOT, "scripts", "detect-issues.mjs")));
});

test("create issues script file exists", () => {
  assert.ok(existsSync(join(ROOT, "scripts", "create-issues.mjs")));
});
