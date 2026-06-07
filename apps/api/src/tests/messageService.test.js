import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps server-owned fields authoritative", async () => {
  const message = await sendMessage({
    id: "client-controlled-id",
    sentAt: "2000-01-01T00:00:00.000Z",
    body: "Hello",
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "client-controlled-id");
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.equal(message.body, "Hello");
});
