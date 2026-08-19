import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function jsonPost(body, token) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  };
}

test("POST /api/payments requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/payments`,
      jsonPost({
        amount: 1200,
        currency: "usd"
      })
    );
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/payments accepts a valid access token", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "user_1", role: "client" });
    const response = await fetch(
      `${baseUrl}/api/payments`,
      jsonPost(
        {
          amount: 1200,
          currency: "usd"
        },
        token
      )
    );
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.amount, 1200);
    assert.equal(payload.data.currency, "usd");
  });
});

test("GET /api/proposals requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/proposals requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/proposals`,
      jsonPost({
        jobId: "job_1",
        freelancerId: "user_2",
        coverLetter: "I can help ship this safely.",
        bidAmount: 800
      })
    );
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Unauthorized");

});
});
