import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetMessages, listMessages } from "../services/messageService.js";

test("Message Detail By ID & Array Encapsulation", async (t) => {
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

  await t.test("GET /api/messages/:id returns 404 when message does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/messages/non_existent_msg`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Message not found");
  });

  await t.test("POST /api/messages creates a message and GET /api/messages/:id resolves it", async () => {
    const createRes = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "usr_recipient123",
        content: "Here is the audit milestone report."
      })
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    const messageId = createBody.data.id;
    assert.ok(messageId);
    assert.match(messageId, /^msg_/);
    assert.ok(createBody.data.sentAt);

    // Resolve by ID
    const getRes = await fetch(`${baseUrl}/api/messages/${messageId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.id, messageId);
    assert.equal(getBody.data.to, "usr_recipient123");
    assert.equal(getBody.data.content, "Here is the audit milestone report.");
    assert.ok(getBody.data.sentAt);
  });

  await t.test("listMessages returns a defensive snapshot array", async () => {
    const createRes = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "usr_team456",
        content: "Deployment complete."
      })
    });
    assert.equal(createRes.status, 201);

    const snapshot = await listMessages();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listMessages();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
