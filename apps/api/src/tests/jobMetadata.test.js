import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";

function validJob(overrides = {}) {
  return {
    title: "Build dashboard",
    description: "Create a hiring dashboard for clients",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "cat_web",
    skills: ["react", "node"],
    ...overrides
  };
}

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJob(baseUrl, body) {
  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/jobs preserves normal job creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJob(baseUrl, validJob());
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Build dashboard");
  });
});

test("POST /api/jobs rejects oversized metadata", async () => {
  await withServer(async (baseUrl) => {
    const oversizedPayloads = [
      validJob({ title: "x".repeat(121) }),
      validJob({ description: "x".repeat(5001) }),
      validJob({ categoryId: "x".repeat(101) }),
      validJob({ skills: ["x".repeat(81)] }),
      validJob({ skills: Array.from({ length: 26 }, (_, index) => `skill-${index}`) })
    ];

    for (const body of oversizedPayloads) {
      const response = await postJob(baseUrl, body);
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
    }
  });
});
