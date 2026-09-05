import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /proposals rejects missing estDuration", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r, e) => server.once("listening", r).once("error", e));
  const { port } = server.address();

  // Missing estDuration → 400
  let res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250,
    }),
  });
  assert.equal(res.status, 400);

  // Extra fields → 400 (strict schema)
  res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "Cover",
      bidAmount: 100,
      estDuration: "2 weeks",
      isAdmin: true,
    }),
  });
  assert.equal(res.status, 400);

  // Valid proposal → 201
  res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250,
      estDuration: "3 days",
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.success);
  assert.equal(body.data.estDuration, "3 days");
  assert.ok(body.data.id.startsWith("prp_"));

  await new Promise((r, e) => server.close((err) => (err ? e(err) : r())));
});
