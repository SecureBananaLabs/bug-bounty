import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("message service keeps ids and stored records server-owned", async () => {
  const message = await sendMessage({
    id: "client-message-id",
    senderId: "user_1",
    recipientId: "user_2",
    content: "Hello"
  });

  assert.notEqual(message.id, "client-message-id");
  assert.equal(message.content, "Hello");

  message.content = "mutated response";
  const firstList = await listMessages();
  assert.equal(firstList.at(-1).content, "Hello");

  firstList.at(-1).content = "mutated list item";
  const secondList = await listMessages();
  assert.equal(secondList.at(-1).content, "Hello");
});
