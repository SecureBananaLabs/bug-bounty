import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/jobs requires authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/jobs`;

  await t.test("rejects unauthenticated request with 401 Unauthorized", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Node.js Developer",
        description: "Build robust scalable APIs with Express and Zod",
        budgetMin: 1000,
        budgetMax: 2000,
        categoryId: "cat_1"
      })
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("rejects request with invalid Bearer token with 401 Invalid token", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.jwt.token"
      },
      body: JSON.stringify({
        title: "Senior Node.js Developer",
        description: "Build robust scalable APIs with Express and Zod",
        budgetMin: 1000,
        budgetMax: 2000,
        categoryId: "cat_1"
      })
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
