import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users preserves server-owned id and verification status", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "usr_attacker",
        email: "new@example.com",
        fullName: "New User",
        isVerified: true,
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_\d+$/);
    assert.notEqual(payload.data.id, "usr_attacker");
    assert.equal(payload.data.isVerified, false);
  });
});
