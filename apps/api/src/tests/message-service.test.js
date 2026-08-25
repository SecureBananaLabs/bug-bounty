import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("listMessages returns a defensive array snapshot", async () => {
  await sendMessage({ fromUserId: "usr_1", toUserId: "usr_2", body: "Hello" });

  const firstResult = await listMessages();
  firstResult.length = 0;
  firstResult.push({ id: "injected" });

  const secondResult = await listMessages();

  assert.ok(secondResult.some((message) => message.body === "Hello"));
  assert.equal(secondResult.some((message) => message.id === "injected"), false);
});
