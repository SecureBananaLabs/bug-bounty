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
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("protected APIs reject unauthenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const protectedGetEndpoints = ["/api/users", "/api/jobs"];

    const protectedPostEndpoints = [
      "/api/payments",
      "/api/notifications",
      "/api/messages",
      "/api/reviews",
      "/api/proposals",
      "/api/uploads",
    ];

    for (const path of protectedGetEndpoints) {
      const response = await fetch(`${baseUrl}${path}`);
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.equal(payload.message, "Unauthorized");

      const postResponse = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "attempt" }),
      });
      const postPayload = await postResponse.json();
      assert.equal(postResponse.status, 401);
      assert.equal(postPayload.message, "Unauthorized");
    }

    for (const path of protectedPostEndpoints) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "attempt" }),
      });
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.equal(payload.message, "Unauthorized");
    }

    const register = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "pay+notify@test.io", password: "password123" }),
    });
    const registerPayload = await register.json();
    const token = registerPayload.data?.token;
    assert.equal(register.status, 201);
    assert.ok(typeof token === "string" && token.length > 10);

    const privilegedRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin+attempt@test.io", password: "password123", role: "admin" }),
    });
    const privilegedPayload = await privilegedRegister.json();
    const privilegedToken = privilegedPayload.data?.token;
    assert.equal(privilegedRegister.status, 201);
    assert.ok(typeof privilegedToken === "string" && privilegedToken.length > 10);

    const deniedAdmin = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: `Bearer ${privilegedToken}`,
      },
    });
    const deniedPayload = await deniedAdmin.json();
    assert.equal(deniedAdmin.status, 403);
    assert.equal(deniedPayload.message, "Forbidden");

    const paymentResponse = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: 100, currency: "usd" }),
    });
    const paymentPayload = await paymentResponse.json();
    assert.equal(paymentResponse.status, 201);
    assert.equal(paymentPayload.success, true);

    const notificationResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: "hijack-id",
        read: true,
        title: "title-from-client",
      }),
    });
    const notificationPayload = await notificationResponse.json();
    assert.equal(notificationResponse.status, 201);
    assert.equal(notificationPayload.success, true);
    assert.equal(notificationPayload.data.read, false);
    assert.notEqual(notificationPayload.data.id, "hijack-id");
    assert.ok(notificationPayload.data.id.startsWith("ntf_"));

    const messageResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: "hello from auth user",
      }),
    });
    const messagePayload = await messageResponse.json();
    assert.equal(messageResponse.status, 201);
    assert.equal(messagePayload.success, true);
    assert.ok(messagePayload.data.id.startsWith("msg_"));

    const searchMissing = await fetch(`${baseUrl}/api/search`);
    const searchMissingPayload = await searchMissing.json();
    assert.equal(searchMissing.status, 400);
    assert.ok(["Search query is required", "Required"].includes(searchMissingPayload.message));

    const searchLong = await fetch(`${baseUrl}/api/search?q=${"x".repeat(129)}`);
    const searchLongPayload = await searchLong.json();
    assert.equal(searchLong.status, 400);
    assert.equal(searchLongPayload.message, "Search query is too long");

    const searchValid = await fetch(`${baseUrl}/api/search?q=job`);
    const searchValidPayload = await searchValid.json();
    assert.equal(searchValid.status, 200);
    assert.equal(searchValidPayload.success, true);
    assert.equal(searchValidPayload.data.query, "job");
  });
});
