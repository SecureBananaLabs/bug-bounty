import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

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

async function register(base, body) {
  const response = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("registration rejects a self-assigned admin role", async () => {
  await withServer(async (base) => {
    const { response, payload } = await register(base, {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("registration still accepts a freelancer role", async () => {
  await withServer(async (base) => {
    const { response, payload } = await register(base, {
      email: "free@example.com",
      password: "password123",
      role: "freelancer"
    });

    assert.equal(response.status, 201);
    assert.equal(verifyAccessToken(payload.data.token).role, "freelancer");
  });
});

test("registration defaults an omitted role to client", async () => {
  await withServer(async (base) => {
    const { response, payload } = await register(base, {
      email: "client@example.com",
      password: "password123"
    });

    assert.equal(response.status, 201);
    assert.equal(verifyAccessToken(payload.data.token).role, "client");
  });
});
