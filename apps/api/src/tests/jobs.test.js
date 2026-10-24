import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Job routes auth enforcement", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/jobs`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("GET /api/jobs remains accessible without authentication", async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  await t.test("POST /api/jobs rejects unauthenticated requests with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Fullstack Engineer",
        description: "Looking for an experienced fullstack engineer to build modern SaaS platforms.",
        budgetMin: 3000,
        budgetMax: 6000,
        categoryId: "cat_eng_1",
        skills: ["Node.js", "React"]
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  await t.test("POST /api/jobs rejects invalid token with 401", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid_bearer_token",
      },
      body: JSON.stringify({
        title: "Senior Fullstack Engineer",
        description: "Looking for an experienced fullstack engineer to build modern SaaS platforms.",
        budgetMin: 3000,
        budgetMax: 6000,
        categoryId: "cat_eng_1",
        skills: ["Node.js", "React"]
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });

  await t.test("POST /api/jobs allows authenticated user to create a job with 201", async () => {
    const token = signAccessToken({ id: "client_user_1", role: "client" });
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Senior Fullstack Engineer",
        description: "Looking for an experienced fullstack engineer to build modern SaaS platforms.",
        budgetMin: 3000,
        budgetMax: 6000,
        categoryId: "cat_eng_1",
        skills: ["Node.js", "React"]
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.title, "Senior Fullstack Engineer");
    assert.ok(data.data.id);
  });
});
