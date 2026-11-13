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
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("POST /api/notifications with valid payload returns 201 and creates notification", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_charlie_1",
        type: "PAYMENT_RECEIVED",
        message: "You received a payment of $700.00 USDC for completing the security audit.",
        link: "/dashboard/payments/p_999"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.userId, "usr_charlie_1");
    assert.equal(body.data.type, "PAYMENT_RECEIVED");
    assert.equal(body.data.read, false);
    assert.ok(body.data.id.startsWith("ntf_"));
  });
});

test("POST /api/notifications with minimal valid payload (no optional link) returns 201", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_charlie_1",
        type: "SYSTEM_ALERT",
        message: "Your daemon completed a full multi-platform synchronization cycle."
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.userId, "usr_charlie_1");
  });
});

test("POST /api/notifications rejects missing userId with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SYSTEM_ALERT",
        message: "Alert without recipient."
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(Array.isArray(body.issues));
  });
});

test("POST /api/notifications rejects missing type with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_charlie_1",
        message: "Message without type category."
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/notifications rejects empty message with 400", async () => {
  await withServer(async (baseUrl) => {
    for (const emptyMsg of ["", "   "]) {
      const res = await fetch(`${baseUrl}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "usr_charlie_1",
          type: "SYSTEM_ALERT",
          message: emptyMsg
        })
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.equal(body.message, "Validation failed");
    }
  });
});

test("POST /api/notifications rejects oversized message (>1000 chars) with 400", async () => {
  await withServer(async (baseUrl) => {
    const hugeMsg = "A".repeat(1001);
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_charlie_1",
        type: "SYSTEM_ALERT",
        message: hugeMsg
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/notifications rejects unknown extra fields (strict schema) with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_charlie_1",
        type: "SYSTEM_ALERT",
        message: "Legitimate notification message.",
        adminBypass: true
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});
