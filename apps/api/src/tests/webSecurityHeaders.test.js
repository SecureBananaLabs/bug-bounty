import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const root = new URL("../../../../", import.meta.url);
const configPath = fileURLToPath(new URL("apps/web/next.config.js", root));
const nextConfig = require(configPath);

function headerMap(entries) {
  return Object.fromEntries(entries.map((entry) => [entry.key, entry.value]));
}

test("web config emits baseline security headers on every route", async () => {
  assert.equal(typeof nextConfig.headers, "function");

  const rules = await nextConfig.headers();
  assert.equal(rules.length, 1);

  const rule = rules[0];
  assert.equal(rule.source, "/:path*");

  const headers = headerMap(rule.headers);
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
});
