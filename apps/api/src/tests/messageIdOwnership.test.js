import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/messages rejects invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "",
        recipientId: "",
        jobId: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid message payload");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.length >= 3);
  });
});

test("POST /api/messages validates input and ignores system fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "msg_attacker_controlled",
        sentAt: "1999-01-01T00:00:00.000Z",
        content: "Project files are ready.",
        recipientId: "usr_freelancer",
        jobId: "job_123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "msg_attacker_controlled");
    assert.notEqual(payload.data.sentAt, "1999-01-01T00:00:00.000Z");
    assert.match(payload.data.id, /^msg_\d+$/);
    assert.doesNotThrow(() => new Date(payload.data.sentAt).toISOString());
    assert.equal(payload.data.content, "Project files are ready.");
    assert.equal(payload.data.recipientId, "usr_freelancer");
    assert.equal(payload.data.jobId, "job_123");
  });
});
