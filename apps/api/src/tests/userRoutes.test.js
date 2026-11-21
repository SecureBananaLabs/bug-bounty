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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("POST /api/users rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "attacker@example.com" })
    });

    assert.equal(response.status, 401);
  });
});

test("POST /api/users rejects requests with an invalid token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer not-a-real-token"
      },
      body: JSON.stringify({ email: "attacker@example.com" })
    });

    assert.equal(response.status, 401);
  });
});

test("POST /api/users accepts authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "user_1" });
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email: "new-user@example.com" })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "new-user@example.com");
  });
});
