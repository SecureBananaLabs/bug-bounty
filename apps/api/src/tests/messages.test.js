import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Message routes auth enforcement", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/messages`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("GET /api/messages rejects unauthenticated requests with 401", async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  await t.test("POST /api/messages rejects unauthenticated requests with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: "usr_client_9", content: "Hello there" }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  await t.test("POST /api/messages rejects invalid token with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid_token_abc",
      },
      body: JSON.stringify({ recipientId: "usr_client_9", content: "Hello there" }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });

  await t.test("GET /api/messages returns 200 with valid token", async () => {
    const token = signAccessToken({ id: "user_msg_sender", role: "freelancer" });
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

  await t.test("POST /api/messages sends message with valid token with 201", async () => {
    const token = signAccessToken({ id: "user_msg_sender", role: "freelancer" });
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipientId: "usr_client_9", content: "Ready to start the milestone." }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.content, "Ready to start the milestone.");
    assert.ok(data.data.id);
    assert.ok(data.data.sentAt);
  });
});
