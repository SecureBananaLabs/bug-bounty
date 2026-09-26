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

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST content endpoints reject malformed payloads", async () => {
  await withServer(async (port) => {
    const cases = [
      ["/api/proposals", { bidAmount: 0 }, "Invalid proposal payload"],
      ["/api/messages", { body: "", senderId: "usr_1" }, "Invalid message payload"],
      ["/api/reviews", { rating: 6, comment: "x", reviewerId: "usr_1", revieweeId: "usr_2" }, "Invalid review payload"],
      ["/api/users", { email: "bad-email", password: "short", fullName: "" }, "Invalid user payload"],
      ["/api/notifications", { userId: "usr_1", title: " ", body: "hello" }, "Invalid notification payload"],
      ["/api/payments", { amount: -1 }, "Invalid payment payload"]
    ];

    for (const [path, payload, message] of cases) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(body, { success: false, message });
    }
  });
});

test("POST content endpoints accept valid payloads", async () => {
  await withServer(async (port) => {
    const cases = [
      ["/api/proposals", { coverLetter: "Strong product and API experience", bidAmount: 120, estDuration: "2 weeks", jobId: "job_1", freelancerId: "usr_1" }],
      ["/api/messages", { body: "Project update", senderId: "usr_1", receiverId: "usr_2" }],
      ["/api/reviews", { rating: 5, comment: "Great work", reviewerId: "usr_1", revieweeId: "usr_2" }],
      ["/api/users", { email: "user@example.com", password: "password123", role: "client", fullName: "Test User" }],
      ["/api/notifications", { userId: "usr_1", title: "New alert", body: "You have a new message" }],
      ["/api/payments", { amount: 125, currency: "usd", jobId: "job_1" }]
    ];

    for (const [path, payload] of cases) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.success, true);
    }
  });
});
