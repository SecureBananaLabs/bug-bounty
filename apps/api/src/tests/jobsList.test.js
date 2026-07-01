import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/jobs returns seeded marketplace jobs", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.deepEqual(
      payload.data.map((job) => job.id),
      ["job-101", "job-102", "job-103"]
    );
    assert.equal(payload.data[1].title, "Migrate legacy API to Node.js");
  });
});

test("POST /api/jobs appends a new job to later list responses", async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Build integration tests",
        description: "Cover the search and jobs endpoints",
        budgetMin: 100,
        budgetMax: 300,
        categoryId: "engineering",
        skills: ["Node.js"]
      })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.data.status, "open");
    assert.match(createPayload.data.id, /^job_/);

    const listResponse = await fetch(`${baseUrl}/api/jobs`);
    const listPayload = await listResponse.json();
    const created = listPayload.data.find((job) => job.id === createPayload.data.id);

    assert.ok(created);
    assert.equal(created.title, "Build integration tests");
  });
});
