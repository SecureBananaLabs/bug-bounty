import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validJob = {
  title: "Build marketplace",
  description: "Build a marketplace workflow",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_dev",
  skills: ["api"]
};

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

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers
    }
  });

  return { response, payload: await response.json() };
}

test("PATCH /api/jobs/:id updates an existing job and preserves its id", async () => {
  await withServer(async (baseUrl) => {
    const created = await requestJson(`${baseUrl}/api/jobs`, {
      method: "POST",
      body: JSON.stringify(validJob)
    });

    const job = created.payload.data;
    const updated = await requestJson(`${baseUrl}/api/jobs/${job.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated marketplace", budgetMin: 250 })
    });

    assert.equal(updated.response.status, 200);
    assert.equal(updated.payload.success, true);
    assert.equal(updated.payload.data.id, job.id);
    assert.equal(updated.payload.data.title, "Updated marketplace");
    assert.equal(updated.payload.data.budgetMin, 250);
    assert.equal(updated.payload.data.description, validJob.description);
    assert.equal(updated.payload.data.status, "open");
  });
});

test("PATCH /api/jobs/:id returns 404 for missing jobs", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await requestJson(`${baseUrl}/api/jobs/missing_job`, {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated marketplace" })
    });

    assert.equal(response.status, 404);
    assert.deepEqual(payload, { success: false, message: "Job not found" });
  });
});

test("PATCH /api/jobs/:id returns 400 for invalid patches", async () => {
  await withServer(async (baseUrl) => {
    const created = await requestJson(`${baseUrl}/api/jobs`, {
      method: "POST",
      body: JSON.stringify(validJob)
    });

    const { response, payload } = await requestJson(`${baseUrl}/api/jobs/${created.payload.data.id}`, {
      method: "PATCH",
      body: JSON.stringify({ budgetMin: -1 })
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid job update payload" });
  });
});
