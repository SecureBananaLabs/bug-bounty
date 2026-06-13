import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

async function postUser(baseUrl, payload) {
  return fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/users rejects invalid user payloads", async () => {
  await withServer(async (baseUrl) => {
    const invalidEmail = await postUser(baseUrl, {
      email: "not-an-email",
      password: "strong-password",
      role: "client"
    });
    assert.equal(invalidEmail.status, 400);
    assert.deepEqual(await invalidEmail.json(), {
      success: false,
      message: "Invalid user payload"
    });

    const adminRole = await postUser(baseUrl, {
      email: "admin@example.com",
      password: "strong-password",
      role: "admin"
    });
    assert.equal(adminRole.status, 400);
  });
});

test("POST /api/users validates and strips caller-controlled reserved fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      id: "usr_attacker",
      status: "suspended",
      email: "freelancer@example.com",
      password: "strong-password",
      role: "freelancer",
      name: "Freelance Builder",
      skills: ["node"],
      hourlyRate: 75
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_\d+$/);
    assert.notEqual(payload.data.id, "usr_attacker");
    assert.equal(payload.data.status, undefined);
    assert.equal(payload.data.role, "freelancer");
  });
});
