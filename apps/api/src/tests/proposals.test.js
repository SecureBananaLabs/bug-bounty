import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/proposals creates proposal with valid payload", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_456",
      bidAmount: 750,
      coverLetter: "I am an expert full-stack developer with 5 years experience in building high-scale apps.",
      estimatedDays: 14
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.bidAmount, 750);
  assert.equal(payload.data.jobId, "job_456");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/proposals rejects invalid bidAmount (<=0) or short coverLetter with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_456",
      bidAmount: -50,
      coverLetter: "too short",
      estimatedDays: 0
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Validation failed");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
