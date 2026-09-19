import { scenarios } from "./scenarios.mjs";

const expected = [
  "GET /health",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/auth/oauth/github/callback",
  "POST /api/auth/refresh",
  "GET /api/users",
  "POST /api/users",
  "GET /api/jobs",
  "POST /api/jobs",
  "GET /api/proposals",
  "POST /api/proposals",
  "POST /api/payments",
  "GET /api/reviews",
  "POST /api/reviews",
  "GET /api/messages",
  "POST /api/messages",
  "GET /api/notifications",
  "POST /api/notifications",
  "POST /api/uploads",
  "GET /api/search?q=react",
  "GET /api/admin/metrics"
];

const actual = scenarios.map((scenario) => `${scenario.method} ${scenario.path}`);
const missing = expected.filter((route) => !actual.includes(route));
const extra = actual.filter((route) => !expected.includes(route));
const duplicates = actual.filter((route, idx) => actual.indexOf(route) !== idx);

if (missing.length || extra.length || duplicates.length) {
  console.error("Benchmark scenario coverage mismatch");
  if (missing.length) console.error("Missing:", missing.join(", "));
  if (extra.length) console.error("Extra:", extra.join(", "));
  if (duplicates.length) console.error("Duplicates:", duplicates.join(", "));
  process.exit(1);
}

console.log(`Benchmark coverage verified: ${actual.length} endpoints/scenarios`);
