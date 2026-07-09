import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/messages rejects unauthenticated reads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("GET /api/messages accepts authenticated reads", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_reader", role: "client" });
    const response = await fetch(`${baseUrl}/api/messages`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: []
    });
  });
});
