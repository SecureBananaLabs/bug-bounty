import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerSchema } from "../validators/auth.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("registerSchema rejects missing fullName", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
  });
});

test("POST /api/auth/register preserves the validated fullName", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "password123",
        fullName: "Ava Client",
        role: "client"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.fullName, "Ava Client");
  });
});
