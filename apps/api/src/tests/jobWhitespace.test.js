import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/jobs whitespace validation", async (t) => {
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

  await t.test("rejects job creation with whitespace-only fields with 400", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "    ",
        description: "          ",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "   ",
        skills: ["   "]
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("accepts valid fields and trims normalization", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "   Valid Title   ",
        description: "   Valid Description long enough   ",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "   cat_backend   ",
        skills: ["   react   ", "   node   "]
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.title, "Valid Title");
    assert.equal(body.data.description, "Valid Description long enough");
    assert.equal(body.data.categoryId, "cat_backend");
    assert.deepEqual(body.data.skills, ["react", "node"]);
  });
});
