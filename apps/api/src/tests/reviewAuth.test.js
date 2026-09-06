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

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/reviews rejects missing and invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", rating: 5, comment: "Great work" })
    });
    const invalid = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        authorization: "Bearer not-a-valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_1", rating: 5, comment: "Great work" })
    });

    assert.equal(missing.status, 401);
    assert.deepEqual(await missing.json(), {
      success: false,
      message: "Unauthorized"
    });

    assert.equal(invalid.status, 401);
    assert.deepEqual(await invalid.json(), {
      success: false,
      message: "Invalid token"
    });
  });
});

test("POST /api/reviews creates reviews for valid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_review_author", role: "client" });
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_1", rating: 5, comment: "Great work" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great work");
    assert.match(payload.data.id, /^rev_/);
  });
});
