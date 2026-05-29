import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";
import { sendMessage } from "../services/messageService.js";

test("createUser ignores caller-supplied id", async () => {
  const user = await createUser({ id: "attacker_id", email: "test@test.com" });
  assert.notEqual(user.id, "attacker_id");
  assert.ok(user.id.startsWith("usr_"));
  assert.equal(user.email, "test@test.com");
});

test("sendMessage ignores caller-supplied id", async () => {
  const msg = await sendMessage({ id: "attacker_id", text: "hello" });
  assert.notEqual(msg.id, "attacker_id");
  assert.ok(msg.id.startsWith("msg_"));
  assert.equal(msg.text, "hello");
  assert.ok(msg.sentAt);
});
