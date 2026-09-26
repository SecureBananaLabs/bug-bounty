import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createUser } from "../services/userService.js";

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

test("createUser keeps server-generated ids", async () => {
  const user = await createUser({
    id: "usr_client_supplied",
    email: "service@example.com",
    role: "client"
  });

  assert.match(user.id, /^usr_/);
  assert.notEqual(user.id, "usr_client_supplied");
});

test("POST /api/users rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Valid email is required"
    });
  });
});

test("POST /api/users rejects invalid roles", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        role: "owner"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid role"
    });
  });
});

test("POST /api/users defaults role and ignores client ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "usr_client_supplied",
        email: "user@example.com"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "user@example.com");
    assert.equal(payload.data.role, "client");
    assert.match(payload.data.id, /^usr_/);
    assert.notEqual(payload.data.id, "usr_client_supplied");
  });
});
