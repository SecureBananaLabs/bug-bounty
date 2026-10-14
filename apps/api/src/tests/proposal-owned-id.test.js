import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const payload = {
  id: "prp_client_controlled",
  jobId: "job_123",
  freelancerId: "usr_freelancer",
  coverLetter: "I can take this on quickly.",
  estimatedDuration: "3 days"
};

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals preserves the server-generated id", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    assert.equal(response.status, 201);
    assert.equal(result.success, true);
    assert.notEqual(result.data.id, payload.id);
    assert.equal(result.data.jobId, payload.jobId);
    assert.equal(result.data.freelancerId, payload.freelancerId);
    assert.equal(result.data.coverLetter, payload.coverLetter);
    assert.equal(result.data.estimatedDuration, payload.estimatedDuration);
  });
});
