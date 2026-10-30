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
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST controllers reject invalid request bodies", async () => {
  await withServer(async (baseUrl) => {
    const paths = [
      "/api/messages",
      "/api/notifications",
      "/api/payments",
      "/api/proposals",
      "/api/reviews",
      "/api/users"
    ];

    for (const path of paths) {
      const response = await postJson(baseUrl, path, {});
      const payload = await response.json();

      assert.equal(response.status, 400, path);
      assert.equal(payload.success, false, path);
      assert.equal(payload.message, "Invalid request body", path);
      assert.ok(Array.isArray(payload.issues), path);
      assert.ok(payload.issues.length > 0, path);
    }
  });
});

test("POST controllers accept validated payloads", async () => {
  await withServer(async (baseUrl) => {
    const cases = [
      ["/api/messages", { senderId: "usr_1", recipientId: "usr_2", body: "Hello" }],
      ["/api/notifications", { userId: "usr_1", type: "proposal", message: "New proposal" }],
      ["/api/payments", { amount: 125, currency: "usd" }],
      [
        "/api/proposals",
        {
          jobId: "job_1",
          freelancerId: "usr_2",
          coverLetter: "I can ship this quickly.",
          bidAmount: 500
        }
      ],
      ["/api/reviews", { reviewerId: "usr_1", revieweeId: "usr_2", rating: 5, comment: "Great work" }],
      ["/api/users", { email: "person@example.com", name: "Person Example", role: "client" }]
    ];

    for (const [path, body] of cases) {
      const response = await postJson(baseUrl, path, body);
      const payload = await response.json();

      assert.equal(response.status, 201, path);
      assert.equal(payload.success, true, path);
      assert.ok(payload.data, path);
    }
  });
});
