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
  try { await run(server.address().port); }
  finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search without auth returns 401", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=dev`);
    assert.equal(response.status, 401);
  });
});

test("GET /api/search with auth succeeds", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=dev`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.notEqual(response.status, 401);
  });
});
