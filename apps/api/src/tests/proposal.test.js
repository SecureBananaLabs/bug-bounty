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

test("GET /api/proposals returns 200 and list", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });
});

test("GET /api/proposals/:id with non-existent id returns 404", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals/non_existent_proposal`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Proposal not found");
  });
});

test("POST /api/proposals creates proposal and GET /api/proposals/:id retrieves it", async () => {
  await withServer(async (baseUrl) => {
    const createRes = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "job_123", freelancerId: "usr_456", bidAmount: 1500, coverLetter: "Experienced fullstack engineer" }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.success, true);
    assert.ok(created.data.id);
    assert.equal(created.data.bidAmount, 1500);

    const getRes = await fetch(`${baseUrl}/api/proposals/${created.data.id}`);
    assert.equal(getRes.status, 200);
    const retrieved = await getRes.json();
    assert.equal(retrieved.success, true);
    assert.equal(retrieved.data.id, created.data.id);
    assert.equal(retrieved.data.jobId, "job_123");
  });
});
