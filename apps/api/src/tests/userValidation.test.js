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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects invalid payloads and unknown fields", async () => {
  await withServer(async (port) => {
    const invalidPayloads = [
      {
        email: "not-an-email",
        fullName: "Alice Example",
        role: "client"
      },
      {
        email: "alice@example.com",
        fullName: "Alice Example",
        role: "client",
        isAdmin: true
      }
    ];

    for (const payload of invalidPayloads) {
      const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.success, false);
    }
  });
});

test("POST /api/users accepts valid payloads and does not persist extra fields", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        fullName: "Alice Example"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "alice@example.com");
    assert.equal(payload.data.fullName, "Alice Example");
    assert.equal(payload.data.role, "client");
    assert.equal("isAdmin" in payload.data, false);
    assert.match(payload.data.id, /^usr_/);
  });
});
