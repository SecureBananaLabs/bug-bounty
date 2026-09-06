import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function json(body) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

test("POST /api/jobs rejects invalid payloads with 400", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, json({
      title: "x",
      description: "a valid description",
      budgetMin: 10,
      budgetMax: 100,
      categoryId: "c1"
    }));
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message);
  });
});

test("POST /api/jobs accepts valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, json({
      title: "Build a landing page",
      description: "A polished landing page for a SaaS product.",
      budgetMin: 500,
      budgetMax: 1000,
      categoryId: "cat-1",
      skills: ["react"]
    }));
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
  });
});

test("POST /api/auth/register rejects invalid payloads with 400", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, json({
      email: "not-an-email",
      password: "short",
      role: "client"
    }));
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message);
  });
});

test("POST /api/auth/register accepts valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, json({
      email: "a@b.com",
      password: "password123",
      role: "client"
    }));
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
  });
});