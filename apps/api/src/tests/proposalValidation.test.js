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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, payload) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/proposals rejects proposals missing estimated duration", async () => {
  await withServer(async baseUrl => {
    const response = await postProposal(baseUrl, {
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals stores validated proposal fields", async () => {
  await withServer(async baseUrl => {
    const response = await postProposal(baseUrl, {
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250,
      estDuration: "2 weeks"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.equal(payload.data.estDuration, "2 weeks");
    assert.deepEqual(Object.keys(payload.data).sort(), [
      "bidAmount",
      "coverLetter",
      "estDuration",
      "freelancerId",
      "id",
      "jobId"
    ]);
  });
});
