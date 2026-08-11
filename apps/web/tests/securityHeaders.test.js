import test from "node:test";
import assert from "node:assert/strict";

/**
 * Verify that the next.config.js defines all required security headers.
 * Reads the config module and validates the header structure.
 */
test("next.config.js defines security headers for all routes", async () => {
  const config = (await import("../next.config.js")).default;

  // If config has a default wrapper (ESM interop), unwrap it
  const cfg = config.default ?? config;

  assert.ok(cfg, "next.config.js should export a config object");
  assert.ok(
    typeof cfg.headers === "function",
    "config should define an async headers() function"
  );

  const headerRules = await cfg.headers();
  assert.ok(Array.isArray(headerRules), "headers() should return an array");
  assert.ok(headerRules.length >= 1, "headers() should return at least one rule");

  // First rule should apply to all routes
  const allRoutes = headerRules[0];
  assert.equal(allRoutes.source, "/(.*)", "first rule source should match all routes");

  const headers = allRoutes.headers;
  assert.ok(Array.isArray(headers), "rule headers should be an array");

  const expectedHeaders = [
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ];

  const definedKeys = new Set(headers.map((h) => h.key));
  for (const key of expectedHeaders) {
    assert.ok(
      definedKeys.has(key),
      `expected header "${key}" to be defined in headers config`
    );
  }

  // Verify specific header values
  const csp = headers.find((h) => h.key === "Content-Security-Policy");
  assert.ok(csp, "Content-Security-Policy header must exist");
  assert.ok(
    csp.value.includes("default-src 'self'"),
    "CSP must include default-src 'self'"
  );
  assert.ok(
    csp.value.includes("frame-ancestors 'none'"),
    "CSP must include frame-ancestors 'none' (clickjacking protection)"
  );

  const xfo = headers.find((h) => h.key === "X-Frame-Options");
  assert.equal(xfo.value, "DENY", "X-Frame-Options must be DENY");

  const contentType = headers.find((h) => h.key === "X-Content-Type-Options");
  assert.equal(contentType.value, "nosniff", "X-Content-Type-Options must be nosniff");
});
