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
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

const basePayload = { coverLetter: "test", estDuration: "2 weeks", jobId: "job_test", freelancerId: "usr_test" };

test("POST /api/proposals rejects zero bidAmount", async () => {
  await withServer(async (port) => {
    const response = await postProposal(port, { ...basePayload, bidAmount: 0 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/proposals rejects negative bidAmount", async () => {
  await withServer(async (port) => {
    const response = await postProposal(port, { ...basePayload, bidAmount: -500 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/proposals rejects non-numeric bidAmount", async () => {
  await withServer(async (port) => {
    const response = await postProposal(port, { ...basePayload, bidAmount: "free" });
    assert.equal(response.status, 400);
  });
});

test("POST /api/proposals accepts positive bidAmount", async () => {
  await withServer(async (port) => {
    const response = await postProposal(port, { ...basePayload, bidAmount: 1500 });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.bidAmount, 1500);
  });
});
