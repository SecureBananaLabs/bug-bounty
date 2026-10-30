import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("login returns the identity fields the token claims", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ana@example.test", password: "super-secret" })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.email, "ana@example.test");
    assert.ok(body.data.id.startsWith("usr_"));
    assert.ok(typeof body.data.role === "string" && body.data.role.length > 0);

    const claims = verifyAccessToken(body.data.token);
    assert.equal(claims.sub, body.data.id);
    assert.equal(claims.role, body.data.role);
  } finally {
    await close(server);
  }
});
