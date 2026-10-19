import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Notification routes auth enforcement", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/notifications`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("GET /api/notifications rejects unauthenticated requests with 401", async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  await t.test("POST /api/notifications rejects unauthenticated requests with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Project Approved", type: "system" }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  await t.test("POST /api/notifications rejects invalid token with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid_token_xyz",
      },
      body: JSON.stringify({ title: "Project Approved", type: "system" }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });

  await t.test("GET /api/notifications returns 200 with valid token", async () => {
    const token = signAccessToken({ id: "user_notif_1", role: "freelancer" });
    const res = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  await t.test("POST /api/notifications creates notification with valid token with 201", async () => {
    const token = signAccessToken({ id: "user_notif_1", role: "freelancer" });
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: "New Bid Received", type: "proposal_alert" }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.title, "New Bid Received");
    assert.equal(data.data.read, false);
    assert.ok(data.data.id);
  });
});
