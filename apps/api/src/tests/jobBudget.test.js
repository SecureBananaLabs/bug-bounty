import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/jobs budget range validation", async (t) => {
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
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("allows valid budget range", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Frontend Developer Needed",
        description: "Must know React and Tailwind CSS",
        budgetMin: 50,
        budgetMax: 100,
        categoryId: "cat_frontend",
        skills: ["react", "css"]
      })
    });
    assert.equal(res.status, 201);
  });

  await t.test("allows equal budget min and max", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Backend Engineer",
        description: "Need Node.js developer for long term",
        budgetMin: 150,
        budgetMax: 150,
        categoryId: "cat_backend",
        skills: ["node"]
      })
    });
    assert.equal(res.status, 201);
  });

  await t.test("rejects inverted budget range", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Fullstack Developer",
        description: "Help build an Express API backend",
        budgetMin: 200,
        budgetMax: 100,
        categoryId: "cat_fullstack",
        skills: ["express"]
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
