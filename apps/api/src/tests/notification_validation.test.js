import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetNotifications, listNotifications } from "../services/notificationService.js";

test("Notification Validation & Backing Array Encapsulation", async (t) => {
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

  await t.test("POST /api/notifications rejects payload with missing or empty userId", async () => {
    const missingRes = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Your proposal was accepted!"
      })
    });
    assert.equal(missingRes.status, 400);

    const emptyRes = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "   ",
        message: "Your proposal was accepted!"
      })
    });
    assert.equal(emptyRes.status, 400);
  });

  await t.test("POST /api/notifications rejects payload with missing or empty message", async () => {
    const missingRes = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_100"
      })
    });
    assert.equal(missingRes.status, 400);

    const emptyRes = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_100",
        message: "   "
      })
    });
    assert.equal(emptyRes.status, 400);
  });

  await t.test("POST /api/notifications rejects oversized message (> 500 chars)", async () => {
    const longMessage = "N".repeat(501);
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_100",
        message: longMessage
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("POST /api/notifications accepts valid notification and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_200",
        message: "Payment of $500 received.",
        type: "payment"
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.userId, "usr_200");
    assert.equal(body.data.message, "Payment of $500 received.");
    assert.equal(body.data.read, false);
    assert.match(body.data.id, /^ntf_/);
  });

  await t.test("listNotifications returns a defensive snapshot array", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_300",
        message: "Milestone completed."
      })
    });
    assert.equal(res.status, 201);

    const snapshot = await listNotifications();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listNotifications();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
