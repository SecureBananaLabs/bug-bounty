import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const validJob = {
  title: "Build an analytics dashboard",
  description: "Create a reporting dashboard for weekly marketplace metrics.",
  budgetMin: 1000,
  budgetMax: 2500,
  categoryId: "analytics",
  skills: ["React", "SQL"]
};

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/jobs remains public", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });
});

test("POST /api/jobs rejects missing bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validJob)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/jobs rejects invalid bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validJob)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid token" });
  });
});

test("POST /api/jobs accepts authenticated job creation", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_123", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validJob)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, validJob.title);
  });
});
