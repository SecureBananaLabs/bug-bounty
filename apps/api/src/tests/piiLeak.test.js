import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/users should require authentication and scrub passwords", async () => {
  await withServer(async (baseUrl) => {
    // 1. Create a user
    const resCreate = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "victim@example.com", password: "superSecretPassword123" })
    });
    assert.equal(resCreate.status, 201);

    // 2. Try fetching users unauthenticated
    const resGetUnauth = await fetch(`${baseUrl}/api/users`);
    assert.equal(resGetUnauth.status, 401, "Expected GET /api/users to be protected");
  });
});
