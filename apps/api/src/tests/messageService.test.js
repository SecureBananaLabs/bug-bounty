import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("message service does not expose its internal message store", async () => {
  const initialMessages = await listMessages();
  const initialCount = initialMessages.length;

  const created = await sendMessage({
    id: "msg_client_controlled",
    conversationId: "conv_defensive_copy",
    senderId: "usr_sender",
    body: "Please keep the internal store private"
  });

  assert.match(created.id, /^msg_\d+$/);
  assert.notEqual(created.id, "msg_client_controlled");
  created.body = "mutated through returned create payload";

  const listedMessages = await listMessages();
  assert.equal(listedMessages.length, initialCount + 1);
  assert.equal(listedMessages.at(-1).body, "Please keep the internal store private");

  listedMessages.push({
    id: "msg_client_injected",
    conversationId: "conv_defensive_copy",
    senderId: "usr_attacker",
    body: "injected through list result"
  });
  listedMessages.at(-2).body = "mutated through list result";

  const reloadedMessages = await listMessages();
  assert.equal(reloadedMessages.length, initialCount + 1);
  assert.equal(reloadedMessages.at(-1).id, created.id);
  assert.equal(reloadedMessages.at(-1).body, "Please keep the internal store private");
  assert.equal(
    reloadedMessages.some((message) => message.id === "msg_client_injected"),
    false
  );
});
