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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders() {
  const token = signAccessToken({ sub: "usr_test_review_auth", role: "client" });
  return { Authorization: `Bearer ${token}` };
}

test("GET /api/reviews requires authentication", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/reviews requires authentication", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "blocked" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("authenticated review routes reach existing controllers", async () => {
  await withTestServer(async (baseUrl) => {
    const created = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ rating: 5, comment: "hello" })
    });
    const createdPayload = await created.json();

    assert.equal(created.status, 201);
    assert.equal(createdPayload.success, true);
    assert.equal(createdPayload.data.rating, 5);
    assert.equal(createdPayload.data.comment, "hello");

    const listed = await fetch(`${baseUrl}/api/reviews`, {
      headers: authHeaders()
    });
    const listedPayload = await listed.json();

    assert.equal(listed.status, 200);
    assert.equal(listedPayload.success, true);
    assert.ok(listedPayload.data.some((review) => review.comment === "hello"));
  });
});
