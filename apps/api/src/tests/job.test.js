import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Job API — budget validation", async (t) => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/jobs — rejects budgetMin > budgetMax", async () => {
    const payload = {
      title: "Test Job Title",
      description: "A detailed job description for testing",
      budgetMin: 5000,
      budgetMax: 1000,
      categoryId: "cat_1",
      skills: ["javascript"]
    };

    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(body.errors);
  });

  await t.test("POST /api/jobs — accepts budgetMin <= budgetMax", async () => {
    const payload = {
      title: "Valid Job",
      description: "A valid job description for testing",
      budgetMin: 1000,
      budgetMax: 5000,
      categoryId: "cat_1",
      skills: ["javascript"]
    };

    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.title, "Valid Job");
    assert.equal(body.data.budgetMin, 1000);
    assert.equal(body.data.budgetMax, 5000);
  });

  await t.test("POST /api/jobs — accepts budgetMin equal to budgetMax", async () => {
    const payload = {
      title: "Equal Budget Job",
      description: "A job where min equals max budget",
      budgetMin: 3000,
      budgetMax: 3000,
      categoryId: "cat_2",
      skills: []
    };

    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.budgetMin, 3000);
    assert.equal(body.data.budgetMax, 3000);
  });

  // Clean up server
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
