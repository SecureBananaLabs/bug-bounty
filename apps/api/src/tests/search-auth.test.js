import assert from "node:assert/strict";
import test from "node:test";
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
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search requires authentication", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=test`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /unauthorized/i);
  });
});

test("GET /api/search works for authenticated callers", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_searcher", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=test`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "test");
  });
});
