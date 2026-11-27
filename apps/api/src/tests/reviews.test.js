import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/reviews rejects requests without a token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "unauthenticated" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/reviews rejects a malformed token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer not-a-real-token"
      },
      body: JSON.stringify({ rating: 5, comment: "bad token" })
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Invalid token");
  });
});

test("POST /api/reviews creates a review for the authenticated user", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_authenticated", role: "client" });
    const response = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        rating: 4,
        comment: "solid work",
        authorId: "usr_someone_else"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.authorId, "usr_authenticated");
    assert.equal(payload.data.rating, 4);
  });
});

test("GET /api/reviews stays public", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/reviews`);

    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
  });
});
