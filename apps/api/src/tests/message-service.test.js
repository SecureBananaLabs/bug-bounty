import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("listMessages returns a defensive snapshot", async () => {
  const created = await sendMessage({ conversationId: "conv_1", body: "hello" });
  const listed = await listMessages();

  listed.push({ id: "msg_injected", conversationId: "conv_2" });

  const listedAgain = await listMessages();

  assert.ok(listedAgain.some((message) => message.id === created.id));
  assert.equal(
    listedAgain.some((message) => message.id === "msg_injected"),
    false,
  );
});
