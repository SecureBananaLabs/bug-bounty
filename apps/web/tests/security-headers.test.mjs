import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const nextConfig = require("../next.config.js");

test("applies baseline security headers to every frontend route", async () => {
  const routes = await nextConfig.headers();

  assert.equal(routes.length, 1);
  assert.equal(routes[0].source, "/(.*)");

  const headers = Object.fromEntries(
    routes[0].headers.map(({ key, value }) => [key, value])
  );

  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
  assert.match(headers["Content-Security-Policy"], /default-src 'self'/);
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
});
