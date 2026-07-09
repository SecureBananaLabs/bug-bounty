import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/jobs skills uniqueness validation", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("rejects job creation with exact duplicate skills with 400", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "Build API",
        description: "Build marketplace API",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "cat_backend",
        skills: ["react", "react"]
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects job creation with case-insensitive duplicate skills with 400", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "Build API",
        description: "Build marketplace API",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "cat_backend",
        skills: ["React", "react"]
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("accepts job creation with unique skills with 201", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "Build API",
        description: "Build marketplace API",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "cat_backend",
        skills: ["react", "node"]
      })
    });
    assert.equal(res.status, 201);
  });
});
