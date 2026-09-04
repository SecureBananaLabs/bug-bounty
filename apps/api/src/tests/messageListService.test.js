import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("listMessages returns defensive snapshots", async () => {
  await sendMessage({
    fromUserId: "usr_sender",
    toUserId: "usr_receiver",
    body: "Snapshot message"
  });

  const firstList = await listMessages();
  firstList.push({ id: "injected", body: "Injected message" });
  firstList[0].body = "Mutated message";

  const secondList = await listMessages();

  assert.equal(secondList.some((message) => message.id === "injected"), false);
  assert.equal(secondList.some((message) => message.body === "Mutated message"), false);
  assert.equal(secondList.some((message) => message.body === "Snapshot message"), true);
});
