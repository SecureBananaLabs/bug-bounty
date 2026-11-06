import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/proposals with valid payload returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const validPayload = {
    coverLetter: "I have 5+ years of full-stack engineering experience and can deliver this flawlessly.",
    bidAmount: 1500,
    estDuration: "2 weeks",
    jobId: "job_12345",
    freelancerId: "usr_freelancer_1"
  };

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload)
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.bidAmount, 1500);
  assert.equal(data.data.jobId, "job_12345");
  assert.ok(data.data.id);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/proposals rejects non-positive bid amounts with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const invalidPayload = {
    coverLetter: "I will do this work for free or negative amount.",
    bidAmount: -50,
    estDuration: "1 week",
    jobId: "job_12345"
  };

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invalidPayload)
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");
  assert.ok(Array.isArray(data.errors));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/proposals rejects too short cover letter with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const invalidPayload = {
    coverLetter: "Hi",
    bidAmount: 500,
    estDuration: "3 days",
    jobId: "job_12345"
  };

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invalidPayload)
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/proposals rejects missing required fields with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const missingJobIdPayload = {
    coverLetter: "I am ready to complete this project immediately.",
    bidAmount: 750,
    estDuration: "5 days"
  };

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(missingJobIdPayload)
  });
  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
