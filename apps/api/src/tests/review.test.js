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
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders() {
  const token = signAccessToken({ sub: "usr_test", role: "client" });
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

test("POST /api/reviews rejects missing bearer auth", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        freelancerId: "usr_1",
        rating: 5,
        text: "Great work"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/reviews rejects missing required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.deepEqual(payload.issues.map((issue) => issue.path[0]).sort(), [
      "freelancerId",
      "jobId",
      "rating",
      "text"
    ]);
  });
});

test("POST /api/reviews rejects ratings outside 1-5", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        jobId: "job_1",
        freelancerId: "usr_1",
        rating: 6,
        text: "Great work"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.issues[0].path[0], "rating");
  });
});

test("POST /api/reviews creates valid authenticated reviews", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        jobId: "job_1",
        freelancerId: "usr_1",
        rating: 5,
        text: "Great work"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_/);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.freelancerId, "usr_1");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.text, "Great work");
  });
});
