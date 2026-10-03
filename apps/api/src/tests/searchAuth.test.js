import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

test("GET /api/search requires authentication", async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=maya`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  } finally {
    await stopServer(server);
  }
});

test("GET /api/search returns the existing payload for authenticated requests", async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const token = signAccessToken({ sub: "usr_search", role: "client" });

    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=maya`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: {
        query: "maya",
        users: [],
        jobs: [],
        freelancers: []
      }
    });
  } finally {
    await stopServer(server);
  }
});
