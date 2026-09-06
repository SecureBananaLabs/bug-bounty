import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startTestServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      const { port } = server.address();
      const baseUrl = `http://127.0.0.1:${port}`;
      const close = () => new Promise((res, rej) => server.close((err) => (err ? rej(err) : res())));
      resolve({ baseUrl, close });
    });
    server.once("error", reject);
  });
}

test("GET /api/reviews is public and returns 200", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/reviews`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
  } finally {
    await close();
  }
});

test("POST /api/reviews returns 401 Unauthorized when missing Authorization header", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Great work!" }),
    });
    const json = await res.json();
    assert.equal(res.status, 401);
    assert.equal(json.success, false);
    assert.equal(json.message, "Unauthorized");
  } finally {
    await close();
  }
});

test("POST /api/reviews returns 401 Unauthorized when Authorization header does not start with Bearer", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic dXNlcjpwYXNz",
      },
      body: JSON.stringify({ rating: 5, comment: "Great work!" }),
    });
    const json = await res.json();
    assert.equal(res.status, 401);
    assert.equal(json.success, false);
    assert.equal(json.message, "Unauthorized");
  } finally {
    await close();
  }
});

test("POST /api/reviews returns 401 when token is invalid", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.jwt.token",
      },
      body: JSON.stringify({ rating: 5, comment: "Great work!" }),
    });
    const json = await res.json();
    assert.equal(res.status, 401);
    assert.equal(json.success, false);
    assert.equal(json.message, "Invalid token");
  } finally {
    await close();
  }
});

test("POST /api/reviews returns 201 and creates review when valid Bearer token provided", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const validToken = signAccessToken({ sub: "usr_123", email: "user@example.com" });
    const payload = { rating: 5, comment: "Outstanding service!" };
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.success, true);
    assert.equal(json.data.rating, 5);
    assert.equal(json.data.comment, "Outstanding service!");
    assert.ok(json.data.id);
  } finally {
    await close();
  }
});
