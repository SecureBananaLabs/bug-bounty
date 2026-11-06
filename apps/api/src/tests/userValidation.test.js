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
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUser(baseUrl, body) {
  return fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/users rejects invalid user payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      email: "not-an-email",
      fullName: ""
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid user payload"
    });
  });
});

test("POST /api/users rejects unknown fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      email: "user@example.com",
      fullName: "User Example",
      adminNotes: "should not persist"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/users creates valid users with default role", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      email: "valid@example.com",
      fullName: "Valid User"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_/);
    assert.equal(payload.data.email, "valid@example.com");
    assert.equal(payload.data.fullName, "Valid User");
    assert.equal(payload.data.role, "client");
    assert.equal("adminNotes" in payload.data, false);
  });
});
