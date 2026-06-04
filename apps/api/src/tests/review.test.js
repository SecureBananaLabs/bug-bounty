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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders() {
  const token = signAccessToken({ sub: "usr_reviewer", role: "client" });

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

async function postReview(baseUrl, payload, headers = authHeaders()) {
  return fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
}

test("POST /api/reviews rejects anonymous review creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(
      baseUrl,
      {
        rating: 5,
        text: "Great work",
        jobId: "job_1",
        freelancerId: "usr_freelancer"
      },
      { "Content-Type": "application/json" }
    );
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/reviews rejects missing required review fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      rating: 5,
      text: "Great work"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid review payload"
    });
  });
});

test("POST /api/reviews rejects ratings outside the 1-5 scale", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      rating: 6,
      text: "Great work",
      jobId: "job_1",
      freelancerId: "usr_freelancer"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid review payload"
    });
  });
});

test("POST /api/reviews creates valid authenticated reviews", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      rating: 5,
      text: "Great work",
      jobId: "job_1",
      freelancerId: "usr_freelancer"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_/);
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.text, "Great work");
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.freelancerId, "usr_freelancer");
  });
});
