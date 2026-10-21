import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("CORS origin allowlist and error preservation suite", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Allowed origin receives CORS headers and status 200
    const allowedRes = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "http://localhost:3000" }
    });
    assert.equal(allowedRes.status, 200);
    assert.equal(allowedRes.headers.get("access-control-allow-origin"), "http://localhost:3000");
    const allowedBody = await allowedRes.json();
    assert.deepEqual(allowedBody, { ok: true, service: "api" });

    // 2. Request with no Origin header succeeds (server-to-server / curl)
    const noOriginRes = await fetch(`${baseUrl}/health`);
    assert.equal(noOriginRes.status, 200);
    const noOriginBody = await noOriginRes.json();
    assert.deepEqual(noOriginBody, { ok: true, service: "api" });

    // 3. Unauthorized origin is rejected with HTTP 403 Forbidden
    const blockedRes = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "http://malicious-site.com" }
    });
    assert.equal(blockedRes.status, 403);
    const blockedBody = await blockedRes.json();
    assert.deepEqual(blockedBody, {
      success: false,
      message: "Not allowed by CORS"
    });

    // 4. Preflight OPTIONS request for allowed origin
    const preflightRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST"
      }
    });
    assert.equal(preflightRes.headers.get("access-control-allow-origin"), "http://localhost:3000");
  } finally {
    await new Promise((resolve, reject) => {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
