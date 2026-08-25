import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-supplied id", async () => {
  const message = await sendMessage({ id: "attacker-controlled", body: "hello" });

  assert.notEqual(message.id, "attacker-controlled");
  assert.match(message.id, /^msg_\d+$/);
  assert.equal(message.body, "hello");
});
