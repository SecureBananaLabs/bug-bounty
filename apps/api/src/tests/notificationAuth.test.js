import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("notification endpoint authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ id: "usr_123", role: "client" });

  await t.test("POST /api/notifications without authorization header", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_123",
        type: "job_alert",
        message: "New job available"
      })
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/notifications with invalid token", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid_token"
      },
      body: JSON.stringify({
        userId: "usr_123",
        type: "job_alert",
        message: "New job available"
      })
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/notifications with valid token", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: "usr_123",
        type: "job_alert",
        message: "New job available"
      })
    });
    assert.equal(response.status, 201);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
