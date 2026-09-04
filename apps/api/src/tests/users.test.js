import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/users omits submitted password from stored user records", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "super-secret",
        name: "Alice"
      })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.success, true);
    assert.equal(createPayload.data.email, "alice@example.com");
    assert.equal(createPayload.data.name, "Alice");
    assert.equal("password" in createPayload.data, false);

    const listResponse = await fetch(`http://127.0.0.1:${port}/api/users`);
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.deepEqual(listPayload, {
      success: true,
      data: [
        {
          id: createPayload.data.id,
          email: "alice@example.com",
          name: "Alice"
        }
      ]
    });
  } finally {
    await stopServer(server);
  }
});
