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

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search accepts string queries up to 200 characters", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=backend`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: {
        query: "backend",
        users: [],
        jobs: [],
        freelancers: []
      }
    });
  });
});

test("GET /api/search rejects queries longer than 200 characters", async () => {
  await withServer(async (port) => {
    const query = "a".repeat(201);
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${query}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Search query must be 200 characters or fewer"
    });
  });
});

test("GET /api/search rejects non-string query values", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=one&q=two`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Search query must be a string"
    });
  });
});
