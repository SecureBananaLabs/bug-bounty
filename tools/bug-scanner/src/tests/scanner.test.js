import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectHardcodedSecrets,
  detectMissingZodErrorHandler,
  detectUnprotectedMutatingRoutes,
  detectUnvalidatedRequestBody
} from "../detectors/rules.js";
import { ISSUE_LIMITATION_CLAUSE, BOUNTY_PARENT_ISSUE } from "../constants.js";
import { exportIssues } from "../export-issues.js";
import { formatFindingAsIssue, dedupeFindings } from "../issue-formatter.js";
import { scanRepository } from "../scanner.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function makeContext(filesByPath) {
  return {
    rootDir: repoRoot,
    files: Object.keys(filesByPath).map((relativePath) => path.join(repoRoot, relativePath)),
    readFile: (absolutePath) => filesByPath[path.relative(repoRoot, absolutePath)]
  };
}

test("detectMissingZodErrorHandler flags generic error handler", () => {
  const findings = detectMissingZodErrorHandler(
    makeContext({
      "apps/api/src/controllers/authController.js":
        'import { z } from "zod";\nexport async function register(req, res) {\n  const payload = registerSchema.parse(req.body);\n}\n',
      "apps/api/src/middleware/errorHandler.js":
        'export function errorHandler(err, req, res, next) {\n  return res.status(500).json({ message: "error" });\n}\n'
    })
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, "missing-zod-error-handler");
});

test("detectMissingZodErrorHandler flags middleware-only scans without controller files", () => {
  const findings = detectMissingZodErrorHandler(
    makeContext({
      "apps/api/src/middleware/errorHandler.js":
        'export function errorHandler(err, req, res, next) {\n  return res.status(500).json({ message: "error" });\n}\n'
    })
  );

  assert.equal(findings.length, 1);
  assert.match(findings[0].relatedFiles[0], /controllers\//);
});

test("detectUnvalidatedRequestBody flags direct req.body usage", () => {
  const findings = detectUnvalidatedRequestBody(
    makeContext({
      "apps/api/src/controllers/paymentController.js":
        "export async function createPayment(req, res) {\n  return ok(res, await createPaymentIntent(req.body), 201);\n}\n"
    })
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, "unvalidated-request-body");
  assert.match(findings[0].title, /createPayment/);
});

test("detectUnprotectedMutatingRoutes skips auth routes", () => {
  const findings = detectUnprotectedMutatingRoutes(
    makeContext({
      "apps/api/src/routes/paymentRoutes.js":
        'import { Router } from "express";\nexport const paymentRoutes = Router();\npaymentRoutes.post("/", createPayment);\n',
      "apps/api/src/routes/authRoutes.js":
        'import { Router } from "express";\nexport const authRoutes = Router();\nauthRoutes.post("/login", login);\n'
    })
  );

  assert.equal(findings.length, 1);
  assert.match(findings[0].file, /paymentRoutes\.js$/);
});

test("detectHardcodedSecrets flags weak jwt fallback", () => {
  const findings = detectHardcodedSecrets(
    makeContext({
      "apps/api/src/config/env.js":
        'export const env = {\n  jwtSecret: process.env.JWT_SECRET ?? "development-secret"\n};\n'
    })
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, "hardcoded-secret-fallback");
});

test("formatFindingAsIssue includes bounty limitation clause", () => {
  const issue = formatFindingAsIssue({
    id: "demo",
    severity: "high",
    title: "Example finding",
    file: "apps/api/src/example.js",
    line: 10,
    description: "Example description",
    recommendation: "Example recommendation",
    relatedFiles: ["apps/api/src/example.js"]
  });

  assert.match(issue.body, new RegExp(ISSUE_LIMITATION_CLAUSE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(issue.body, new RegExp(`#${BOUNTY_PARENT_ISSUE}`));
});

test("dedupeFindings removes duplicate entries", () => {
  const finding = {
    id: "demo",
    severity: "high",
    title: "Duplicate",
    file: "a.js",
    line: 1,
    description: "d",
    recommendation: "r"
  };

  assert.equal(dedupeFindings([finding, finding]).length, 1);
});

test("exportIssues writes markdown drafts", () => {
  const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), "bug-scanner-export-"));
  const manifest = exportIssues(
    [
      {
        title: "[bug-scanner] Sample",
        body: `Body\n\n${ISSUE_LIMITATION_CLAUSE}`,
        labels: ["bug"]
      }
    ],
    exportDir
  );

  assert.equal(manifest.length, 1);
  assert.ok(fs.existsSync(path.join(exportDir, manifest[0].filename)));
  fs.rmSync(exportDir, { recursive: true, force: true });
});

test("scanRepository finds multiple real issues in this monorepo", () => {
  const findings = scanRepository({ rootDir: repoRoot, recursive: true, maxDepth: 2 });
  const ids = new Set(findings.map((finding) => finding.id));

  assert.ok(findings.length >= 4, `expected at least 4 findings, got ${findings.length}`);
  assert.ok(ids.has("missing-zod-error-handler"));
  assert.ok(ids.has("unvalidated-request-body"));
  assert.ok(ids.has("unprotected-mutating-route"));
  assert.ok(ids.has("hardcoded-secret-fallback"));
});

test("scanRepository recursive pass follows related directories from findings", () => {
  const recursiveFindings = scanRepository({
    rootDir: repoRoot,
    scanDirs: ["apps/api/src/middleware"],
    recursive: true,
    maxDepth: 2
  });
  const nonRecursiveFindings = scanRepository({
    rootDir: repoRoot,
    scanDirs: ["apps/api/src/middleware"],
    recursive: false,
    maxDepth: 2
  });

  assert.ok(
    recursiveFindings.some((finding) => finding.id === "missing-zod-error-handler"),
    "expected middleware-only scan to find missing Zod handler"
  );
  assert.ok(
    recursiveFindings.some((finding) => finding.id === "unvalidated-request-body"),
    "expected recursive follow-up to reach controller validation gaps"
  );
  assert.equal(
    nonRecursiveFindings.some((finding) => finding.id === "unvalidated-request-body"),
    false,
    "non-recursive scan should not follow related controller directories"
  );
});

test("scanRepository maxDepth 0 performs a single pass", () => {
  const singlePass = scanRepository({
    rootDir: repoRoot,
    scanDirs: ["apps/api/src/middleware"],
    recursive: true,
    maxDepth: 0
  });
  const nonRecursive = scanRepository({
    rootDir: repoRoot,
    scanDirs: ["apps/api/src/middleware"],
    recursive: false,
    maxDepth: 5
  });

  assert.deepEqual(
    singlePass.map((finding) => finding.id).sort(),
    nonRecursive.map((finding) => finding.id).sort()
  );
});
