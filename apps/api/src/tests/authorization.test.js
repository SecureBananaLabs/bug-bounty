import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("public registration cannot create an administrator token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "attacker@example.com",
        password: "correct-horse-battery-staple",
        role: "admin"
      })
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Invalid registration data"
    });
  });
});

test("admin metrics require an administrator token", async () => {
  await withServer(async (baseUrl) => {
    const clientToken = signAccessToken({ sub: "client-1", role: "client" });
    const denied = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` }
    });

    assert.equal(denied.status, 403);
    assert.deepEqual(await denied.json(), {
      success: false,
      message: "Forbidden"
    });

    const adminToken = signAccessToken({ sub: "admin-1", role: "admin" });
    const allowed = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${adminToken}` }
    });

    assert.equal(allowed.status, 200);
  });
});
