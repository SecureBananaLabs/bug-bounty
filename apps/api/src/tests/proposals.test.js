import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

const proposalPayload = {
  jobId: "job_1",
  coverLetter: "I can deliver this quickly.",
  bidAmount: 120,
  estimatedDuration: "1 week"
};

test("GET /api/proposals rejects unauthenticated requests", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/proposals rejects unauthenticated requests", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("authenticated proposal listing and creation still work", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });

    const createResponse = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(proposalPayload)
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.success, true);
    assert.equal(createPayload.data.jobId, proposalPayload.jobId);
    assert.match(createPayload.data.id, /^prp_/);

    const listResponse = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.success, true);
    assert.ok(Array.isArray(listPayload.data));
    assert.ok(listPayload.data.length >= 1);
  });
});
