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

const jobPayload = {
  title: "Build a secure payments dashboard",
  description: "Need an engineer to implement payment flows with tests.",
  budgetMin: 1000,
  budgetMax: 2500,
  categoryId: "engineering",
  skills: ["node", "payments"]
};

test("POST /api/jobs rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(jobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/jobs allows authenticated requests", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_jobs", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(jobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, jobPayload.title);
    assert.equal(payload.data.description, jobPayload.description);
    assert.equal(payload.data.budgetMin, jobPayload.budgetMin);
    assert.equal(payload.data.budgetMax, jobPayload.budgetMax);
    assert.equal(payload.data.categoryId, jobPayload.categoryId);
    assert.deepEqual(payload.data.skills, jobPayload.skills);
    assert.equal(payload.data.status, "open");
    assert.equal(typeof payload.data.id, "string");
  });
});
