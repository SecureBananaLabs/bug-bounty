import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectLowHangingFruit } from "../../../../scripts/low-hanging-fruit/detectors.mjs";
import {
  formatIssueBody,
  OWNERSHIP_DISCLAIMER
} from "../../../../scripts/low-hanging-fruit/formatIssue.mjs";
import { createIssuesRecursively } from "../../../../scripts/low-hanging-fruit/createIssues.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

test("detectLowHangingFruit finds known insecure defaults and auth gaps", () => {
  const findings = detectLowHangingFruit(repoRoot);
  const ids = new Set(findings.map((finding) => finding.id));

  assert.ok(findings.length >= 8);
  assert.ok(ids.has("LHF-001"));
  assert.ok(ids.has("LHF-002"));
  assert.ok(ids.has("LHF-003"));
  assert.ok(ids.has("LHF-004"));
  assert.ok(ids.has("LHF-005"));
  assert.ok(ids.has("LHF-006"));
});

test("formatIssueBody includes ownership disclaimer and parent issue reference", () => {
  const body = formatIssueBody(
    {
      id: "LHF-001",
      title: "Bug: JWT secret falls back to insecure hardcoded default",
      severity: "critical",
      file: "apps/api/src/config/env.js",
      description: "Hardcoded secret fallback.",
      remediation: "Require JWT_SECRET."
    },
    { parentIssue: 743 }
  );

  assert.match(body, /LHF-001/);
  assert.match(body, /#743/);
  assert.equal(body.includes(OWNERSHIP_DISCLAIMER), true);
});

test("createIssuesRecursively dry-run prepares bodies without creating issues", () => {
  const findings = detectLowHangingFruit(repoRoot).slice(0, 2);
  const results = createIssuesRecursively({
    findings,
    dryRun: true,
    maxIssues: 2
  });

  assert.equal(results.length, 2);
  assert.equal(results.every((result) => result.dryRun === true), true);
  assert.equal(results.every((result) => result.created === false), true);
  assert.equal(results.every((result) => result.body.includes(OWNERSHIP_DISCLAIMER)), true);
});
