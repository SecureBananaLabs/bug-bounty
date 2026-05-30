#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

const ROOT = join(import.meta.dirname, "..");
const REPO = "SecureBananaLabs/bug-bounty";
const REF_ISSUE = 743;
const DRY_RUN = process.argv.includes("--dry-run");

function walk(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".git" || entry === ".next") continue;
      results = results.concat(walk(full));
    } else if (/\.(js|ts|tsx)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

const detectors = [
  {
    id: "missing-zod-validation",
    title: "API controllers missing Zod input validation",
    severity: "medium",
    detect() {
      const routesDir = join(ROOT, "apps/api/src/routes");
      const controllersDir = join(ROOT, "apps/api/src/controllers");
      const validatorsDir = join(ROOT, "apps/api/src/validators");
      const existingValidators = new Set(
        walk(validatorsDir).map((f) => f.replace(/.*\/validators\//, "").replace(/\.js$/, ""))
      );

      const findings = [];
      for (const routeFile of walk(routesDir)) {
        const content = readFileSync(routeFile, "utf8");
        const routeRel = relative(ROOT, routeFile);
        const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*"\.(\.\/)?controllers\/([^"]+)"/);
        if (!importMatch) continue;
        const fns = importMatch[1].split(",").map((s) => s.trim());
        const controllerName = importMatch[3].replace(/\.js$/, "");
        const validatorFile = controllerName.replace("Controller", "").replace("Controller", "");
        if (!existingValidators.has(validatorFile) && !existingValidators.has(controllerName.replace("Controller", ""))) {
          for (const fn of fns) {
            if (fn.startsWith("post") || fn.startsWith("create") || fn.startsWith("put") || fn.startsWith("patch")) {
              findings.push({
                file: routeRel,
                detail: `POST handler \`${fn}\` in \`${controllerName}\` has no Zod validation schema`,
              });
            }
          }
        }
      }
      return findings;
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## Missing Zod Validation on API Endpoints\n\nSeveral API POST controllers accept raw \`req.body\` without Zod validation, allowing malformed or malicious data through.\n\n### Affected Endpoints\n\n${list}\n\n### Fix\n\nCreate matching Zod schemas in \`apps/api/src/validators/\` and call \`.parse(req.body)\` in each controller, following the pattern already used in \`validators/auth.js\` and \`validators/job.js\`.\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "unauthenticated-routes",
    title: "Sensitive API routes lack authentication middleware",
    severity: "high",
    detect() {
      const routesDir = join(ROOT, "apps/api/src/routes");
      const protectedRoutes = new Set(["adminRoutes.js"]);
      const findings = [];
      for (const routeFile of walk(routesDir)) {
        const content = readFileSync(routeFile, "utf8");
        const routeRel = relative(ROOT, routeFile);
        const hasAuth = content.includes("authMiddleware") || content.includes("auth(");
        const fileName = routeFile.split("/").pop();
        if (!hasAuth && !protectedRoutes.has(fileName) && fileName !== "authRoutes.js") {
          const methods = [...content.matchAll(/\.(get|post|put|patch|delete)\s*\(/g)].map((m) => m[1].toUpperCase());
          if (methods.length > 0) {
            findings.push({
              file: routeRel,
              detail: `Route file \`${fileName}\` exposes ${methods.join(", ")} endpoints without any authentication middleware`,
            });
          }
        }
      }
      return findings;
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## Sensitive API Routes Lack Authentication Middleware\n\nMost API routes (jobs, proposals, payments, reviews, messages, notifications, uploads, search, users) are publicly accessible without authentication. Only the admin route currently requires a Bearer token.\n\n### Affected Routes\n\n${list}\n\n### Fix\n\nApply \`authMiddleware\` from \`middleware/auth.js\` to all mutating routes (POST, PUT, PATCH, DELETE) and to any GET route that exposes user-specific data. Follow the pattern in \`routes/adminRoutes.js\`.\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "date-now-id-collision",
    title: "In-memory service IDs use Date.now() causing potential collisions",
    severity: "medium",
    detect() {
      const servicesDir = join(ROOT, "apps/api/src/services");
      const findings = [];
      for (const serviceFile of walk(servicesDir)) {
        const content = readFileSync(serviceFile, "utf8");
        const serviceRel = relative(ROOT, serviceFile);
        if (content.includes("Date.now()") && content.includes("id:")) {
          findings.push({
            file: serviceRel,
            detail: `Uses \`Date.now()\` for ID generation which can collide under concurrent requests`,
          });
        }
      }
      return findings;
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## In-Memory Service IDs Use Date.now() Causing Potential Collisions\n\nMultiple service modules generate IDs using \`Date.now()\`. Under concurrent requests or rapid sequential calls, these IDs can collide since \`Date.now()\` has millisecond resolution.\n\n### Affected Services\n\n${list}\n\n### Fix\n\nReplace \`Date.now()\` ID generation with \`crypto.randomUUID()\` or a monotonic counter to guarantee uniqueness. Example:\n\`\`\`js\nimport { randomUUID } from "crypto";\nconst id = \`job_\${randomUUID()}\`;\n\`\`\`\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "plaintext-password-storage",
    title: "Auth service stores passwords in plaintext",
    severity: "high",
    detect() {
      const content = read("apps/api/src/services/authService.js");
      if (content.includes("registerUser") && !content.includes("bcrypt") && !content.includes("argon") && !content.includes("scrypt") && !content.includes("hashSync") && !content.includes("createHash")) {
        return [{ file: "apps/api/src/services/authService.js", detail: "`registerUser` stores passwords without hashing — passwords are persisted in plaintext" }];
      }
      return [];
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## Auth Service Stores Passwords in Plaintext\n\nThe \`registerUser\` function in \`authService.js\` stores passwords without any hashing. This is a critical security vulnerability — if the database is ever compromised, all user passwords would be immediately exposed.\n\n### Affected Code\n\n${list}\n\n### Fix\n\nHash passwords before storage using bcrypt or argon2:\n\`\`\`js\nimport bcrypt from "bcryptjs";\nconst hashed = await bcrypt.hash(payload.password, 12);\n\`\`\`\nAnd verify with \`bcrypt.compare\` in the login flow.\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "refresh-token-no-session",
    title: "Refresh token endpoint does not validate existing session",
    severity: "medium",
    detect() {
      const content = read("apps/api/src/services/authService.js");
      if (content.includes("refreshToken") && !content.includes("jwt.verify") && !content.includes("verifyRefresh") && content.includes('sub: "usr_existing"')) {
        return [{ file: "apps/api/src/services/authService.js", detail: "`refreshToken()` issues a new token without validating any existing refresh token or session" }];
      }
      return [];
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## Refresh Token Endpoint Does Not Validate Existing Session\n\nThe \`POST /api/auth/refresh\` endpoint issues a new access token without verifying any existing refresh token. It hardcodes \`sub: "usr_existing"\` instead of validating the provided refresh token. This allows any unauthenticated caller to obtain a valid JWT.\n\n### Affected Code\n\n${list}\n\n### Fix\n\nAccept a refresh token in the request body, verify it (using a separate refresh secret or database lookup), and extract the user identity to sign a new access token.\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "no-pagination-list-endpoints",
    title: "List endpoints lack pagination support",
    severity: "medium",
    detect() {
      const servicesDir = join(ROOT, "apps/api/src/services");
      const findings = [];
      for (const serviceFile of walk(servicesDir)) {
        const content = readFileSync(serviceFile, "utf8");
        const serviceRel = relative(ROOT, serviceFile);
        if (content.includes("async function list") && !content.includes("skip") && !content.includes("limit") && !content.includes("page") && !content.includes("offset")) {
          findings.push({
            file: serviceRel,
            detail: `\`list*\` function returns all records with no pagination support`,
          });
        }
      }
      return findings;
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## List Endpoints Lack Pagination Support\n\nAll list endpoints in the API return the complete in-memory array with no pagination. As the dataset grows, these endpoints will return unbounded responses causing performance degradation and potential DoS.\n\n### Affected Services\n\n${list}\n\n### Fix\n\nAdd \`page\` and \`limit\` query parameters to all list endpoints. Slice the result array accordingly and return metadata (total, page, totalPages) alongside the data.\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "oauth-provider-validation",
    title: "OAuth callback does not validate provider parameter",
    severity: "medium",
    detect() {
      const content = read("apps/api/src/controllers/authController.js");
      if (content.includes("oauthCallback") && content.includes("req.params.provider") && !content.includes("allowedProviders") && !content.includes("enum")) {
        return [{ file: "apps/api/src/controllers/authController.js", detail: "`oauthCallback` accepts any string as `provider` without validation (e.g. `provider=../../../etc/passwd`)" }];
      }
      return [];
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## OAuth Callback Does Not Validate Provider Parameter\n\nThe \`GET /api/auth/oauth/:provider/callback\` endpoint passes \`req.params.provider\` directly into the response without validating it against a whitelist of supported providers. This could allow path traversal or injection in downstream integrations.\n\n### Affected Code\n\n${list}\n\n### Fix\n\nValidate the provider parameter against a whitelist:\n\`\`\`js\nconst ALLOWED_PROVIDERS = ["github", "google", "linkedin"];\nif (!ALLOWED_PROVIDERS.includes(req.params.provider)) {\n  return fail(res, "Unsupported OAuth provider", 400);\n}\n\`\`\`\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "stub-frontend-pages",
    title: "Frontend pages are placeholder stubs with no real functionality",
    severity: "low",
    detect() {
      const pagesDir = join(ROOT, "apps/web/app");
      const findings = [];
      for (const pageFile of walk(pagesDir)) {
        const content = readFileSync(pageFile, "utf8");
        const pageRel = relative(ROOT, pageFile);
        if (content.includes("export default function") && !content.includes("fetch(") && !content.includes("use") && !content.includes("useState") && !content.includes("useEffect") && (content.includes("would be shown here") || content.includes("are represented here") || content.includes("are managed here") || content.includes("are available here") || content.includes("appear in this feed") || content.includes("and security controls"))) {
          findings.push({
            file: pageRel,
            detail: `Page is a static stub with placeholder text and no interactive functionality`,
          });
        }
      }
      return findings;
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## Frontend Pages Are Placeholder Stubs\n\nSeveral pages in the web app are placeholder stubs with static text and no real functionality. They need to be wired to the API and given interactive UI.\n\n### Affected Pages\n\n${list}\n\n### Fix\n\nImplement real functionality for each page: fetch data from the API, add interactive forms, handle loading/error states, and connect to the backend services.\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "missing-nav-links",
    title: "Navigation component missing links to Billing, Notifications, and Settings",
    severity: "low",
    detect() {
      const content = read("apps/web/components/Navigation.tsx");
      const missing = [];
      if (!content.includes("/billing")) missing.push("Billing");
      if (!content.includes("/notifications")) missing.push("Notifications");
      if (!content.includes("/settings")) missing.push("Settings");
      if (missing.length > 0) {
        return [{ file: "apps/web/components/Navigation.tsx", detail: `Missing nav links for: ${missing.join(", ")}` }];
      }
      return [];
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## Navigation Component Missing Links to Key Pages\n\nThe \`Navigation.tsx\` component does not include links to Billing (\`/billing\`), Notifications (\`/notifications\`), or Settings (\`/settings\`), even though corresponding page routes exist in the app. Users cannot discover these pages through the navigation.\n\n### Affected Component\n\n${list}\n\n### Fix\n\nAdd the missing routes to the \`links\` array in \`Navigation.tsx\`:\n\`\`\`tsx\n["/billing", "Billing"],\n["/notifications", "Notifications"],\n["/settings", "Settings"],\n\`\`\`\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
  {
    id: "search-service-stub",
    title: "Search service returns empty results for all queries",
    severity: "medium",
    detect() {
      const content = read("apps/api/src/services/searchService.js");
      if (content.includes("TODO") && content.includes("users: []") && content.includes("jobs: []")) {
        return [{ file: "apps/api/src/services/searchService.js", detail: "`globalSearch()` is a stub that always returns empty arrays regardless of query" }];
      }
      return [];
    },
    body(findings) {
      const list = findings.map((f) => `- \`${f.file}\`: ${f.detail}`).join("\n");
      return `## Search Service Returns Empty Results for All Queries\n\nThe \`globalSearch()\` function in \`searchService.js\` is a stub that always returns empty arrays for users, jobs, and freelancers, regardless of the search query. The \`GET /api/search?q=...\` endpoint is non-functional.\n\n### Affected Code\n\n${list}\n\n### Fix\n\nImplement search by filtering the in-memory data stores (or later, using PostgreSQL full-text search). At minimum, perform case-insensitive substring matching against job titles, user names, and freelancer skills.\n\n---\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #${REF_ISSUE} for more information.`;
    },
  },
];

console.log(`\n🔍 Low Hanging Fruit Scanner — FreelanceFlow Monorepo\n`);

const allResults = [];

for (const detector of detectors) {
  const findings = detector.detect();
  if (findings.length > 0) {
    console.log(`✓ [${detector.severity.toUpperCase()}] ${detector.title} (${findings.length} finding${findings.length > 1 ? "s" : ""})`);
    for (const f of findings) {
      console.log(`  → ${f.detail}`);
    }
    allResults.push({ detector, findings });
  } else {
    console.log(`✗ [SKIP] ${detector.title} — no findings`);
  }
}

console.log(`\n📊 Total: ${allResults.length} issue${allResults.length !== 1 ? "s" : ""} detected\n`);

if (DRY_RUN) {
  console.log("🏁 Dry run — skipping GitHub issue creation\n");
  for (const { detector, findings } of allResults) {
    console.log(`--- ${detector.title} ---`);
    console.log(detector.body(findings));
    console.log("");
  }
  process.exit(0);
}

for (const { detector, findings } of allResults) {
  const title = `[${detector.severity.toUpperCase()}] ${detector.title}`;
  const body = detector.body(findings);

  console.log(`Creating issue: ${title}`);

  const tmpFile = `/tmp/lint-fruit-issue-${detector.id}.md`;
  const { writeFileSync } = await import("fs");
  writeFileSync(tmpFile, body);

  try {
    const result = execSync(
      `gh issue create --repo ${REPO} --title ${JSON.stringify(title)} --body-file ${tmpFile} --json number --jq '.number'`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const issueNumber = result.trim();
    console.log(`  → Created #${issueNumber}`);
  } catch (err) {
    console.error(`  ✗ Failed to create issue: ${err.message}`);
  }
}

console.log("\n🏁 Done — all low hanging fruit issues created\n");
