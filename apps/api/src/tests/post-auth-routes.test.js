import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

const protectedPosts = [
  {
    path: "/api/notifications",
    body: { message: "New message", type: "message", userId: "usr_123" }
  },
  {
    path: "/api/payments",
    body: { amount: 100, currency: "USD", jobId: "job_123" }
  },
  {
    path: "/api/users",
    body: { fullName: "Test User", email: "test@example.com", role: "client" }
  }
];

for (const { path, body } of protectedPosts) {
  test(`POST ${path} requires authentication`, async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, { success: false, message: "Unauthorized" });
    });
  });
}

test("POST /api/notifications still succeeds with a valid bearer token", async () => {
  const token = signAccessToken({ sub: "usr_123", role: "client" });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "New message",
        type: "message",
        userId: "usr_123"
      })
    });

    assert.equal(response.status, 201);
  });
});
