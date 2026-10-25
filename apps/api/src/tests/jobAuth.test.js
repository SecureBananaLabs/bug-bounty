import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/jobs auth enforcement regression test suite", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/jobs`;

  await t.test("Fail: returns 401 when request lacks authorization header", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Senior Backend Developer",
        description: "Must have 5 years Node.js experience.",
        budgetMin: 50,
        budgetMax: 100,
        categoryId: "cat_1"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /unauthorized/i);
  });

  await t.test("Success: allows job creation when presenting a valid token", async () => {
    const validToken = signAccessToken({ sub: "usr_test_employer", role: "client" });
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({
        title: "Senior Backend Developer",
        description: "Must have 5 years Node.js experience.",
        budgetMin: 50,
        budgetMax: 100,
        categoryId: "cat_1"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Senior Backend Developer");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
