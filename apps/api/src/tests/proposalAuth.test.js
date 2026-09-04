import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_1", bidAmount: 500, coverLetter: "hello" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/proposals accepts authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_1", bidAmount: 500, coverLetter: "hello" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.bidAmount, 500);
    assert.equal(payload.data.coverLetter, "hello");
    assert.match(payload.data.id, /^prp_/);
  });
});
