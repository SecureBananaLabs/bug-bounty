import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    payload: await response.json()
  };
}

test("create endpoints return 400 for missing required request body fields", async () => {
  await withServer(async (baseUrl) => {
    const cases = [
      ["/api/messages", { body: "hello", senderId: "usr_1" }],
      ["/api/notifications", { userId: "usr_1", title: "New work" }],
      ["/api/payments", { amount: 20 }],
      ["/api/proposals", { jobId: "job_1", coverLetter: "Available today" }],
      ["/api/reviews", { rating: 5, comment: "Great" }],
      ["/api/users", { email: "person@example.com", fullName: "Person" }]
    ];

    for (const [path, body] of cases) {
      const result = await postJson(baseUrl, path, body);
      assert.equal(result.status, 400, path);
      assert.equal(result.payload.success, false, path);
      assert.equal(result.payload.message, "Invalid request body", path);
      assert.ok(Array.isArray(result.payload.issues), path);
    }
  });
});

test("validated create endpoints reject client-owned system fields", async () => {
  await withServer(async (baseUrl) => {
    const result = await postJson(baseUrl, "/api/notifications", {
      id: "ntf_client",
      read: true,
      userId: "usr_1",
      title: "Invoice paid",
      body: "Payment released"
    });

    assert.equal(result.status, 400);
    assert.equal(result.payload.success, false);
    assert.equal(result.payload.message, "Invalid request body");
  });
});

test("validated create endpoint accepts a complete proposal payload", async () => {
  await withServer(async (baseUrl) => {
    const result = await postJson(baseUrl, "/api/proposals", {
      jobId: "job_1",
      coverLetter: "I can deliver this today.",
      estimatedDuration: "1 day",
      rate: 75
    });

    assert.equal(result.status, 201);
    assert.equal(result.payload.success, true);
    assert.equal(result.payload.data.jobId, "job_1");
    assert.equal(result.payload.data.coverLetter, "I can deliver this today.");
    assert.equal(result.payload.data.estimatedDuration, "1 day");
    assert.equal(result.payload.data.rate, 75);
  });
});
