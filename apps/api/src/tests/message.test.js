import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/messages returns 201 for valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: "Hello",
        recipientId: "usr_2",
        jobId: "job_101"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.content, "Hello");
    assert.equal(payload.data.recipientId, "usr_2");
    assert.equal(payload.data.jobId, "job_101");
    assert.equal(payload.data.sentAt.length > 0, true);
  });
});

test("POST /api/messages returns 400 for invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: "",
        recipientId: "",
        jobId: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid message request");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.some((issue) => issue.path.includes("content")));
  });
});

test("POST /api/messages ignores caller supplied system fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: "msg_bad",
        sentAt: "2000-01-01T00:00:00.000Z",
        content: "Ping",
        recipientId: "usr_4",
        jobId: "job_102"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.notEqual(payload.data.id, "msg_bad");
    assert.notEqual(payload.data.sentAt, "2000-01-01T00:00:00.000Z");
    assert.equal(payload.data.content, "Ping");
  });
});
