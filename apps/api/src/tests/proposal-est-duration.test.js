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
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, body) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/proposals rejects missing estDuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, { jobId: "job_1", coverLetter: "Ready to help" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "estDuration is required" });
  });
});

test("POST /api/proposals rejects blank estDuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      jobId: "job_1",
      coverLetter: "Ready to help",
      estDuration: "   "
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "estDuration is required" });
  });
});

test("POST /api/proposals accepts non-empty estDuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      jobId: "job_1",
      coverLetter: "Ready to help",
      estDuration: "2 weeks"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.estDuration, "2 weeks");
  });
});
