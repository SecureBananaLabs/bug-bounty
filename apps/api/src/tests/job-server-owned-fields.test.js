import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJob } from "../services/jobService.js";

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

const validJobPayload = {
  title: "Build API",
  description: "Build the backend API",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "cat_1",
  skills: ["node"]
};

test("POST /api/jobs preserves server-owned id and open status", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validJobPayload,
        id: "job_attacker",
        status: "closed"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^job_/);
    assert.notEqual(payload.data.id, "job_attacker");
    assert.equal(payload.data.status, "open");
  });
});

test("createJob keeps generated ids and open status server-owned", async () => {
  const job = await createJob({
    ...validJobPayload,
    id: "job_attacker",
    status: "closed"
  });

  assert.match(job.id, /^job_/);
  assert.notEqual(job.id, "job_attacker");
  assert.equal(job.status, "open");
});
