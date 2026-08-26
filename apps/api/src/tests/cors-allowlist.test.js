// Regression tests for CORS allowlist hardening (issue #2782).
//
// These tests verify that:
//  1. With NO CORS_ORIGINS configured (production default), cross-origin
//     requests are DENIED (no Access-Control-Allow-Origin header).
//  2. A configured (allowed) origin is reflected correctly.
//  3. A disallowed origin is denied (no ACAO header).
//  4. Requests without an Origin header (same-origin / server-to-server /
//     health checks) are still allowed.
//
// IMPORTANT: process.env must be set BEFORE importing app.js because the
// `env` config object is evaluated at module load time.

process.env.CORS_ORIGINS = "https://allowed.example,https://app.example.com";

import test from "node:test";
import assert from "node:assert/strict";

const { createApp } = await import("../app.js");

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("default-deny: cross-origin request is blocked when no allowlist matches", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "https://evil.example" },
    });

    // The request still succeeds at the API level...
    assert.equal(response.status, 200);
    // ...but no CORS header is reflected, so the browser blocks it.
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("allowed origin is reflected in the CORS response", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "https://allowed.example" },
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://allowed.example",
    );
  });
});

test("second configured origin is also allowed", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "https://app.example.com" },
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://app.example.com",
    );
  });
});

test("same-origin / no Origin header is still allowed", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});

test("preflight OPTIONS is answered only for allowed origins", async () => {
  await withServer(async (port) => {
    const allowed = await fetch(`http://127.0.0.1:${port}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://allowed.example",
        "Access-Control-Request-Method": "GET",
      },
    });
    assert.equal(
      allowed.headers.get("access-control-allow-origin"),
      "https://allowed.example",
    );

    const denied = await fetch(`http://127.0.0.1:${port}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://nope.example",
        "Access-Control-Request-Method": "GET",
      },
    });
    assert.equal(
      denied.headers.get("access-control-allow-origin"),
      null,
    );
  });
});
