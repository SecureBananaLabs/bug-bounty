import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/register fullName validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  await t.test("rejects registration without fullName", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "securepassword123",
        role: "client"
      })
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });

  await t.test("rejects registration with empty fullName", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "",
        email: "test2@example.com",
        password: "securepassword123",
        role: "client"
      })
    });
    assert.equal(response.status, 400);
  });

  await t.test("accepts registration with valid fullName and returns it", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Jane Doe",
        email: "jane@example.com",
        password: "securepassword123",
        role: "client"
      })
    });
    assert.equal(response.status, 201);
    
    const payload = await response.json();
    assert.ok(payload.success);
    assert.equal(payload.data.fullName, "Jane Doe");
    assert.equal(payload.data.email, "jane@example.com");
    assert.ok(payload.data.token);
  });
});
