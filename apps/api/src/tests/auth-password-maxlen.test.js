import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function createLongPassword() {
  return "a".repeat(73);
}

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

test("POST /api/auth/register returns 400 for password longer than 72 chars", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "maxlen-register@example.com",
        password: createLongPassword(),
        role: "client"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid request payload" });
  });
});

test("POST /api/auth/login returns 400 for password longer than 72 chars", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "maxlen-login@example.com",
        password: createLongPassword()
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid request payload" });
  });
});
