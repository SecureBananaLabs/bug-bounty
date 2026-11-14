import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        server
      });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/proposals rejects payloads missing estimatedDuration", async () => {
  const { baseUrl, server } = await listen(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job-101",
        freelancerId: "usr_freelancer",
        coverLetter: "I can deliver this project with a focused milestone plan.",
        bidAmount: 1200
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /estimatedDuration/);
  } finally {
    await close(server);
  }
});

test("POST /api/proposals accepts payloads with estimatedDuration", async () => {
  const { baseUrl, server } = await listen(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job-101",
        freelancerId: "usr_freelancer",
        coverLetter: "I can deliver this project with a focused milestone plan.",
        bidAmount: 1200,
        estimatedDuration: "2 weeks"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.estimatedDuration, "2 weeks");
  } finally {
    await close(server);
  }
});
