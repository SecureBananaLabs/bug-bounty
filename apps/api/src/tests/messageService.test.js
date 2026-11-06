import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("message service returns defensive copies of stored messages", async () => {
  const created = await sendMessage({
    senderId: "client_1",
    recipientId: "freelancer_1",
    body: "Please review the brief.",
  });

  created.body = "mutated returned message";

  const firstList = await listMessages();
  const storedMessage = firstList.find((message) => message.id === created.id);

  assert.equal(storedMessage.body, "Please review the brief.");

  firstList.push({ id: "msg_fake", body: "injected" });
  storedMessage.body = "mutated list message";

  const secondList = await listMessages();
  const preservedMessage = secondList.find((message) => message.id === created.id);

  assert.equal(secondList.some((message) => message.id === "msg_fake"), false);
  assert.equal(preservedMessage.body, "Please review the brief.");
});
