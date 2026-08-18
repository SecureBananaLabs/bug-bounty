import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs rejects an inverted budget range", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Landing page refresh",
        description: "Refresh the marketing landing page copy and layout.",
        budgetMin: 5000,
        budgetMax: 1000,
        categoryId: "design",
        skills: ["figma"]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /budgetMax/);
  });
});

test("POST /api/jobs accepts a valid budget range", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Landing page refresh",
        description: "Refresh the marketing landing page copy and layout.",
        budgetMin: 1000,
        budgetMax: 5000,
        categoryId: "design",
        skills: ["figma"]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "open");
    assert.equal(payload.data.budgetMin, 1000);
    assert.equal(payload.data.budgetMax, 5000);
  });
});
