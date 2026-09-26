import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage preserves the server-generated id", async () => {
  const result = await sendMessage({
    senderId: "usr_1",
    receiverId: "usr_2",
    content: "hello",
    id: "msg_attacker_supplied"
  });

  assert.equal(result.senderId, "usr_1");
  assert.equal(result.receiverId, "usr_2");
  assert.equal(result.content, "hello");
  assert.match(result.id, /^msg_\d+$/);
  assert.notEqual(result.id, "msg_attacker_supplied");
});
