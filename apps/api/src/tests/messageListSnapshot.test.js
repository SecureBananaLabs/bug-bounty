import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { listMessages, sendMessage } from "../services/messageService.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("listMessages returns an independent snapshot", async () => {
  await sendMessage({ fromUserId: "usr_1", toUserId: "usr_2", body: "first" });

  const before = await listMessages();
  const length = before.length;
  await sendMessage({ fromUserId: "usr_2", toUserId: "usr_1", body: "second" });

  // The snapshot taken before the second write must not grow with the store.
  assert.equal(before.length, length);
  assert.equal((await listMessages()).length, length + 1);
});

test("message route exposes stored messages", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    const before = (await (await fetch(`${base}/api/messages`)).json()).data.length;

    const created = await fetch(`${base}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromUserId: "usr_1", toUserId: "usr_2", body: "hello there" })
    });
    assert.equal(created.status, 201);

    const after = await (await fetch(`${base}/api/messages`)).json();
    assert.equal(after.data.length, before + 1);
    assert.equal(after.data[after.data.length - 1].body, "hello there");
  } finally {
    await close(server);
  }
});
