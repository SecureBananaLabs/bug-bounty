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
  title: "Build auth guard",
  description: "Add bearer auth to job creation",
  budgetMin: 10,
  budgetMax: 20,
  categoryId: "cat_1",
  skills: ["api"]
};

test("GET /api/jobs remains public", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });
});

test("POST /api/jobs rejects missing token and accepts authenticated requests", async () => {
  await withServer(async (port) => {
    const missing = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(jobPayload)
    });
    const missingPayload = await missing.json();

    assert.equal(missing.status, 401);
    assert.deepEqual(missingPayload, {
      success: false,
      message: "Unauthorized"
    });

    const token = signAccessToken({ sub: "usr_jobs", role: "freelancer" });
    const authorized = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(jobPayload)
    });
    const authorizedPayload = await authorized.json();

    assert.equal(authorized.status, 201);
    assert.equal(authorizedPayload.success, true);
    assert.equal(authorizedPayload.data.title, jobPayload.title);
    assert.equal(authorizedPayload.data.categoryId, jobPayload.categoryId);
  });
});
