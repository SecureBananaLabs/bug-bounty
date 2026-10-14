import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

test("GET /api/search returns matching marketplace groups", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=api`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "api");
    assert.deepEqual(
      payload.data.jobs.map((job) => job.id),
      ["job-102"]
    );
    assert.deepEqual(payload.data.freelancers, []);
  });
});

test("GET /api/search matches case-insensitive freelancer skills", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=NEXT`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "next");
    assert.deepEqual(
      payload.data.freelancers.map((freelancer) => freelancer.username),
      ["maya-dev"]
    );
  });
});

test("GET /api/search keeps blank queries empty", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.data, {
      query: "",
      users: [],
      jobs: [],
      freelancers: []
    });
  });
});
