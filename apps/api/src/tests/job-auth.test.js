import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("job creation requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const listResponse = await fetch(`${baseUrl}/api/jobs`);
    assert.equal(listResponse.status, 200);

    const createResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Build a dashboard",
        description: "Create a useful dashboard for clients",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "cat_analytics",
        skills: ["react"]
      })
    });
    assert.equal(createResponse.status, 401);
  });
});
