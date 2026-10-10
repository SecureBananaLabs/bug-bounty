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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, payload) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can complete this safely.",
  bidAmount: 250,
  estDuration: "2 weeks"
};

test("POST /api/proposals rejects missing estDuration", async () => {
  await withServer(async (baseUrl) => {
    const { estDuration, ...payload } = validProposal;
    const response = await postProposal(baseUrl, payload);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid proposal payload");
  });
});

test("POST /api/proposals rejects blank estDuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      ...validProposal,
      estDuration: "   "
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid proposal payload");
  });
});

test("POST /api/proposals stores valid estDuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, validProposal);
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.match(body.data.id, /^prp_/);
    assert.equal(body.data.estDuration, validProposal.estDuration);
  });
});
