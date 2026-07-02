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
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals requires auth", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", freelancerId: "usr_1", id: "evil" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/proposals ignores client-controlled id", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: "evil",
        jobId: "job_1",
        freelancerId: "usr_1",
        coverLetter: "Ready to help",
        estimatedDuration: "2 weeks",
        unexpected: "drop-me"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.freelancerId, "usr_1");
    assert.equal(payload.data.coverLetter, "Ready to help");
    assert.equal(payload.data.estimatedDuration, "2 weeks");
    assert.equal("unexpected" in payload.data, false);
  });
});
