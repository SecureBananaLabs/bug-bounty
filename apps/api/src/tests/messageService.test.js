import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage preserves the server-generated message id", async () => {
  const message = await sendMessage({
    id: "msg_client_controlled",
    fromUserId: "usr_1",
    toUserId: "usr_2",
    body: "Hello"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.equal(message.fromUserId, "usr_1");
  assert.equal(message.toUserId, "usr_2");
  assert.equal(message.body, "Hello");
  assert.ok(message.sentAt);
});
