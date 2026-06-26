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
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users does not echo password fields", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "s3cret"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "alice@example.com");
    assert.equal("password" in payload.data, false);
  });
});

test("GET /api/users omits stored password fields", async () => {
  await withServer(async (port) => {
    await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "bob@example.com",
        password: "another-secret"
      })
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data.some((user) => user.email === "bob@example.com"));
    assert.ok(payload.data.every((user) => !("password" in user)));
  });
});
