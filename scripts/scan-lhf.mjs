#!/usr/bin/env node

/**
 * Low Hanging Fruit Bug Detector
 * Automatically scans the codebase for common security and quality issues,
 * then creates properly formatted GitHub issues.
 *
 * Usage: node scripts/scan-lhf.mjs [--dry-run] [--create-issues]
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { execSync } from "child_process";

const REPO_ROOT = process.cwd();
const GITHUB_REPO = "SecureBananaLabs/bug-bounty";
const ISSUE_TEMPLATE_REF = "#743";

// --- Rule Definitions ---
const RULES = [
  {
    id: "LHF-001",
    title: "Hardcoded JWT secret fallback enables token forgery",
    severity: "critical",
    type: "security",
    check: (content, filepath) => {
      // Matches patterns like: process.env.JWT_SECRET ?? "some-default"
      const pattern = /process\.env\.(\w+)\s*\?\?\s*["'][^"']+["']/g;
      const matches = [];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        matches.push({ variable: match[1], line: getLineNumber(content, match.index) });
      }
      return matches;
    },
    description: `A fallback secret string is used when the environment variable is not set. 
This allows anyone who discovers the default value to forge valid tokens. 
Production deployments should either crash on missing secrets or require them at startup.`,
    fix: "Remove the fallback value and add an early-exit guard that checks for required secrets on startup.",
  },
  {
    id: "LHF-002",
    title: "Authentication service does not verify credentials",
    severity: "critical",
    type: "security",
    check: (content, filepath) => {
      if (!filepath.includes("authService")) return [];
      const issues = [];
      if (content.includes("TODO: verify password")) issues.push({ line: getLineNumber(content, content.indexOf("TODO: verify password")) });
      if (content.includes("TODO: persist new user")) issues.push({ line: getLineNumber(content, content.indexOf("TODO: persist new user")) });
      return issues;
    },
    description: `The auth service contains TODO comments indicating password verification and user persistence 
are not implemented. Any email/password combination will produce a valid JWT.`,
    fix: "Implement bcrypt password hashing, database-backed user persistence, and proper credential verification.",
  },
  {
    id: "LHF-003",
    title: "Registration schema allows self-assignment of admin role",
    severity: "high",
    type: "security",
    check: (content, filepath) => {
      if (!filepath.includes("validators/auth")) return [];
      // Check if "admin" is in the role enum
      const adminMatch = content.match(/role:\s*z\.enum\(\[.*?"admin".*?\]\)/);
      return adminMatch ? [{ line: getLineNumber(content, adminMatch.index) }] : [];
    },
    description: `The registration validator includes 'admin' as a valid role choice. 
Any user can register as an administrator, gaining unrestricted access to the system.`,
    fix: "Remove 'admin' from the public registration schema. Admin role assignment should be handled by an existing admin through a separate privileged endpoint.",
  },
  {
    id: "LHF-004",
    title: "Payment endpoint lacks input validation",
    severity: "high",
    type: "security",
    check: (content, filepath) => {
      if (!filepath.includes("paymentController") && !filepath.includes("paymentService")) return [];
      const issues = [];
      if (content.includes("createPaymentIntent(req.body)") || content.includes("createPaymentIntent(payload)")) {
        if (!content.includes("z.object") && !content.includes("parse(")) {
          issues.push({ line: 1, note: "No Zod/validation before passing body to payment service" });
        }
      }
      return issues;
    },
    description: `The payment controller passes the raw request body directly to the payment service 
without any validation. This could allow malicious actors to manipulate payment amounts, currencies, 
or other sensitive fields.`,
    fix: "Add a Zod schema to validate payment requests before processing, checking amount, currency, and required fields.",
  },
  {
    id: "LHF-005",
    title: "Refresh token endpoint has no token validation",
    severity: "medium",
    type: "security",
    check: (content, filepath) => {
      if (!filepath.includes("authService") && !filepath.includes("authController")) return [];
      const matches = [];
      if (content.includes("export async function refreshToken")) {
        const body = content.slice(content.indexOf("export async function refreshToken"));
        if (!body.includes("verify") && !body.includes("validate")) {
          matches.push({ line: getLineNumber(content, content.indexOf("export async function refreshToken")) });
        }
      }
      return matches;
    },
    description: `The refresh token handler generates a new access token without validating the existing one. 
This means any request to the refresh endpoint returns a valid token, even without authentication.`,
    fix: "Require and validate the existing token before issuing a new one.",
  },
  {
    id: "LHF-006",
    title: "OAuth callback handler is an unimplemented stub",
    severity: "medium",
    type: "bug",
    check: (content, filepath) => {
      if (!filepath.includes("authController")) return [];
      const issues = [];
      if (content.includes('status: "callback-received"')) {
        issues.push({ line: getLineNumber(content, content.indexOf('status: "callback-received"')) });
      }
      return issues;
    },
    description: `The OAuth callback endpoint returns a hardcoded success response without actually 
processing the OAuth flow. This means social login (Google, GitHub, etc.) does not work at all.`,
    fix: "Implement proper OAuth token exchange, user lookup/creation, and session establishment.",
  },
  {
    id: "LHF-007",
    title: "Password minimum length of 8 without complexity requirements",
    severity: "low",
    type: "quality",
    check: (content, filepath) => {
      if (!filepath.includes("validators/auth")) return [];
      const match = content.match(/password:\s*z\.string\(\)\.min\((\d+)\)/);
      return match && parseInt(match[1]) < 10 ? [{ line: getLineNumber(content, match.index) }] : [];
    },
    description: `The password validator only requires 8 characters with no complexity requirements 
(upper/lower/number). While better than some defaults, common guidelines recommend at least 10+ 
characters or additional complexity for production applications.`,
    fix: "Increase minimum to 10 characters or add regex-based complexity requirements.",
  },
  {
    id: "LHF-008",
    title: "API rate limiter may be too permissive (200 req / 15 min)",
    severity: "low",
    type: "security",
    check: (content, filepath) => {
      if (!filepath.includes("rateLimit")) return [];
      const match = content.match(/limit:\s*(\d+)/);
      return match && parseInt(match[1]) >= 100 ? [{ line: getLineNumber(content, match.index) }] : [];
    },
    description: `The current rate limit of 200 requests per 15-minute window (~13 req/min per IP) 
may be too permissive for sensitive endpoints like login and payment. Brute-force attacks on 
authentication could succeed within the rate limit.`,
    fix: "Implement stricter rate limits for auth endpoints (e.g., 5 attempts per 15 min) or add exponential backoff.",
  },
];

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function scanFile(filepath) {
  const ext = extname(filepath);
  const allowed = [".js", ".ts", ".tsx", ".jsx", ".mjs"];
  if (!allowed.includes(ext)) return [];

  try {
    const content = readFileSync(filepath, "utf-8");
    const findings = [];

    for (const rule of RULES) {
      try {
        const matches = rule.check(content, filepath);
        for (const match of matches) {
          findings.push({
            ruleId: rule.id,
            title: rule.title,
            severity: rule.severity,
            type: rule.type,
            file: filepath.replace(REPO_ROOT, ""),
            line: match.line,
            note: match.note || null,
            description: rule.description.trim(),
            fix: rule.fix,
          });
        }
      } catch (e) {
        // Rule check failed - skip
      }
    }

    return findings;
  } catch (e) {
    return [];
  }
}

function walkDir(dir) {
  const files = [];
  const skip = ["node_modules", ".git", ".next", "dist", "build", "coverage"];
  try {
    for (const entry of readdirSync(dir)) {
      if (skip.includes(entry)) continue;
      const full = join(dir, entry);
      try {
        if (statSync(full).isDirectory()) {
          files.push(...walkDir(full));
        } else {
          files.push(full);
        }
      } catch (e) {}
    }
  } catch (e) {}
  return files;
}

function generateIssueBody(finding) {
  return `## Description

${finding.description}

## Affected File
\`${finding.file}\` (line ${finding.line})

## Severity
**${finding.severity.toUpperCase()}** — ${finding.type}

## Suggested Fix

${finding.fix}

---

*This issue was automatically detected by the Low Hanging Fruit scanner (PR from issue #${ISSUE_TEMPLATE_REF.split("#")[1]}).*
*This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${ISSUE_TEMPLATE_REF.split("#")[1]} for more information.*`;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const createIssues = args.includes("--create-issues");

  console.log("🔍 Scanning codebase for low-hanging-fruit bugs...\n");
  
  const files = walkDir(REPO_ROOT);
  const allFindings = [];

  for (const file of files) {
    const findings = scanFile(file);
    allFindings.push(...findings);
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  console.log(`Found ${allFindings.length} potential issues:\n`);

  for (const finding of allFindings) {
    const emoji = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[finding.severity];
    console.log(`${emoji} [${finding.ruleId}] ${finding.title}`);
    console.log(`   File: ${finding.file}:${finding.line}`);
    console.log(`   Severity: ${finding.severity} | Type: ${finding.type}`);
    console.log("");
  }

  if (createIssues) {
    console.log("---\nCreating GitHub issues...\n");
    for (const finding of allFindings) {
      const title = `[${finding.ruleId}] ${finding.title}`;
      const body = generateIssueBody(finding);
      const labels = [finding.severity, finding.type, "bounty", "💎 Bounty", "AI agent friendly"].join(",");

      if (!dryRun) {
        try {
          execSync(
            `gh issue create --repo ${GITHUB_REPO} --title "${title}" --body "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --label "${labels}"`,
            { stdio: "pipe" }
          );
          console.log(`✅ Created: ${title}`);
        } catch (e) {
          console.error(`❌ Failed: ${title} — ${e.message.slice(0, 100)}`);
        }
      } else {
        console.log(`[DRY RUN] Would create: ${title}`);
      }
    }
  }

  console.log("\n📊 Summary:");
  const bySeverity = {};
  for (const f of allFindings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  }
  for (const [sev, count] of Object.entries(bySeverity)) {
    console.log(`   ${sev}: ${count}`);
  }

  // Output JSON for programmatic use
  if (!createIssues) {
    console.log("\n--- JSON Output ---");
    console.log(JSON.stringify(allFindings, null, 2));
  }
}

main();
