import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/admin/metrics rejects an unauthenticated request", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/admin/metrics`);
    assert.equal(response.status, 401);
  });
});

test("GET /api/admin/metrics rejects a non-admin role", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });

    const response = await fetch(`${base}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 403);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("GET /api/admin/metrics serves an admin token", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });

    const response = await fetch(`${base}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
  });
});

test("a token obtained through registration is judged by its role", async () => {
  await withServer(async (base) => {
    const registration = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123", role: "admin" })
    });

    assert.equal(registration.status, 201);
    const registered = await registration.json();

    const response = await fetch(`${base}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${registered.data.token}` }
    });

    assert.equal(response.status, 200);
  });
});
