import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects an empty body", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, "Invalid proposal payload");
    assert.ok(payload.details.jobId);
    assert.ok(payload.details.rate);
    assert.ok(payload.details.message);
  });
});

test("POST /api/proposals accepts a valid proposal payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job-1", rate: 100, message: "I can help." })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.jobId, "job-1");
    assert.equal(payload.data.rate, 100);
    assert.equal(payload.data.message, "I can help.");
  });
});
