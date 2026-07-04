import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/jobs require clientId", async (t) => {
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

  await t.test("rejects job creation without clientId with 400", async () => {
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
        skills: ["node"]
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("accepts job creation with valid clientId with 201", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        clientId: "usr_client",
        title: "Build API",
        description: "Build marketplace API",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "cat_backend",
        skills: ["node"]
      })
    });
    assert.equal(res.status, 201);
  });
});
