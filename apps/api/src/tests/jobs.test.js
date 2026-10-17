import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function jsonPost(port, path, body) {
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function startApp() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { server, port };
}

test("POST /api/jobs → 201 with valid payload", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, "/api/jobs", {
    title: "Senior React Developer",
    description: "Build a real-time dashboard with WebSocket integration",
    budgetMin: 3000,
    budgetMax: 6000,
    categoryId: "cat-web",
    skills: ["React", "TypeScript", "D3.js"],
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data.id.startsWith("job_"));
});

test("POST /api/jobs → 400 when title is too short", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, "/api/jobs", {
    title: "JS",
    description: "Build something",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "cat-web",
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  // Zod errors array should contain the title validation error
  assert.ok(Array.isArray(body.message));
  const titleErr = body.message.find(
    (e) => e.path && e.path.includes("title")
  );
  assert.ok(titleErr);
});

test("POST /api/jobs → 400 when description is too short", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, "/api/jobs", {
    title: "Valid Job Title",
    description: "short",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "cat-web",
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.message));
});

test("POST /api/jobs → 400 when budgetMin is negative", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, "/api/jobs", {
    title: "Valid Job Title",
    description: "A proper job description here",
    budgetMin: -100,
    budgetMax: 500,
    categoryId: "cat-web",
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
});

test("POST /api/jobs → 400 when required fields are missing", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, "/api/jobs", {
    title: "Half-filled Job",
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.message));
});