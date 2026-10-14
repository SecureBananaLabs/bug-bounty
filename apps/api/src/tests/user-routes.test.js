import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const userPayload = {
  email: "worker@example.com",
  role: "client"
};

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
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/users rejects unauthenticated requests", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("GET /api/users succeeds for authenticated requests", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(Array.isArray(payload.data), true);
  });
});

test("POST /api/users remains public", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(userPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, userPayload.email);
  });
});
