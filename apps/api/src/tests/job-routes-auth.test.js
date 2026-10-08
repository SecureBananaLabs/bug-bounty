import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const validJob = {
  title: "Landing page build",
  description: "Build a responsive marketing landing page",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "web",
  skills: ["react"],
};

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

test("GET /api/jobs remains public", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(Array.isArray(payload.data), true);
  });
});

test("POST /api/jobs rejects anonymous requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validJob),
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized",
    });
  });
});

test("POST /api/jobs accepts authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(validJob),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^job_\d+$/);
    assert.equal(payload.data.status, "open");
    assert.equal(payload.data.title, validJob.title);
  });
});
