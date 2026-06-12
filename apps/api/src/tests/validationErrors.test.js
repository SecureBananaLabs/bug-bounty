import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/register returns 400 for invalid payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation error");
    assert.ok(payload.errors.some((issue) => issue.path.includes("email")));
    assert.ok(payload.errors.some((issue) => issue.path.includes("password")));
  });
});

test("POST /api/jobs returns 400 for invalid job payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Bug",
        description: "too short",
        budgetMin: -1,
        budgetMax: 100,
        categoryId: "",
        skills: [""]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation error");
    assert.ok(payload.errors.some((issue) => issue.path.includes("title")));
    assert.ok(payload.errors.some((issue) => issue.path.includes("budgetMin")));
    assert.ok(payload.errors.some((issue) => issue.path.includes("categoryId")));
  });
});
