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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/auth/register defaults public registrations to client role", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(`${baseUrl}/api/auth/register`, {
      email: "client@example.com",
      password: "password123"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "client");

    const token = verifyAccessToken(payload.data.token);
    assert.equal(token.role, "client");
  });
});

test("POST /api/auth/register allows freelancer public registrations", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(`${baseUrl}/api/auth/register`, {
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "freelancer");

    const token = verifyAccessToken(payload.data.token);
    assert.equal(token.role, "freelancer");
  });
});

test("POST /api/auth/register rejects admin self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(`${baseUrl}/api/auth/register`, {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid registration payload");
  });
});
