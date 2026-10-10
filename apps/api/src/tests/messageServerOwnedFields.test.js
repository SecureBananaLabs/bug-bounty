import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage keeps the generated id even when the payload supplies one", async () => {
  const payload = {
    id: "caller-supplied",
    sentAt: "2020-01-01T00:00:00.000Z",
    fromUserId: "usr_1",
    toUserId: "usr_2",
    body: "Hello"
  };

  const message = await sendMessage(payload);

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "caller-supplied");
  assert.equal(message.fromUserId, "usr_1");
  assert.equal(message.toUserId, "usr_2");
  assert.equal(message.body, "Hello");
  assert.notEqual(message.sentAt, "2020-01-01T00:00:00.000Z");
  assert.ok(Number.isFinite(Date.parse(message.sentAt)));
});

test("sendMessage does not mutate the payload and stores the record", async () => {
  const payload = { fromUserId: "usr_3", toUserId: "usr_4", body: "Ping" };
  const before = (await listMessages()).length;

  const message = await sendMessage(payload);

  assert.deepEqual(payload, { fromUserId: "usr_3", toUserId: "usr_4", body: "Ping" });

  const after = await listMessages();
  assert.equal(after.length, before + 1);
  assert.equal(after.at(-1).id, message.id);
  assert.equal(after.at(-1).body, "Ping");
});
