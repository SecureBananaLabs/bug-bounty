import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validProposal = {
  coverLetter: "I can deliver this project with clear milestones.",
  bidAmount: 1200,
  estDuration: "2 weeks",
  jobId: "job_123",
  freelancerId: "usr_456"
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
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects missing estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { estDuration, ...missingDuration } = validProposal;
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(missingDuration)
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Estimated duration is required"
    });
  });
});

test("POST /api/proposals accepts proposals with estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProposal)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.estDuration, validProposal.estDuration);
  });
});
