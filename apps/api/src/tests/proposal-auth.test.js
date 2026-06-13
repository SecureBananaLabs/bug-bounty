import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const payload = {
  jobId: "job_123",
  coverLetter: "I can deliver this quickly with clear milestones.",
  bidAmount: 180
};

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

test("POST /api/proposals rejects missing bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/proposals rejects invalid bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token"
      },
      body: JSON.stringify(payload)
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid token" });
  });
});

test("POST /api/proposals accepts valid bearer token", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.jobId, payload.jobId);
    assert.equal(body.data.bidAmount, payload.bidAmount);
  });
});
