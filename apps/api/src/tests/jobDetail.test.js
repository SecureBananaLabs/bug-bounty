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
    await fn(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validJob = {
  title: "Build an API endpoint",
  description: "Implement a detail endpoint for jobs.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_dev"
};

test("GET /api/jobs/:id returns the created job", async () => {
  await withServer(async (port) => {
    const created = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validJob)
    }).then((r) => r.json());

    const id = created.data.id;
    assert.ok(id, "expected an id on the created job");

    const response = await fetch(`http://127.0.0.1:${port}/api/jobs/${id}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.id, id);
    assert.equal(payload.data.title, validJob.title);
  });
});

test("GET /api/jobs/:id returns 404 JSON envelope for an unknown id", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs/job_missing`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.success, false);
    assert.equal(typeof payload.message, "string");
  });
});
