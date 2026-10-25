import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextConfig = require("../next.config.js");

test("next config sets baseline browser security headers", async () => {
  assert.equal(typeof nextConfig.headers, "function");

  const routes = await nextConfig.headers();
  const rootRoute = routes.find((entry) => entry.source === "/:path*");

  assert.ok(rootRoute, "expected a global header rule at '/:path*'");

  const headerMap = Object.fromEntries(
    rootRoute.headers.map((header) => [header.key, header.value]),
  );

  assert.equal(
    headerMap["Content-Security-Policy"],
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'",
  );
  assert.equal(headerMap["X-Frame-Options"], "DENY");
  assert.equal(headerMap["X-Content-Type-Options"], "nosniff");
  assert.equal(
    headerMap["Referrer-Policy"],
    "strict-origin-when-cross-origin",
  );
});
