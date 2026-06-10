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

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "attacker@example.com",
        role: "admin",
        password: "supersecret123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/users allows authenticated requests", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "new.user@example.com",
        role: "client",
        password: "supersecret123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.id, "string");
    assert.equal(payload.data.email, "new.user@example.com");
    assert.equal(payload.data.role, "client");
    assert.equal(payload.data.password, "supersecret123");
  });
});
