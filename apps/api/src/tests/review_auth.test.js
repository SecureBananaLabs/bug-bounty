import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/reviews rejects unauthenticated requests with HTTP 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5, comment: "Excellent collaboration" })
  });

  const payload = await res.json();
  assert.equal(res.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/reviews rejects requests with invalid token with HTTP 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer forged_token"
    },
    body: JSON.stringify({ rating: 5, comment: "Spam review" })
  });

  const payload = await res.json();
  assert.equal(res.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid token");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/reviews allows authenticated requests with valid Bearer token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const token = signAccessToken({ sub: "usr_reviewer_1", role: "client" });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ rating: 5, comment: "Verified review" })
  });

  const payload = await res.json();
  assert.equal(res.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.rating, 5);
  assert.equal(payload.data.comment, "Verified review");
  assert.ok(payload.data.id.startsWith("rev_"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/reviews returns 200 OK list of reviews", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/reviews`);
  const payload = await res.json();

  assert.equal(res.status, 200);
  assert.equal(payload.success, true);
  assert.ok(Array.isArray(payload.data));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
