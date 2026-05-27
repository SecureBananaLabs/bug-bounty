import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "../app.js";

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

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function uniqueEmail(prefix) {
  return `${prefix}-${randomUUID()}@example.com`;
}

test("POST /api/auth/login rejects syntactically valid unknown users", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/login", {
      email: uniqueEmail("unknown"),
      password: "not-the-password"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid email or password"
    });
  });
});

test("POST /api/auth/login rejects wrong passwords for registered users", async () => {
  await withServer(async (baseUrl) => {
    const email = uniqueEmail("registered-wrong-password");
    await postJson(baseUrl, "/api/auth/register", {
      email,
      password: "correct-password",
      role: "client"
    });

    const response = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "wrong-password"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid email or password");
  });
});

test("POST /api/auth/login issues a token only for registered credentials", async () => {
  await withServer(async (baseUrl) => {
    const email = uniqueEmail("registered-valid");
    await postJson(baseUrl, "/api/auth/register", {
      email,
      password: "correct-password",
      role: "freelancer"
    });

    const response = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "correct-password"
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, email);
    assert.equal(typeof payload.data.token, "string");
    assert.ok(payload.data.token.length > 20);
  });
});
