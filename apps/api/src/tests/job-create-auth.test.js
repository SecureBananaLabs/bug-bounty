import test from "node:test";
import assert from "node:assert/strict";
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
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: "Landing page redesign",
        description: "Need a fast refresh",
        budgetMin: 1000,
        budgetMax: 1200,
        categoryId: "design",
        skills: ["figma"]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/jobs allows authenticated job creation", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_jobs", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: "Landing page redesign",
        description: "Need a fast refresh",
        budgetMin: 1000,
        budgetMax: 1200,
        categoryId: "design",
        skills: ["figma"]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Landing page redesign");
    assert.equal(payload.data.status, "open");
    assert.equal(payload.data.budgetMin, 1000);
    assert.equal(payload.data.budgetMax, 1200);
    assert.equal(payload.data.categoryId, "design");
    assert.equal(typeof payload.data.id, "string");
  });
});
