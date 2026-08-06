import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/jobs - authentication checks", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/api/jobs`;

  await t.test("should return 401 if unauthorized (no header)", async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Node developer",
        description: "Must write clean async code",
        budgetMin: 1000,
        budgetMax: 5000,
        categoryId: "cat_1",
      }),
    });
    assert.equal(response.status, 401);
  });

  await t.test("should return 401 if invalid token", async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid_token",
      },
      body: JSON.stringify({
        title: "Senior Node developer",
        description: "Must write clean async code",
        budgetMin: 1000,
        budgetMax: 5000,
        categoryId: "cat_1",
      }),
    });
    assert.equal(response.status, 401);
  });

  await t.test("should pass authentication with valid token", async () => {
    const token = signAccessToken({ userId: "123", role: "user" });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Senior Node developer",
        description: "Must write clean async code and tests",
        budgetMin: 1000,
        budgetMax: 5000,
        categoryId: "cat_1",
      }),
    });
    // With valid payload and valid auth, it should successfully create the job
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.ok(payload.success);
    assert.equal(payload.data.title, "Senior Node developer");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
