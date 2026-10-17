import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ISSUE_LIMITATION_CLAUSE } from "../constants.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const cliPath = path.join(repoRoot, "tools/bug-scanner/src/cli.js");

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
    cwd: repoRoot,
    ...options
  });
}

test("CLI --format json returns findings for the monorepo", () => {
  const result = runCli(["--format", "json", "--root", repoRoot]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.ok(Array.isArray(payload.findings));
  assert.ok(payload.findings.length > 0);
  assert.ok(Array.isArray(payload.issues));
  assert.equal(payload.issues.length, payload.findings.length);
  assert.match(payload.issues[0].body, /11398/);
});

test("CLI --export-dir writes issue drafts with the bounty clause", () => {
  const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), "bug-scanner-cli-export-"));

  try {
    const result = runCli([
      "--format",
      "json",
      "--root",
      repoRoot,
      "--export-dir",
      exportDir
    ]);

    assert.equal(result.status, 0, result.stderr);
    const manifestPath = path.join(exportDir, "manifest.json");
    assert.ok(fs.existsSync(manifestPath));

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.ok(manifest.count > 0);

    const firstIssuePath = path.join(exportDir, manifest.issues[0].filename);
    const issueBody = fs.readFileSync(firstIssuePath, "utf8");
    assert.match(issueBody, new RegExp(ISSUE_LIMITATION_CLAUSE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    fs.rmSync(exportDir, { recursive: true, force: true });
  }
});

test("CLI default markdown output includes the exact limitation clause", () => {
  const result = runCli(["--root", repoRoot]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    new RegExp(ISSUE_LIMITATION_CLAUSE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
});

test("CLI --create-issues dry-run returns a recursive issue plan in JSON", () => {
  const result = runCli([
    "--format",
    "json",
    "--root",
    repoRoot,
    "--create-issues",
    "--max-issues",
    "1"
  ]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.ok(Array.isArray(payload.created));
  assert.equal(payload.created.length, 1);
  assert.equal(payload.created[0].result.dryRun, true);
  assert.match(payload.created[0].issue.body, /11398/);
});

test("CLI --execute without GITHUB_TOKEN fails before remote issue creation", () => {
  const result = runCli(
    ["--create-issues", "--execute", "--format", "json", "--root", repoRoot, "--max-issues", "1"],
    {
      env: { ...process.env, GITHUB_TOKEN: "" }
    }
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /GITHUB_TOKEN is required to verify repository star status/);
});

test("root scan:bugs script invokes the scanner successfully", () => {
  const result = spawnSync("npm", ["run", "scan:bugs", "--", "--format", "json"], {
    encoding: "utf8",
    cwd: repoRoot
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const jsonStart = result.stdout.indexOf("{");
  assert.ok(jsonStart >= 0, "expected JSON output from scan:bugs");
  const payload = JSON.parse(result.stdout.slice(jsonStart));
  assert.ok(payload.findings.length > 0);
});
