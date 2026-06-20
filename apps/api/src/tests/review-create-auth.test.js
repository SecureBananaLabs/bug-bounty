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
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

test("POST /api/reviews without auth returns 401", async () => {
  const { baseUrl, close } = await startServer();

  const response = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rating: 5, comment: "Excellent work" })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });

  await close();
});

test("POST /api/reviews with auth returns 201", async () => {
  const { baseUrl, close } = await startServer();
  const token = signAccessToken({ sub: "usr_test", role: "client" });

  const response = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating: 5, comment: "Excellent work" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.rating, 5);
  assert.equal(payload.data.comment, "Excellent work");
  assert.match(payload.data.id, /^rev_/);

  await close();
});
