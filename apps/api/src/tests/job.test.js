import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function makeRequest(path, options = {}) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    return { status: res.status, data };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/jobs returns 200 and list", async () => {
  const { status, data } = await makeRequest("/api/jobs");
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test("GET /api/jobs/:id with non-existent id returns 404", async () => {
  const { status, data } = await makeRequest("/api/jobs/job_nonexistent_9999");
  assert.equal(status, 404);
  assert.equal(data.success, false);
  assert.equal(data.message, "Job not found");
});

test("POST /api/jobs creates job and GET /api/jobs/:id retrieves it", async () => {
  const payload = {
    title: "Senior Full-Stack Engineer",
    description: "Looking for a seasoned developer to build microservices.",
    budgetMin: 5000,
    budgetMax: 10000,
    categoryId: "cat_eng_1",
    skills: ["Node.js", "React", "PostgreSQL"]
  };

  const createRes = await makeRequest("/api/jobs", {
    method: "POST",
    body: payload
  });

  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.success, true);
  assert.ok(createRes.data.data.id);
  const createdId = createRes.data.data.id;

  // Retrieve by ID
  const getRes = await makeRequest(`/api/jobs/${createdId}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.data.success, true);
  assert.equal(getRes.data.data.id, createdId);
  assert.equal(getRes.data.data.title, payload.title);
  assert.equal(getRes.data.data.status, "open");
});

test("POST /api/jobs with missing title returns 400", async () => {
  const payload = {
    description: "Looking for a seasoned developer to build microservices.",
    budgetMin: 5000,
    budgetMax: 10000,
    categoryId: "cat_eng_1"
  };

  const { status } = await makeRequest("/api/jobs", {
    method: "POST",
    body: payload
  });
  assert.equal(status, 400);
});

test("POST /api/jobs with negative budget returns 400", async () => {
  const payload = {
    title: "Negative Budget Job",
    description: "Description with sufficient length for valid job.",
    budgetMin: -100,
    budgetMax: 500,
    categoryId: "cat_eng_1"
  };

  const { status } = await makeRequest("/api/jobs", {
    method: "POST",
    body: payload
  });
  assert.equal(status, 400);
});
