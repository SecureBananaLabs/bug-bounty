import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/jobs returns 200 with job list", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/jobs`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });
});

test("POST /api/jobs without Authorization header rejects with 401 Unauthorized", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Node.js Engineer",
        description: "Need senior engineer to optimize backend architecture",
        budgetMin: 1000,
        budgetMax: 2000,
        categoryId: "cat_backend"
      })
    });
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });
});

test("POST /api/jobs with invalid token rejects with 401 Invalid token", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.token.value"
      },
      body: JSON.stringify({
        title: "Senior Node.js Engineer",
        description: "Need senior engineer to optimize backend architecture",
        budgetMin: 1000,
        budgetMax: 2000,
        categoryId: "cat_backend"
      })
    });
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });
});

test("POST /api/jobs with budgetMax < budgetMin rejects with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client_01", role: "client" });
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Senior Node.js Engineer",
        description: "Need senior engineer to optimize backend architecture",
        budgetMin: 5000,
        budgetMax: 1000,
        categoryId: "cat_backend"
      })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /budgetMax must be greater than or equal to budgetMin/i);
  });
});

test("POST /api/jobs with short title rejects with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client_01", role: "client" });
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Dev",
        description: "Need senior engineer to optimize backend architecture",
        budgetMin: 500,
        budgetMax: 1000,
        categoryId: "cat_backend"
      })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /at least 4 characters/i);
  });
});

test("POST /api/jobs with valid payload and token succeeds with 201 Created", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client_01", role: "client" });
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Senior Node.js Engineer",
        description: "Need senior engineer to optimize backend architecture",
        budgetMin: 1000,
        budgetMax: 2000,
        categoryId: "cat_backend",
        skills: ["node", "express", "zod"]
      })
    });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id);
    assert.equal(data.data.title, "Senior Node.js Engineer");
    assert.equal(data.data.budgetMin, 1000);
    assert.equal(data.data.budgetMax, 2000);
    assert.deepEqual(data.data.skills, ["node", "express", "zod"]);
  });
});
