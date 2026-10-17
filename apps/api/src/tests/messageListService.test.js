import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("listMessages returns a defensive array copy", async () => {
  const message = await sendMessage({ body: "Hello" });
  const listedMessages = await listMessages();

  listedMessages.length = 0;

  const nextListedMessages = await listMessages();

  assert.equal(nextListedMessages.length, 1);
  assert.equal(nextListedMessages[0], message);
});
