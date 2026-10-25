import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validPayload = {
  title: "Build API integrations",
  description: "Need a freelancer to build integrations quickly.",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "backend",
  skills: ["node.js"]
};

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs accepts budget range when max >= min", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload)
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.budgetMin, 500);
    assert.equal(payload.data.budgetMax, 1000);
  });
});

test("POST /api/jobs rejects inverted budget range when max < min", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validPayload, budgetMin: 1000, budgetMax: 500 })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid job payload");
  });
});
