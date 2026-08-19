import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Proposal API", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/proposals`;

  await t.test("POST /api/proposals creates proposal successfully with valid data", async () => {
    const payload = {
      coverLetter: "This is a very professional cover letter for the project.",
      bidAmount: 250,
      estDuration: "5 days",
      jobId: "job_123",
      freelancerId: "usr_456"
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.ok(body.data.id.startsWith("prp_"));
    assert.equal(body.data.coverLetter, payload.coverLetter);
    assert.equal(body.data.bidAmount, payload.bidAmount);
    assert.equal(body.data.estDuration, payload.estDuration);
    assert.equal(body.data.jobId, payload.jobId);
    assert.equal(body.data.freelancerId, payload.freelancerId);
  });

  await t.test("POST /api/proposals rejects short coverLetter", async () => {
    const payload = {
      coverLetter: "Short",
      bidAmount: 250,
      estDuration: "5 days",
      jobId: "job_123",
      freelancerId: "usr_456"
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    assert.equal(response.status, 400);
  });

  await t.test("POST /api/proposals rejects non-positive bidAmount", async () => {
    const payload = {
      coverLetter: "This is a very professional cover letter for the project.",
      bidAmount: -10,
      estDuration: "5 days",
      jobId: "job_123",
      freelancerId: "usr_456"
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    assert.equal(response.status, 400);
  });

  await t.test("POST /api/proposals ignores client-controlled id", async () => {
    const payload = {
      id: "hacked_id_123",
      coverLetter: "This is a very professional cover letter for the project.",
      bidAmount: 500,
      estDuration: "2 weeks",
      jobId: "job_789",
      freelancerId: "usr_999"
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.notEqual(body.data.id, "hacked_id_123");
    assert.ok(body.data.id.startsWith("prp_"));
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
