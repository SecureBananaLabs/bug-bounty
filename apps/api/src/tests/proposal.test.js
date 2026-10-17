import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/proposals validates input via Zod schema", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  // Valid payload should succeed
  const res = await fetch(`${base}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      coverLetter: "I have relevant experience for this project and can deliver high quality work.",
      bidAmount: 500
    })
  });

  assert.equal(res.status, 201, "valid proposal should return 201");
  const body = await res.json();
  assert.ok(body.success, "response should indicate success");
  assert.equal(body.data.jobId, "job_123");
  assert.equal(body.data.bidAmount, 500);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/proposals rejects payload with missing required fields", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const res = await fetch(`${base}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400, "empty body should return 400");
  const body = await res.json();
  assert.equal(body.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/proposals rejects negative bidAmount", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const res = await fetch(`${base}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      coverLetter: "I have relevant experience for this project and can deliver high quality work.",
      bidAmount: -50
    })
  });

  assert.equal(res.status, 400, "negative bid should return 400");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
