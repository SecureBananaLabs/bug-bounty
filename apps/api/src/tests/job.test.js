import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("job flow integration tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/jobs fails without authentication", async () => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Node.js Developer",
        description: "Looking for an expert Node.js developer with 5+ years experience.",
        budgetMin: 50,
        budgetMax: 100,
        categoryId: "web-dev",
        skills: ["node.js", "express"]
      })
    });

    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });

  await t.test("POST /api/jobs succeeds with valid token", async () => {
    const token = signAccessToken({ id: "user_123", email: "client@example.com", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Senior Node.js Developer",
        description: "Looking for an expert Node.js developer with 5+ years experience.",
        budgetMin: 50,
        budgetMax: 100,
        categoryId: "web-dev",
        skills: ["node.js", "express"]
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.id);
    assert.equal(payload.data.title, "Senior Node.js Developer");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
