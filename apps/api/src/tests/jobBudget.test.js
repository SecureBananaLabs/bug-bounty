import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJob(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

const basePayload = {
  title: "Build a thing",
  description: "Detailed description here",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_1",
  skills: ["javascript"]
};

test("POST /api/jobs accepts a valid budget range", async () => {
  await withServer(async (port) => {
    const response = await postJob(port, basePayload);
    assert.equal(response.status, 201);
  });
});

test("POST /api/jobs rejects inverted budget range (max < min)", async () => {
  await withServer(async (port) => {
    const response = await postJob(port, { ...basePayload, budgetMin: 500, budgetMax: 100 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/jobs rejects inverted budget range (max = 0, min = 100)", async () => {
  await withServer(async (port) => {
    const response = await postJob(port, { ...basePayload, budgetMin: 100, budgetMax: 0 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/jobs accepts equal budget min/max", async () => {
  await withServer(async (port) => {
    const response = await postJob(port, { ...basePayload, budgetMin: 200, budgetMax: 200 });
    assert.equal(response.status, 201);
  });
});

test("createJobSchema rejects negative budget", async () => {
  const result = createJobSchema.safeParse({ ...basePayload, budgetMin: -1 });
  assert.equal(result.success, false);
});

test("updateJobSchema rejects inverted range when both budgets present", async () => {
  const result = updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);
});

test("updateJobSchema accepts partial update with only budgetMin", async () => {
  const result = updateJobSchema.safeParse({ budgetMin: 500 });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with only budgetMax", async () => {
  const result = updateJobSchema.safeParse({ budgetMax: 500 });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts valid range when both budgets present", async () => {
  const result = updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 500 });
  assert.equal(result.success, true);
});
