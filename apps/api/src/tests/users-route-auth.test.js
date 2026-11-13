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

test("POST /api/users rejects an unauthenticated request", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "new@example.com", role: "client" })
    });

    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("POST /api/users still creates a user for an authenticated caller", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_123", role: "client" });

    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email: "new@example.com", role: "client" })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "new@example.com");
  });
});

test("GET /api/users stays public", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`);
    assert.equal(response.status, 200);
  });
});
