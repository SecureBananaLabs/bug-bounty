import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Notification routes require authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/notifications`;

  await t.test("GET /api/notifications rejects unauthenticated request with 401 Unauthorized", async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("POST /api/notifications rejects unauthenticated request with 401 Unauthorized", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_recipient_1",
        type: "job_alert",
        message: "Unauthorized notification"
      })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("rejects requests with invalid Bearer token with 401 Invalid token", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: "Bearer invalid.token.payload" }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
