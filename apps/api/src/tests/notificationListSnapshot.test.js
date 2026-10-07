import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { listNotifications, createNotification } from "../services/notificationService.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("listNotifications returns an independent snapshot", async () => {
  await createNotification({ userId: "usr_1", message: "first" });

  const before = await listNotifications();
  const length = before.length;
  await createNotification({ userId: "usr_1", message: "second" });

  // The snapshot taken before the second write must not grow with the store.
  assert.equal(before.length, length);
  assert.equal((await listNotifications()).length, length + 1);
});

test("notification route exposes stored notifications", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const tokenHeaders = { authorization: "Bearer unused", "content-type": "application/json" };

    const before = (await (await fetch(`${base}/api/notifications`, { headers: tokenHeaders })).json())
      .data.length;

    const created = await fetch(`${base}/api/notifications`, {
      method: "POST",
      headers: tokenHeaders,
      body: JSON.stringify({ userId: "usr_1", message: "your job was reviewed" })
    });
    assert.equal(created.status, 201);

    const after = await (await fetch(`${base}/api/notifications`, { headers: tokenHeaders })).json();
    assert.equal(after.data.length, before + 1);
    assert.equal(after.data[after.data.length - 1].message, "your job was reviewed");
  } finally {
    await close(server);
  }
});
