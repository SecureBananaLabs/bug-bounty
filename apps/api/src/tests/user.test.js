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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid request payload");
    assert(payload.issues.some((issue) => issue.path === "email"));
    assert(payload.issues.some((issue) => issue.path === "fullName"));
  });
});

test("POST /api/users rejects client-controlled ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "usr_attacker",
        email: "ada@example.com",
        fullName: "Ada Lovelace",
        role: "client"
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert(payload.issues.some((issue) => issue.path === ""));
  });
});

test("POST /api/users creates a user with a server-owned id", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "grace@example.com",
        fullName: "Grace Hopper",
        role: "freelancer"
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.match(payload.data.id, /^usr_/);
    assert.equal(payload.data.email, "grace@example.com");
    assert.equal(payload.data.fullName, "Grace Hopper");
    assert.equal(payload.data.role, "freelancer");
  });
});
