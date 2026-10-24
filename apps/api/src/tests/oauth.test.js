import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let baseUrl;

beforeEach(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
  }
});

const validProviders = ["google", "github", "discord", "apple"];
for (const provider of validProviders) {
  test(`GET /api/auth/oauth/${provider}/callback returns HTTP 200 with callback-received payload`, async () => {
    const res = await fetch(`${baseUrl}/api/auth/oauth/${provider}/callback`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.deepEqual(data, {
      success: true,
      data: {
        provider,
        status: "callback-received"
      }
    });
  });
}

const unsupportedProviders = ["facebook", "twitter", "unknown"];
for (const provider of unsupportedProviders) {
  test(`GET /api/auth/oauth/${provider}/callback returns HTTP 400 for unsupported provider`, async () => {
    const res = await fetch(`${baseUrl}/api/auth/oauth/${provider}/callback`);
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.message === "Unsupported OAuth provider"));
  });
}

const malformedProviders = [
  encodeURIComponent("<script>alert(1)</script>"),
  encodeURIComponent("../../etc/passwd"),
  encodeURIComponent("injection' OR 1=1--")
];
for (const provider of malformedProviders) {
  test(`GET /api/auth/oauth/${provider}/callback returns HTTP 400 for malformed/injection provider param`, async () => {
    const res = await fetch(`${baseUrl}/api/auth/oauth/${provider}/callback`);
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.message === "Unsupported OAuth provider"));
  });
}
