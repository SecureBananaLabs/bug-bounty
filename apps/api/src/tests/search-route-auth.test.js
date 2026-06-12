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
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=alice`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("GET /api/search allows authenticated requests", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_search", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=alice`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: {
        query: "alice",
        users: [],
        jobs: [],
        freelancers: []
      }
    });
  });
});
