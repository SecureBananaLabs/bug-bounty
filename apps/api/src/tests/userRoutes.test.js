import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startTestServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}

test("GET /api/users requires bearer authentication", async () => {
  const server = await startTestServer();

  try {
    const createResponse = await fetch(`${server.baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "private-user@example.com",
        displayName: "Private User"
      })
    });

    assert.equal(createResponse.status, 201);

    const anonymousResponse = await fetch(`${server.baseUrl}/api/users`);
    const anonymousPayload = await anonymousResponse.json();

    assert.equal(anonymousResponse.status, 401);
    assert.deepEqual(anonymousPayload, {
      success: false,
      message: "Unauthorized"
    });

    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const authenticatedResponse = await fetch(`${server.baseUrl}/api/users`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const authenticatedPayload = await authenticatedResponse.json();

    assert.equal(authenticatedResponse.status, 200);
    assert.equal(authenticatedPayload.success, true);
    assert.ok(
      authenticatedPayload.data.some((user) => user.email === "private-user@example.com")
    );
  } finally {
    await server.close();
  }
});
