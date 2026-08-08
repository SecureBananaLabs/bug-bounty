import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const jobPayload = {
  title: "Build secure checkout",
  description: "Implement a secure checkout flow for clients.",
  budgetMin: 1000,
  budgetMax: 2000,
  categoryId: "cat_web",
  skills: ["node", "security"]
};

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs rejects anonymous job creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(jobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/jobs allows authenticated job creation", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_employer", role: "client" });
    const response = await fetch(`${baseUrl}/api/jobs`, {
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
    assert.equal(payload.data.status, "open");
  });
});
