import test from "node:test";
import assert from "node:assert/strict";
import { signAccessToken } from "../utils/jwt.js";

async function withApp(run) {
  const { createApp } = await import(`../app.js?case=${Math.random()}`);

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

test("rejects unauthenticated proposal creation", async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "spam" })
    });
    assert.equal(response.status, 401);
  });
});

test("rejects proposal creation with an invalid token", async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer not-a-real-token"
      },
      body: JSON.stringify({ title: "spam" })
    });
    assert.equal(response.status, 401);
  });
});

test("allows authenticated proposal creation", async () => {
  await withApp(async (base) => {
    const token = signAccessToken({ sub: "user_1" });
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: "legit" })
    });
    assert.equal(response.status, 201);
  });
});
