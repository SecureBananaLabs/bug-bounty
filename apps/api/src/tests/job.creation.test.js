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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs preserves server-owned id and status", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "evil",
        title: "Build landing page",
        description: "Create a responsive landing page for a campaign.",
        budgetMin: 100,
        budgetMax: 300,
        categoryId: "cat_web",
        skills: ["react"],
        status: "closed"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^job_/);
    assert.equal(payload.data.status, "open");
    assert.equal(payload.data.title, "Build landing page");
    assert.equal(payload.data.budgetMin, 100);
    assert.equal(payload.data.budgetMax, 300);
  });
});
