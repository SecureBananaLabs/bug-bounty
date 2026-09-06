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

  const { port } = server.address();

  try {
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function assertCredentialsRedacted(user) {
  assert.equal("password" in user, false);
  assert.equal("passwordHash" in user, false);
  assert.equal("token" in user, false);
  assert.equal("refreshToken" in user, false);
  assert.equal("apiToken" in user, false);
  assert.equal("nestedToken" in (user.profile ?? {}), false);
}

test("POST /api/users redacts credential-like fields from response", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "super-secret",
        passwordHash: "hash-value",
        token: "access-token",
        refreshToken: "refresh-token",
        profile: {
          nestedToken: "profile-token"
        }
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assertCredentialsRedacted(payload.data);
  });
});

test("GET /api/users redacts credential-like fields from listed users", async () => {
  await withServer(async (port) => {
    await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bob@example.com",
        apiToken: "api-token",
        profile: {
          nestedToken: "another-token"
        }
      })
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(Array.isArray(payload.data), true);
    assert.equal(payload.data.length > 0, true);

    for (const user of payload.data) {
      assertCredentialsRedacted(user);
    }
  });
});
