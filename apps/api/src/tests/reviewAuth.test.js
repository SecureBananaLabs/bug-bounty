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

const reviewPayload = {
  jobId: "job_123",
  reviewerId: "usr_client",
  revieweeId: "usr_freelancer",
  rating: 5,
  comment: "Great delivery"
};

test("POST /api/reviews rejects missing bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reviewPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/reviews rejects invalid bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        authorization: "Bearer not-a-valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify(reviewPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Invalid token");
  });
});

test("POST /api/reviews creates review with a valid bearer token", async () => {
  await withServer(async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "client@example.com", password: "password123" })
    });
    const loginPayload = await loginResponse.json();

    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${loginPayload.data.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(reviewPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.jobId, reviewPayload.jobId);
    assert.equal(payload.data.rating, reviewPayload.rating);
    assert.match(payload.data.id, /^rev_/);
  });
});

test("GET /api/reviews remains public", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`);

    assert.equal(response.status, 200);
  });
});
