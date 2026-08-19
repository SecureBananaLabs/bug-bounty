import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/messages rejects missing and invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/messages`);
    const invalid = await fetch(`${baseUrl}/api/messages`, {
      headers: { authorization: "Bearer not-a-valid-token" }
    });

    assert.equal(missing.status, 401);
    assert.deepEqual(await missing.json(), {
      success: false,
      message: "Unauthorized"
    });

    assert.equal(invalid.status, 401);
    assert.deepEqual(await invalid.json(), {
      success: false,
      message: "Invalid token"
    });
  });
});

test("GET /api/messages lists messages for valid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_message_reader", role: "client" });
    const response = await fetch(`${baseUrl}/api/messages`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });
});
