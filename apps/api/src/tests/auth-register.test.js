import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

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
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("registerUser signs tokens with the returned user id", async () => {
  const result = await registerUser({
    email: "new-user@example.com",
    password: "supersecret",
    role: "client"
  });
  const claims = verifyAccessToken(result.token);

  assert.equal(claims.sub, result.id);
  assert.equal(claims.role, "client");
});

test("POST /api/auth/register returns a token for the returned user id", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "new-user@example.com",
        password: "supersecret",
        role: "freelancer"
      })
    });
    const payload = await response.json();
    const claims = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(claims.sub, payload.data.id);
    assert.equal(claims.role, "freelancer");
  });
});
