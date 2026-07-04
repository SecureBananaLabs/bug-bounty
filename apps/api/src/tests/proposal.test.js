import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Proposal API Validation Flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/proposals with empty body returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/proposals with missing coverLetter returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bidAmount: 250,
        estDuration: "3 days",
        jobId: "job_1",
        freelancerId: "user_1"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/proposals with negative bidAmount returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverLetter: "I would love to work on this project and deliver high quality code.",
        bidAmount: -10,
        estDuration: "3 days",
        jobId: "job_1",
        freelancerId: "user_1"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/proposals with valid data returns 201", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverLetter: "I would love to work on this project and deliver high quality code.",
        bidAmount: 250,
        estDuration: "3 days",
        jobId: "job_1",
        freelancerId: "user_1"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.bidAmount, 250);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
