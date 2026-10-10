import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { contentSecurityPolicy } from "../config/security.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
}

test("helmet is configured with an explicit restrictive CSP", () => {
  assert.equal(contentSecurityPolicy.useDefaults, false);
  assert.deepEqual(contentSecurityPolicy.directives.defaultSrc, ["'none'"]);
});

test("responses carry the explicit content-security-policy header", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`);
    const csp = response.headers.get("content-security-policy");

    assert.equal(response.status, 200);
    assert.ok(csp, "content-security-policy header must be present");
    assert.match(csp, /default-src 'none'/);
    assert.doesNotMatch(csp, /upgrade-insecure-requests/);
  });
});
