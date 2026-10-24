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

test("GET /api/notifications requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("notification routes accept authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };

    const createResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "New proposal" }),
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.success, true);
    assert.equal(createPayload.data.message, "New proposal");

    const listResponse = await fetch(`${baseUrl}/api/notifications`, { headers });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.success, true);
    assert.equal(listPayload.data.length, 1);
  });
});
