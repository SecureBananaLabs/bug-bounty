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
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, bidAmount) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      coverLetter: "I can complete this work.",
      bidAmount,
      estDuration: "2 weeks",
      jobId: "job_test",
      freelancerId: "usr_test"
    })
  });
}

test("POST /api/proposals rejects zero bidAmount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, 0);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals rejects negative bidAmount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, -500);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/proposals rejects non-numeric bidAmount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, "free");
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/proposals accepts positive bidAmount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, 500);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.bidAmount, 500);
  });
});
