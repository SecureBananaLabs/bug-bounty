import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects unauthenticated requests", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: 1, cover_letter: "spam" }),
    });
    assert.equal(response.status, 401);
  });
});

test("POST /api/proposals rejects invalid tokens", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer not-a-real-token",
      },
      body: JSON.stringify({ job_id: 1, cover_letter: "spam" }),
    });
    assert.equal(response.status, 401);
  });
});

test("POST /api/proposals accepts a valid access token", async () => {
  await withServer(async (base) => {
    const token = jwt.sign({ sub: 1, email: "user@example.com" }, process.env.JWT_SECRET ?? "development-secret", {
      expiresIn: "10m",
    });
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ job_id: 1, cover_letter: "hello" }),
    });
    assert.equal(response.status, 201);
  });
});
