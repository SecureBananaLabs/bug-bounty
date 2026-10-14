import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/proposals returns createdAt timestamp", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      freelancerId: "user_456",
      coverLetter: "I am interested in this job",
      bidAmount: 500,
      estimatedDays: 7
    })
  });

  assert.equal(res.status, 201, "Should return 201 for valid proposal");
  const data = await res.json();
  assert.ok(data.data.createdAt, "Should include createdAt timestamp");
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.data.createdAt), "Should be ISO timestamp");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/proposals ignores caller-supplied createdAt", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const fakeTimestamp = "2000-01-01T00:00:00.000Z";
  const res = await fetch(`${baseURL}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      freelancerId: "user_456",
      coverLetter: "I am interested",
      bidAmount: 500,
      estimatedDays: 7,
      createdAt: fakeTimestamp
    })
  });

  const data = await res.json();
  const actualTimestamp = new Date(data.data.createdAt).getTime();
  const fakeTimestampMs = new Date(fakeTimestamp).getTime();
  const now = Date.now();

  assert.ok(actualTimestamp > fakeTimestampMs, "Server timestamp should be newer than caller-supplied");
  assert.ok(Math.abs(actualTimestamp - now) < 60000, "Server timestamp should be recent");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
