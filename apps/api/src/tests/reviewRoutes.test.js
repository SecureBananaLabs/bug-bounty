import { createServer } from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const buildResponse = async (path, { method = "GET", token, body } = {}) => {
  const app = createApp();
  const server = createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const headers = {};

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = await res.json();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

  return {
    payload,
    status: res.status
  };
};

test("POST /api/reviews requires auth", async () => {
  const unauthenticated = await buildResponse("/api/reviews", {
    method: "POST",
    body: { jobId: "job_1", freelancerId: "user_2", rating: 5, comment: "Great work" }
  });

  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.payload.success, false);
});

test("POST /api/reviews rejects invalid tokens", async () => {
  const invalidToken = await buildResponse("/api/reviews", {
    method: "POST",
    token: "invalid-token",
    body: { jobId: "job_1", freelancerId: "user_2", rating: 5, comment: "Great work" }
  });

  assert.equal(invalidToken.status, 401);
  assert.equal(invalidToken.payload.success, false);
});

test("POST /api/reviews validates payload", async () => {
  const token = signAccessToken({ id: "reviewer_1" });
  const invalidPayload = await buildResponse("/api/reviews", {
    method: "POST",
    token,
    body: { jobId: "", freelancerId: "user_2", rating: 10, comment: "" }
  });

  assert.equal(invalidPayload.status, 400);
  assert.equal(invalidPayload.payload.success, false);
});

test("POST /api/reviews accepts valid payload", async () => {
  const token = signAccessToken({ id: "reviewer_1" });
  const response = await buildResponse("/api/reviews", {
    method: "POST",
    token,
    body: { jobId: "job_1", freelancerId: "user_2", rating: 5, comment: "Great work" }
  });

  assert.equal(response.status, 201);
  assert.equal(response.payload.success, true);
  assert.equal(response.payload.data.rating, 5);
  assert.equal(response.payload.data.jobId, "job_1");
});
