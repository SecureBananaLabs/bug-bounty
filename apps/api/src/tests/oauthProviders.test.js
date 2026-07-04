import test from "node:test";
import assert from "node:assert/strict";

test("GET /api/auth/oauth/:provider/callback provider validation", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("accepts google provider", async () => {
    const res = await fetch(`${baseUrl}/api/auth/oauth/google/callback`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.provider, "google");
  });

  await t.test("accepts github provider", async () => {
    const res = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.provider, "github");
  });

  await t.test("rejects unsupported provider with status 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/oauth/unsupported/callback`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unsupported OAuth provider");
  });
});
