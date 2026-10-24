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

  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/reviews rejects unauthenticated requests", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "spam" })
    });

    assert.equal(response.status, 401);
  });
});

test("POST /api/reviews rejects invalid tokens", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer not-a-valid-token"
      },
      body: JSON.stringify({ rating: 5, comment: "spam" })
    });

    assert.equal(response.status, 401);
  });
});

test("POST /api/reviews accepts authenticated requests", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "user_1" });
    const response = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rating: 5, comment: "great" })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
  });
});
