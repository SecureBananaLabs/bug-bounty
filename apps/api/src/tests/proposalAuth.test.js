import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects anonymous callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", coverLetter: "I can help." })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/proposals accepts authenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({
      sub: "user_proposal_auth",
      role: "freelancer"
    });

    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_1", coverLetter: "I can help." })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.coverLetter, "I can help.");
    assert.match(payload.data.id, /^prp_/);
  });
});
