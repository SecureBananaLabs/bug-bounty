import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/jobs rejects unauthenticated requests with HTTP 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Frontend Engineer",
      description: "Build Next.js web applications with Tailwind CSS",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "dev"
    })
  });

  const payload = await res.json();
  assert.equal(res.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs rejects requests with invalid token with HTTP 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer bad_token"
    },
    body: JSON.stringify({
      title: "Frontend Engineer",
      description: "Build Next.js web applications with Tailwind CSS",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "dev"
    })
  });

  const payload = await res.json();
  assert.equal(res.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid token");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs allows authenticated user to create a job listing with HTTP 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const token = signAccessToken({ sub: "usr_client_poster", role: "client" });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title: "Frontend Engineer",
      description: "Build Next.js web applications with Tailwind CSS",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "dev"
    })
  });

  const payload = await res.json();
  assert.equal(res.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.title, "Frontend Engineer");
  assert.equal(payload.data.status, "open");
  assert.ok(payload.data.id.startsWith("job_"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/jobs remains accessible to browse open jobs without authentication", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`);
  const payload = await res.json();

  assert.equal(res.status, 200);
  assert.equal(payload.success, true);
  assert.ok(Array.isArray(payload.data));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
