import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("message creation rejects invalid request bodies", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: "",
        recipientId: "",
        jobId: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation error");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.some((issue) => issue.path.includes("content")));
    assert.ok(payload.issues.some((issue) => issue.path.includes("recipientId")));
    assert.ok(payload.issues.some((issue) => issue.path.includes("jobId")));
  });
});

test("message creation stores only validated message fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "msg_attacker",
        content: "I can help with this job.",
        recipientId: "usr_client",
        jobId: "job_123",
        sentAt: "2000-01-01T00:00:00.000Z"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_/);
    assert.notEqual(payload.data.id, "msg_attacker");
    assert.equal(payload.data.content, "I can help with this job.");
    assert.equal(payload.data.recipientId, "usr_client");
    assert.equal(payload.data.jobId, "job_123");
    assert.notEqual(payload.data.sentAt, "2000-01-01T00:00:00.000Z");
  });
});
