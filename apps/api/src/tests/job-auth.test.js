import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validJob = {
  title: "Build an API integration",
  description: "Connect the existing API to a partner service.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "cat_dev",
  skills: ["Node.js"]
};

async function postJob(baseUrl, body, token) {
  const headers = { "content-type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

test("job creation rejects missing bearer auth", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJob(baseUrl, validJob);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("job creation preserves authenticated valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const { response, payload } = await postJob(baseUrl, validJob, token);

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^job_/);
    assert.equal(payload.data.title, validJob.title);
  });
});
