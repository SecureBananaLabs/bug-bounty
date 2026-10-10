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
      }),
  };
}

test("POST /api/reviews without token returns 401 Unauthorized", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "unauthenticated review" }),
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await server.close();
  }
});

test("POST /api/reviews with invalid token returns 401 Invalid token", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid.token.value",
      },
      body: JSON.stringify({ rating: 5, comment: "bad token review" }),
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  } finally {
    await server.close();
  }
});

test("POST /api/reviews with valid bearer token succeeds with 201", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ id: "user_reviewer_1", email: "reviewer@example.com" });
    const response = await fetch(`${server.baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: 5, comment: "Great communication and delivered on time!" }),
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
  } finally {
    await server.close();
  }
});

test("GET /api/reviews remains accessible without auth", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/reviews`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
  } finally {
    await server.close();
  }
});
