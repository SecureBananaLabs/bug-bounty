import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps message ids server-owned", async (t) => {
  t.mock.method(Date, "now", () => 1700000000000);

  const message = await sendMessage({
    id: "msg_client_supplied",
    body: "hello"
  });

  assert.equal(message.id, "msg_1700000000000");
});
