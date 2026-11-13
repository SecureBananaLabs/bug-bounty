import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("register signs the access token for the returned user id", async () => {
  const originalNow = Date.now;
  let tick = 1_700_000_000_000;
  Date.now = () => (tick += 1);

  try {
    await withServer(async (base) => {
      const response = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "new@example.com", password: "password123" })
      });

      assert.equal(response.status, 201);

      const payload = await response.json();
      assert.equal(payload.success, true);
      assert.equal(typeof payload.data.id, "string");

      const verified = verifyAccessToken(payload.data.token);
      assert.equal(verified.sub, payload.data.id);
      assert.equal(verified.role, "client");
    });
  } finally {
    Date.now = originalNow;
  }
});
