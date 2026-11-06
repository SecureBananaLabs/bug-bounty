import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("GET /api/search requires bearer authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=design`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("GET /api/search returns results for authenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_search", role: "client" });
    const response = await fetch(`${baseUrl}/api/search?q=design`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, {
      query: "design",
      users: [],
      jobs: [],
      freelancers: []
    });
  });
});
