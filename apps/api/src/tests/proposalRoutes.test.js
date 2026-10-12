import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test("POST /api/proposals without token returns 401 Unauthorized", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "job-101", coverLetter: "hello", bidAmount: 500 }),
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await server.close();
  }
});

test("POST /api/proposals with invalid token returns 401 Invalid token", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid.proposal.token",
      },
      body: JSON.stringify({ jobId: "job-101", coverLetter: "test" }),
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  } finally {
    await server.close();
  }
});

test("POST /api/proposals with valid bearer token succeeds with 201", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ id: "user_freelancer_1", email: "freelancer@example.com" });
    const response = await fetch(`${server.baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobId: "job-101",
        coverLetter: "I have 5 years experience with React and Node.",
        bidAmount: 750,
      }),
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
  } finally {
    await server.close();
  }
});

test("GET /api/proposals remains accessible without auth", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/proposals`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
  } finally {
    await server.close();
  }
});
