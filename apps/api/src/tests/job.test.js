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

  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validJob = {
  title: "Senior Full Stack Engineer",
  description: "We are seeking a senior full-stack engineer to build modern web applications.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "engineering",
  skills: ["javascript", "node", "react"]
};

test("POST /api/jobs creates a job when payload is valid", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validJob)
    });

    const payload = await res.json();
    assert.equal(res.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, validJob.title);
    assert.equal(payload.data.budgetMin, 100);
    assert.equal(payload.data.budgetMax, 500);
    assert.equal(payload.data.status, "open");
  });
});

test("POST /api/jobs rejects inverted budget range (budgetMax < budgetMin)", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validJob,
        budgetMin: 500,
        budgetMax: 100
      })
    });

    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.ok, false);
    assert.ok(payload.error);
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.some((issue) => issue.path.includes("budgetMax")));
  });
});

test("POST /api/jobs enforces title bounds (4-150 chars)", async () => {
  await withServer(async (baseUrl) => {
    // Too short (< 4 chars)
    const shortRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validJob, title: "Dev" })
    });
    const shortPayload = await shortRes.json();
    assert.equal(shortRes.status, 400);
    assert.equal(shortPayload.ok, false);

    // Too long (> 150 chars)
    const longRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validJob, title: "A".repeat(151) })
    });
    const longPayload = await longRes.json();
    assert.equal(longRes.status, 400);
    assert.equal(longPayload.ok, false);
  });
});

test("POST /api/jobs enforces description bounds (10-5000 chars)", async () => {
  await withServer(async (baseUrl) => {
    // Too short (< 10 chars)
    const shortRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validJob, description: "Short" })
    });
    const shortPayload = await shortRes.json();
    assert.equal(shortRes.status, 400);
    assert.equal(shortPayload.ok, false);

    // Too long (> 5000 chars)
    const longRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validJob, description: "B".repeat(5001) })
    });
    const longPayload = await longRes.json();
    assert.equal(longRes.status, 400);
    assert.equal(longPayload.ok, false);
  });
});

test("POST /api/jobs enforces categoryId bounds (1-64 chars)", async () => {
  await withServer(async (baseUrl) => {
    // Empty (< 1 char)
    const emptyRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validJob, categoryId: "" })
    });
    const emptyPayload = await emptyRes.json();
    assert.equal(emptyRes.status, 400);
    assert.equal(emptyPayload.ok, false);

    // Too long (> 64 chars)
    const longRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validJob, categoryId: "C".repeat(65) })
    });
    const longPayload = await longRes.json();
    assert.equal(longRes.status, 400);
    assert.equal(longPayload.ok, false);
  });
});

test("POST /api/jobs enforces skills array limits (max 30 items, each 1-50 chars)", async () => {
  await withServer(async (baseUrl) => {
    // Too many items (> 30 items)
    const tooManyRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validJob,
        skills: Array.from({ length: 31 }, (_, i) => `skill_${i}`)
      })
    });
    const tooManyPayload = await tooManyRes.json();
    assert.equal(tooManyRes.status, 400);
    assert.equal(tooManyPayload.ok, false);

    // Item too long (> 50 chars)
    const itemTooLongRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validJob,
        skills: ["valid_skill", "S".repeat(51)]
      })
    });
    const itemTooLongPayload = await itemTooLongRes.json();
    assert.equal(itemTooLongRes.status, 400);
    assert.equal(itemTooLongPayload.ok, false);
  });
});

test("GET /api/jobs returns list of jobs", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/jobs`);
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });
});
