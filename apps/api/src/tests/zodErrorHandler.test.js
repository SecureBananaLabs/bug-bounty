import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(app, run) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs returns 400 for invalid Zod payload", async () => {
  const app = createApp();

  await withTestServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify({
        title: "abc",
        description: "short",
        budgetMin: -1,
        budgetMax: "100",
        categoryId: ""
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation error");
    assert.ok(Array.isArray(payload.errors));
    assert.ok(payload.errors.some((error) => error.path.includes("title")));
  });
});
