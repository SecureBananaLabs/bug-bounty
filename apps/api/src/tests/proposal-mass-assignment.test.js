import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/proposals strips unknown fields", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I am the best candidate for this job.",
      proposedBudget: 500,
      estimatedDays: 7,
      adminApproved: true,
      featured: true,
      priority: "urgent",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.ok(data.ok);
  assert.equal(data.data.jobId, "job_123");
  assert.equal(data.data.adminApproved, undefined);
  assert.equal(data.data.featured, undefined);
  assert.equal(data.data.priority, undefined);

  await closeServer(server);
});

test("POST /api/proposals rejects missing required fields", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job_123" }),
  });

  assert.equal(response.status, 400);

  await closeServer(server);
});
