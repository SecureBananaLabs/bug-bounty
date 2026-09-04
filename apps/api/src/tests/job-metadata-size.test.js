import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
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
}

function validJob(overrides = {}) {
  return {
    title: "Build checkout flow",
    description: "Implement a checkout flow with payment status tracking.",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "web",
    skills: ["node", "api"],
    ...overrides
  };
}

async function postJob(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/jobs accepts normal job metadata", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJob(baseUrl, validJob());

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Build checkout flow");
    assert.deepEqual(payload.data.skills, ["node", "api"]);
  });
});

test("POST /api/jobs rejects oversized titles", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJob(baseUrl, validJob({ title: "x".repeat(121) }));

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid job payload"
    });
  });
});

test("POST /api/jobs rejects too many skills", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJob(baseUrl, validJob({ skills: Array(26).fill("api") }));

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid job payload"
    });
  });
});

test("POST /api/jobs rejects oversized skill names", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJob(baseUrl, validJob({ skills: ["x".repeat(81)] }));

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid job payload"
    });
  });
});
