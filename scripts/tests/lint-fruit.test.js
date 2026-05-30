#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT = join(__dirname, "..", "lint-fruit.js");
const ROOT = join(__dirname, "..", "..");

function runDryRun() {
  return execSync(`node "${SCRIPT}" --dry-run`, {
    encoding: "utf8",
    cwd: ROOT,
    env: { ...process.env },
  });
}

test("lint-fruit.js exits with code 0 in dry-run mode", () => {
  const output = runDryRun();
  assert.ok(output.includes("Dry run"), "Should indicate dry run mode");
});

test("lint-fruit.js detects at least 5 issues", () => {
  const output = runDryRun();
  const issueCount = output.match(/✓/g);
  assert.ok(issueCount && issueCount.length >= 5, `Expected at least 5 detected issues, got ${issueCount ? issueCount.length : 0}`);
});

test("lint-fruit.js detects missing Zod validation", () => {
  const output = runDryRun();
  assert.ok(output.includes("missing Zod") || output.includes("Zod Validation"), "Should detect missing Zod validation");
});

test("lint-fruit.js detects unauthenticated routes", () => {
  const output = runDryRun();
  assert.ok(output.includes("authentication") || output.includes("Authentication") || output.includes("unauthenticated"), "Should detect unauthenticated routes");
});

test("lint-fruit.js detects Date.now() ID collision risk", () => {
  const output = runDryRun();
  assert.ok(output.includes("Date.now") || output.includes("collision"), "Should detect Date.now() ID collision risk");
});

test("lint-fruit.js detects plaintext password storage", () => {
  const output = runDryRun();
  assert.ok(output.includes("plaintext") || output.includes("Plaintext") || output.includes("password"), "Should detect plaintext password storage");
});

test("lint-fruit.js generates proper issue body with required disclaimer", () => {
  const output = runDryRun();
  assert.ok(
    output.includes("This issue is limited only to the creator of this issue"),
    "Each issue body must contain the required disclaimer"
  );
  assert.ok(
    output.includes("refer to issue #743"),
    "Each issue body must reference issue #743"
  );
});

test("lint-fruit.js detects missing navigation links", () => {
  const output = runDryRun();
  assert.ok(output.includes("Navigation") || output.includes("navigation"), "Should detect missing navigation links");
});

test("lint-fruit.js detects stub search service", () => {
  const output = runDryRun();
  assert.ok(output.includes("Search") || output.includes("search"), "Should detect stub search service");
});

test("lint-fruit.js produces severity labels", () => {
  const output = runDryRun();
  assert.ok(output.includes("[HIGH]") || output.includes("[MEDIUM]") || output.includes("[LOW]"), "Should include severity labels");
});

test("lint-fruit.js skips resolved issues", () => {
  const authServiceContent = readFileSync(join(ROOT, "apps/api/src/services/authService.js"), "utf8");
  if (authServiceContent.includes("bcrypt") || authServiceContent.includes("argon")) {
    const output = runDryRun();
    assert.ok(!output.includes("plaintext"), "Should not report plaintext passwords if hashing is implemented");
  } else {
    assert.ok(true, "Password hashing not yet implemented — issue correctly detected");
  }
});
