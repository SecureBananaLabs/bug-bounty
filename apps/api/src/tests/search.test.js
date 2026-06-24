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

test("GET /api/search rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=contract`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("GET /api/search preserves results for authenticated requests", async () => {
  const token = signAccessToken({ sub: "usr_search", role: "client" });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=contract`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: {
        query: "contract",
        users: [],
        jobs: [],
        freelancers: []
      }
    });
  });
});
