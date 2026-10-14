import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withTestServer(run) {
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

test("GET /api/search rejects anonymous requests", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=designer`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("GET /api/search preserves response shape for authenticated requests", async () => {
  await withTestServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_search_test", role: "client" });
    const response = await fetch(`${baseUrl}/api/search?q=designer`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: {
        query: "designer",
        users: [],
        jobs: [],
        freelancers: []
      }
    });
  });
});
