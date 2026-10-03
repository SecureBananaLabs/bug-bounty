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
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects invalid emails", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "not-an-email", role: "client" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users accepts valid direct user creation", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "person@example.com", role: "freelancer" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "person@example.com");
    assert.equal(payload.data.role, "freelancer");
  });
});
