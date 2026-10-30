import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { listJobs } from "../services/jobService.js";

test("POST /api/jobs rejects inverted budget ranges with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Rust Engineer",
        description: "Develop high throughput smart contract engine",
        budgetMin: 8000,
        budgetMax: 5000, // Inverted: budgetMax < budgetMin
        categoryId: "cat_tech",
        skills: ["Rust", "Solidity"]
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/jobs rejects invalid skills arrays with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const base = {
      title: "Backend Engineer",
      description: "Build microservice architecture with Node and Go",
      budgetMin: 1000,
      budgetMax: 2000,
      categoryId: "cat_eng"
    };

    const invalidCases = [
      { ...base, skills: ["   "] }, // Whitespace-only
      { ...base, skills: ["a".repeat(65)] }, // Oversized skill (>64 chars)
      { ...base, skills: Array.from({ length: 51 }, (_, i) => `skill_${i}`) } // Too many skills (>50)
    ];

    for (const body of invalidCases) {
      const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, "Validation failed");
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/jobs creates job with valid ordered budget and skills", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Frontend Architect",
        description: "Design and implement modern React design system",
        budgetMin: 3000,
        budgetMax: 6000,
        categoryId: "cat_ui",
        skills: ["React", "TypeScript", "TailwindCSS"]
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Frontend Architect");
    assert.equal(payload.data.status, "open");
    assert.deepEqual(payload.data.skills, ["React", "TypeScript", "TailwindCSS"]);
    assert.ok(payload.data.id.startsWith("job_"));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("listJobs returns an independent defensive array copy", async () => {
  const snapshot1 = await listJobs();
  const initialLength = snapshot1.length;

  snapshot1.push({ id: "malicious_injected_job", status: "fake" });
  snapshot1.length = 0;

  const snapshot2 = await listJobs();
  assert.equal(snapshot2.length, initialLength);
  assert.equal(snapshot2.some((j) => j.id === "malicious_injected_job"), false);
});
