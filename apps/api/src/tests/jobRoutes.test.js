import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const withTestServer = async (run) => {
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
};

const validJobPayload = {
  title: "Build webhook integration",
  description: "Implement a small webhook integration for testing.",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "cat_development",
  skills: ["node"]
};

test("POST /api/jobs requires authentication", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validJobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/jobs creates a job for authenticated users", async () => {
  await withTestServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(validJobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, validJobPayload.title);
    assert.equal(payload.data.status, "open");
  });
});
