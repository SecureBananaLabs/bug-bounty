import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs requires authentication", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Test job",
        description: "A valid job description",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "cat_1",
        skills: ["node"]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /unauthorized/i);
  });
});

test("authenticated callers can create jobs", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Test job",
        description: "A valid job description",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "cat_1",
        skills: ["node"]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Test job");
  });
});
