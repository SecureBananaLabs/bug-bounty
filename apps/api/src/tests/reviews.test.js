import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Review routes auth enforcement", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/reviews`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("GET /api/reviews remains accessible without authentication", async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  await t.test("POST /api/reviews rejects unauthenticated requests with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Excellent work delivered on time." }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  await t.test("POST /api/reviews rejects invalid token with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid_bearer_token",
      },
      body: JSON.stringify({ rating: 5, comment: "Excellent work delivered on time." }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });

  await t.test("POST /api/reviews allows authenticated user to submit a review with 201", async () => {
    const token = signAccessToken({ id: "client_reviewer_1", role: "client" });
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: 5, comment: "Excellent work delivered on time." }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.rating, 5);
    assert.equal(data.data.comment, "Excellent work delivered on time.");
    assert.ok(data.data.id);
  });
});
