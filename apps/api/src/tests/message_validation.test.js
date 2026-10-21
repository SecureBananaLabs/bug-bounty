import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetMessages, listMessages } from "../services/messageService.js";

test("Message Validation & Backing Array Encapsulation", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    _resetMessages();
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("POST /api/messages rejects payload with missing or empty 'to'", async () => {
    const missingRes = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Hello there!"
      })
    });
    assert.equal(missingRes.status, 400);

    const emptyRes = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "   ",
        content: "Hello there!"
      })
    });
    assert.equal(emptyRes.status, 400);
  });

  await t.test("POST /api/messages rejects payload with missing or empty 'content'", async () => {
    const missingRes = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "user_123"
      })
    });
    assert.equal(missingRes.status, 400);

    const emptyRes = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "user_123",
        content: "   "
      })
    });
    assert.equal(emptyRes.status, 400);
  });

  await t.test("POST /api/messages rejects oversized content (> 2000 chars)", async () => {
    const longContent = "A".repeat(2001);
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "user_123",
        content: longContent
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("POST /api/messages accepts valid message and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "user_999",
        content: "Let's proceed with the project milestones."
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.to, "user_999");
    assert.equal(body.data.content, "Let's proceed with the project milestones.");
    assert.match(body.data.id, /^msg_/);
    assert.ok(body.data.sentAt);
  });

  await t.test("listMessages returns a defensive snapshot array", async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "user_555",
        content: "Snapshot test message"
      })
    });
    assert.equal(res.status, 201);

    const snapshot = await listMessages();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listMessages();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
