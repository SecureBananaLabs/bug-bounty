import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("User Security & Validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_sender_1", role: "client" });

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/users blocks unauthenticated requests", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "John Doe", email: "john@example.com", role: "client" })
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/users permits authenticated request with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ fullName: "John Doe", email: "john@example.com", role: "client" })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.data.fullName, "John Doe");
  });

  await t.test("POST /api/users rejects invalid payloads", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ fullName: "", email: "not_email" })
    });
    assert.equal(response.status, 500);
  });

  await t.test("POST /api/users ignores client-controlled id", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "usr_override_123",
        fullName: "John Doe",
        email: "john@example.com",
        role: "client"
      })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.notEqual(data.data.id, "usr_override_123");
  });
});
