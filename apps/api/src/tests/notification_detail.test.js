import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetNotifications, listNotifications } from "../services/notificationService.js";

test("Notification Detail By ID & Array Encapsulation", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    _resetNotifications();
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

  await t.test("GET /api/notifications/:id returns 404 when notification does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/non_existent_ntf`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Notification not found");
  });

  await t.test("POST /api/notifications creates a notification and GET /api/notifications/:id resolves it", async () => {
    const createRes = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_alice123",
        message: "You have been awarded a bounty payout."
      })
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    const notificationId = createBody.data.id;
    assert.ok(notificationId);
    assert.match(notificationId, /^ntf_/);
    assert.equal(createBody.data.read, false);

    // Resolve by ID
    const getRes = await fetch(`${baseUrl}/api/notifications/${notificationId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.id, notificationId);
    assert.equal(getBody.data.userId, "usr_alice123");
    assert.equal(getBody.data.message, "You have been awarded a bounty payout.");
    assert.equal(getBody.data.read, false);
  });

  await t.test("listNotifications returns a defensive snapshot array", async () => {
    const createRes = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_bob456",
        message: "Security audit passed."
      })
    });
    assert.equal(createRes.status, 201);

    const snapshot = await listNotifications();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listNotifications();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
