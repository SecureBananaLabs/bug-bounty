import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("registration role self-assignment restriction", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await t.test("POST /api/auth/register with admin role", async () => {
      const email = `admin_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "password123",
          role: "admin"
        })
      });
      if (response.status !== 400) {
        console.error("ADMIN REGISTRATION FAILED:", response.status, await response.text());
      }
      assert.equal(response.status, 400);
    });

    await t.test("POST /api/auth/register with client role", async () => {
      const email = `client_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "password123",
          role: "client"
        })
      });
      if (response.status !== 201) {
        console.error("CLIENT REGISTRATION FAILED:", response.status, await response.text());
      }
      assert.equal(response.status, 201);
    });

    await t.test("POST /api/auth/register with freelancer role", async () => {
      const email = `freelancer_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "password123",
          role: "freelancer"
        })
      });
      if (response.status !== 201) {
        console.error("FREELANCER REGISTRATION FAILED:", response.status, await response.text());
      }
      assert.equal(response.status, 201);
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
