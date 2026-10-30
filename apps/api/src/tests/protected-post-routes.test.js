import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function assertUnauthorizedPost(path, body) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/notifications requires authentication", async () => {
  await assertUnauthorizedPost("/api/notifications", {
    userId: "usr_1",
    message: "Test notification",
    type: "info"
  });
});

test("POST /api/payments requires authentication", async () => {
  await assertUnauthorizedPost("/api/payments", {
    amount: 100,
    currency: "USD",
    proposalId: "prp_1"
  });
});

test("POST /api/users requires authentication", async () => {
  await assertUnauthorizedPost("/api/users", {
    name: "Unauthorized User",
    email: "unauth@example.com",
    role: "client"
  });
});
