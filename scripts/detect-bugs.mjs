#!/usr/bin/env node
/**
 * Low-Hanging-Fruit Bug Detector for SecureBananaLabs/bug-bounty
 *
 * Scans the codebase for recurring security and correctness issues,
 * produces a machine-readable JSON report, and optionally creates
 * GitHub issues for each finding.
 *
 * Usage:
 *   node scripts/detect-bugs.mjs          # scan and print report
 *   node scripts/detect-bugs.mjs --create # scan + create issues via gh CLI
 *
 * Issue #11398 — Automate Low Hanging fruit bug detection
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CREATE_ISSUES = process.argv.includes("--create");

// ---------------------------------------------------------------------------
// Scanner definitions
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Finding
 * @property {string} id          — stable machine-readable id
 * @property {string} severity    — low | medium | high
 * @property {string} title       — GitHub issue title
 * @property {string} description — full issue body (markdown)
 * @property {string[]} files     — affected file paths (relative to repo root)
 */

/** @type {Array<{glob: string, scan: (content: string, path: string) => Finding[]}>} */
const scanners = [];

// Helper: read a file relative to repo root & return its content
function read(f) {
  const p = resolve(ROOT, f);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

// ---------------------------------------------------------------------------
// 1. authService.js — registerUser race condition
// ---------------------------------------------------------------------------
scanners.push({
  glob: "apps/api/src/services/authService.js",
  scan(content, filePath) {
    const findings = [];
    const dateNowCalls = (content.match(/Date\.now\(\)/g) || []).length;
    const regFn = content.includes("export async function registerUser");
    if (regFn && dateNowCalls >= 2) {
      findings.push({
        id: "race-register-user-id",
        severity: "medium",
        title: "registerUser generates id and JWT sub from separate Date.now() calls",
        description: `## Bug

\`registerUser()\` in \`${filePath}\` calls \`Date.now()\` twice:
once for the returned \`id\` field and once for the JWT \`sub\` claim.

When the two calls cross a millisecond boundary, the API returns one
user id while signing the access token for a different subject.

## Expected fix

Generate the user id once, return it, and sign the access token with the
same id as \`sub\`. Add focused service test coverage.

## Scope

Limited to \`${filePath}\` and corresponding service tests.

---
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.

Parent bounty: #11398`,
        files: [filePath],
      });
    }
    return findings;
  },
});

// ---------------------------------------------------------------------------
// 2. auth refresh bypass — refreshToken() ignores request payload
// ---------------------------------------------------------------------------
scanners.push({
  glob: "apps/api/src/controllers/authController.js",
  scan(content, filePath) {
    const findings = [];
    if (/async function refresh/.test(content) && /refreshToken\(\)/.test(content)) {
      const svc = read("apps/api/src/services/authService.js");
      const svcIgnoresArg = svc && /async function refreshToken\(\)/.test(svc);
      if (svcIgnoresArg) {
        findings.push({
          id: "auth-refresh-bypass",
          severity: "high",
          title: "auth refresh endpoint ignores request payload and issues hard-coded tokens",
          description: `## Bug

\`refresh()\` in \`${filePath}\` calls \`refreshToken()\` without passing
the refresh token from the request body. The service also signs a token
for the hard-coded subject \`"usr_existing"\` with role \`"client"\`.

## Expected fix

- Extract the refresh token from \`req.body\`.
- Pass it to \`refreshToken()\`.
- Verify the token belongs to the requesting user before issuing a new one.
- Sign the refreshed token for the authenticated subject and role.

## Scope

Limited to auth controller/service behavior and focused API tests.

---
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.

Parent bounty: #11398`,
          files: [filePath, "apps/api/src/services/authService.js"],
        });
      }
    }
    return findings;
  },
});

// ---------------------------------------------------------------------------
// 3. search input validation
// ---------------------------------------------------------------------------
scanners.push({
  glob: "apps/api/src/controllers/searchController.js",
  scan(content, filePath) {
    const findings = [];
    if (/req\.query\.q/.test(content) &&!/\.trim\(\)/.test(content) &&!/\.length/.test(content)) {
      findings.push({
        id: "search-no-validation",
        severity: "medium",
        title: "search endpoint passes raw query string without validation or length limit",
        description: `## Bug

\`search()\` in \`${filePath}\` passes \`req.query.q\` directly to the
search service without trimming, length-limiting, or validating the input
shape.

An attacker can send extremely long query strings to consume server
resources or trigger unexpected behavior in the search service.

## Expected fix

Add input validation: trim the query string, enforce a maximum length
(e.g. 200 characters), and reject non-string values.

## Scope

Limited to \`${filePath}\` and focused API tests.

---
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.

Parent bounty: #11398`,
        files: [filePath],
      });
    }
    return findings;
  },
});

// ---------------------------------------------------------------------------
// 4. admin self-assignment in registerSchema
// ---------------------------------------------------------------------------
scanners.push({
  glob: "apps/api/src/validators/auth.js",
  scan(content, filePath) {
    const findings = [];
    if (/z\.enum\(\[.*"admin"[^\]]*\]\)/.test(content)) {
      findings.push({
        id: "register-admin-role",
        severity: "high",
        title: "registerSchema allows admin role self-assignment",
        description: `## Bug

\`registerSchema\` in \`${filePath}\` includes \`"admin"\` in the
allowed role enum. Any unauthenticated caller can register with
\`role: "admin"\` and receive an admin token.

## Expected fix

Remove \`"admin"\` from the register schema role enum.
Registration should only allow \`["client", "freelancer"]\`.

## Scope

Limited to \`${filePath}\`.

---
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.

Parent bounty: #11398`,
        files: [filePath],
      });
    }
    return findings;
  },
});

// ---------------------------------------------------------------------------
// 5. unprotected job creation
// ---------------------------------------------------------------------------
scanners.push({
  glob: "apps/api/src/routes/jobRoutes.js",
  scan(content, filePath) {
    const findings = [];
    if (/jobRoutes\.post\s*\(/.test(content) &&!/authMiddleware/.test(content)) {
      findings.push({
        id: "unprotected-job-create",
        severity: "medium",
        title: "job creation endpoint is missing authentication middleware",
        description: `## Bug

\`POST /api/jobs\` in \`${filePath}\` is registered without
\`authMiddleware\`. Anyone can create job listings anonymously.

## Expected fix

Add the existing \`authMiddleware\` to the POST route so only
authenticated users can create jobs.

## Scope

Limited to \`${filePath}\` and focused API tests.

---
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.

Parent bounty: #11398`,
        files: [filePath],
      });
    }
    return findings;
  },
});

// ---------------------------------------------------------------------------
// 6. unprotected payment creation
// ---------------------------------------------------------------------------
scanners.push({
  glob: "apps/api/src/routes/paymentRoutes.js",
  scan(content, filePath) {
    const findings = [];
    if (/paymentRoutes\.post\s*\(/.test(content) &&!/authMiddleware/.test(content)) {
      findings.push({
        id: "unprotected-payment-create",
        severity: "medium",
        title: "payment creation endpoint is missing authentication middleware",
        description: `## Bug

\`POST /api/payments\` in \`${filePath}\` is registered without
\`authMiddleware\`. Anyone can create payment intent records anonymously.

## Expected fix

Add the existing \`authMiddleware\` to the POST route so only
authenticated users can create payment records.

## Scope

Limited to \`${filePath}\` and focused API tests.

---
This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.

Parent bounty: #11398`,
        files: [filePath],
      });
    }
    return findings;
  },
});

// ---------------------------------------------------------------------------
// Exec
// ---------------------------------------------------------------------------

/** @type {Finding[]} */
const allFindings = [];

for (const { glob, scan } of scanners) {
  if (!existsSync(resolve(ROOT, glob))) {
    console.log(`  SKIP ${glob} (file not found)`);
    continue;
  }
  const content = readFileSync(resolve(ROOT, glob), "utf8");
  const findings = scan(content, glob);
  for (const f of findings) {
    const exists = allFindings.some((x) => x.id === f.id);
    if (exists) {
      console.log(`  DUPLICATE ${f.id} — skipping`);
      continue;
    }
    allFindings.push(f);
  }
}

// Print report
console.log("\n==============================================");
console.log(` Bug Detector — ${allFindings.length} findings`);
console.log("==============================================\n");

const bySeverity = { high: [], medium: [], low: [] };
for (const f of allFindings) bySeverity[f.severity].push(f);

for (const sev of ["high", "medium", "low"]) {
  if (bySeverity[sev].length === 0) continue;
  console.log(`[${sev.toUpperCase()}]`);
  for (const f of bySeverity[sev]) {
    console.log(`  ${f.id}`);
    console.log(`    Title: ${f.title}`);
    console.log(`    Files: ${f.files.join(", ")}`);
    console.log();
  }
}

// Create GitHub issues
if (CREATE_ISSUES) {
  console.log("--- Creating issues ---\n");
  for (const f of allFindings) {
    const bodyFile = `${process.env.TEMP || "/tmp"}/gh-issue-${f.id}.md`;
    writeFileSync(bodyFile, f.description, "utf8");
    try {
      const out = execSync(
        `gh issue create --repo SecureBananaLabs/bug-bounty --title "${f.title}" --body-file "${bodyFile}" --label "bug,bug bounty,bounty,good first issue,AI agent friendly"`,
        { encoding: "utf8", stdio: "pipe" }
      );
      console.log(`  CREATED ${f.id} → ${out.trim()}`);
    } catch (e) {
      console.error(`  FAILED ${f.id}: ${e.stderr?.toString() || e.message}`);
    }
  }
}

// Write JSON report
import { writeFileSync } from "node:fs";
const reportPath = resolve(ROOT, "scripts", "bug-report.json");
writeFileSync(reportPath, JSON.stringify(allFindings, null, 2), "utf8");
console.log(`\nReport written to scripts/bug-report.json\n`);

if (!CREATE_ISSUES) {
  console.log("Run with --create to auto-create the issues via gh CLI.\n");
}
