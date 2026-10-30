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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJob(baseUrl, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
}

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for the product launch.",
  budgetMin: 500,
  budgetMax: 900,
  categoryId: "cat_design",
  skills: ["design", "nextjs"]
};

test("POST /api/jobs rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJob(baseUrl, validJob);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/jobs rejects invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJob(baseUrl, validJob, "not-a-valid-token");
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid token" });
  });
});

test("POST /api/jobs accepts valid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await postJob(baseUrl, validJob, token);
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.match(body.data.id, /^job_/);
    assert.equal(body.data.title, validJob.title);
  });
});
