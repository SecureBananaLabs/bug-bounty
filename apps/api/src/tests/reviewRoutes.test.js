import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", async () => {
      const { port } = server.address();
      const base = `http://127.0.0.1:${port}`;
      try {
        await run(base);
      } finally {
        await new Promise((res2, rej2) => server.close((e) => (e ? rej2(e) : res2())));
      }
      resolve();
    });
    server.once("error", reject);
  });
}

test("POST /api/reviews without token returns 401", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/reviews`, { method: "POST" });
    assert.equal(response.status, 401);
  });
});

test("GET /api/reviews without token returns 401", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/reviews`);
    assert.equal(response.status, 401);
  });
});

test("POST /api/reviews with valid token does not 401", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ id: "usr_test", role: "client" });
    const response = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.notEqual(response.status, 401);
  });
});