import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users validates and whitelists account fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "valid-user@example.com",
        fullName: "Valid User",
        password: "should-never-be-stored",
        unexpected: "discarded"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.email, "valid-user@example.com");
    assert.equal(payload.data.fullName, "Valid User");
    assert.equal(payload.data.role, "client");
    assert.equal("password" in payload.data, false);
    assert.equal("unexpected" in payload.data, false);
  });
});

test("POST /api/users rejects malformed payloads before persistence", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "secret" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid user payload");
    assert.ok(payload.errors.email);
    assert.ok(payload.errors.fullName);
  });
});
